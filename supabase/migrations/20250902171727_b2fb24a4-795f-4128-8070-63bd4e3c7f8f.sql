-- Reset previous admin and update/create admin user
UPDATE profiles 
SET is_admin = false 
WHERE email = 'adserboard@gmail.com';

-- Insert admin profile (if the auth user doesn't exist yet, this will be created when they register)
INSERT INTO profiles (
    user_id, 
    name, 
    email, 
    is_admin, 
    balance, 
    total_earnings, 
    quizzes_played, 
    quizzes_won, 
    rank
) VALUES (
    gen_random_uuid(), -- Temporary UUID, will be updated when real user registers
    'Admin',
    'games@learn2earn',
    true,
    1000,
    0,
    0,
    0,
    1
) ON CONFLICT (email) DO UPDATE SET 
    is_admin = true;