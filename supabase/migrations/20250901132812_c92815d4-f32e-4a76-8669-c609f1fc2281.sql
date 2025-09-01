-- Create admin user and some test users
-- Insert admin user first
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT 
    gen_random_uuid(),
    'games@learn2earn',
    crypt('@2025L&e#Admin', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"name": "Admin User", "country": "Nigeria"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'games@learn2earn');

-- Get admin user ID for profile creation
DO $$
DECLARE 
    admin_user_id uuid;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'games@learn2earn' LIMIT 1;
    
    -- Insert admin profile
    INSERT INTO public.profiles (user_id, name, email, country, is_admin, balance, total_earnings, quizzes_played, quizzes_won)
    VALUES (
        admin_user_id,
        'Admin User',
        'games@learn2earn', 
        'Nigeria',
        true,
        5000,
        0,
        0,
        0
    )
    ON CONFLICT (user_id) DO UPDATE SET
        is_admin = true,
        name = 'Admin User',
        email = 'games@learn2earn',
        country = 'Nigeria';
END $$;

-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    entry_fee integer NOT NULL DEFAULT 0,
    prize_pool integer NOT NULL DEFAULT 0,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    duration integer NOT NULL DEFAULT 15, -- Duration in minutes
    status text NOT NULL DEFAULT 'upcoming',
    is_available boolean NOT NULL DEFAULT true,
    questions jsonb NOT NULL DEFAULT '[]',
    reward_progression jsonb NOT NULL DEFAULT '[]',
    penalty_amount integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Create policies for quizzes (read-only for users, full access for admins)
CREATE POLICY "Users can view all quizzes" 
ON public.quizzes 
FOR SELECT 
TO authenticated
USING (true);

-- Admin policies for quizzes
CREATE POLICY "Admins can insert quizzes" 
ON public.quizzes 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can update quizzes" 
ON public.quizzes 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can delete quizzes" 
ON public.quizzes 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_quizzes_updated_at
BEFORE UPDATE ON public.quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample quizzes
INSERT INTO public.quizzes (title, description, entry_fee, prize_pool, start_time, end_time, duration, status, questions, reward_progression, penalty_amount) VALUES
(
    'Win Big Challenge',
    'Answer questions correctly to win amazing prizes',
    500, -- 10 diamonds = 500 kobo
    5000, -- 100 diamonds = 5000 kobo  
    now() + interval '2 hours',
    now() + interval '3 hours',
    15,
    'upcoming',
    '[
        {"id": "1", "text": "What is the capital of Nigeria?", "options": ["Lagos", "Abuja", "Kano", "Port Harcourt"], "correctOption": 1, "timeLimit": 30},
        {"id": "2", "text": "Which planet is known as the Red Planet?", "options": ["Venus", "Mars", "Jupiter", "Saturn"], "correctOption": 1, "timeLimit": 30},
        {"id": "3", "text": "Who wrote the novel Things Fall Apart?", "options": ["Wole Soyinka", "Chinua Achebe", "Chimamanda Adichie", "Ben Okri"], "correctOption": 1, "timeLimit": 30},
        {"id": "4", "text": "What is the largest ocean on Earth?", "options": ["Atlantic", "Indian", "Arctic", "Pacific"], "correctOption": 3, "timeLimit": 30},
        {"id": "5", "text": "In which year did Nigeria gain independence?", "options": ["1958", "1960", "1962", "1963"], "correctOption": 1, "timeLimit": 30}
    ]'::jsonb,
    '[
        {"questionNumber": 1, "correctReward": 200},
        {"questionNumber": 2, "correctReward": 250},
        {"questionNumber": 3, "correctReward": 350},
        {"questionNumber": 4, "correctReward": 450},
        {"questionNumber": 5, "correctReward": 550}
    ]'::jsonb,
    50
),
(
    'Mega Prize Quiz',
    'High stakes quiz with massive rewards',
    1000, -- 20 diamonds = 1000 kobo
    50000, -- 1000 diamonds = 50000 kobo
    now() + interval '1 hour',
    now() + interval '2 hours',
    20,
    'upcoming',
    '[
        {"id": "1", "text": "What is the capital of Nigeria?", "options": ["Lagos", "Abuja", "Kano", "Port Harcourt"], "correctOption": 1, "timeLimit": 30},
        {"id": "2", "text": "Which planet is known as the Red Planet?", "options": ["Venus", "Mars", "Jupiter", "Saturn"], "correctOption": 1, "timeLimit": 30},
        {"id": "3", "text": "Who wrote the novel Things Fall Apart?", "options": ["Wole Soyinka", "Chinua Achebe", "Chimamanda Adichie", "Ben Okri"], "correctOption": 1, "timeLimit": 30},
        {"id": "4", "text": "What is the largest ocean on Earth?", "options": ["Atlantic", "Indian", "Arctic", "Pacific"], "correctOption": 3, "timeLimit": 30},
        {"id": "5", "text": "In which year did Nigeria gain independence?", "options": ["1958", "1960", "1962", "1963"], "correctOption": 1, "timeLimit": 30}
    ]'::jsonb,
    '[
        {"questionNumber": 1, "correctReward": 2000},
        {"questionNumber": 2, "correctReward": 4000},
        {"questionNumber": 3, "correctReward": 8000},
        {"questionNumber": 4, "correctReward": 16000},
        {"questionNumber": 5, "correctReward": 20000}
    ]'::jsonb,
    200
),
(
    'Diamond Prize Quiz',
    'Ultimate quiz with diamond rewards',
    10000, -- 200 diamonds = 10000 kobo
    200000, -- 4000 diamonds = 200000 kobo
    now() - interval '1 hour',
    now() + interval '30 minutes',
    25,
    'active',
    '[
        {"id": "1", "text": "What is the capital of Nigeria?", "options": ["Lagos", "Abuja", "Kano", "Port Harcourt"], "correctOption": 1, "timeLimit": 30},
        {"id": "2", "text": "Which planet is known as the Red Planet?", "options": ["Venus", "Mars", "Jupiter", "Saturn"], "correctOption": 1, "timeLimit": 30},
        {"id": "3", "text": "Who wrote the novel Things Fall Apart?", "options": ["Wole Soyinka", "Chinua Achebe", "Chimamanda Adichie", "Ben Okri"], "correctOption": 1, "timeLimit": 30},
        {"id": "4", "text": "What is the largest ocean on Earth?", "options": ["Atlantic", "Indian", "Arctic", "Pacific"], "correctOption": 3, "timeLimit": 30},
        {"id": "5", "text": "In which year did Nigeria gain independence?", "options": ["1958", "1960", "1962", "1963"], "correctOption": 1, "timeLimit": 30}
    ]'::jsonb,
    '[
        {"questionNumber": 1, "correctReward": 10000},
        {"questionNumber": 2, "correctReward": 20000},
        {"questionNumber": 3, "correctReward": 40000},
        {"questionNumber": 4, "correctReward": 60000},
        {"questionNumber": 5, "correctReward": 70000}
    ]'::jsonb,
    500
);