-- Create quiz_attempts table to track user quiz history
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  reward_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own attempts
CREATE POLICY "Users can view their own attempts"
ON public.quiz_attempts
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own attempts
CREATE POLICY "Users can insert their own attempts"
ON public.quiz_attempts
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can view all attempts
CREATE POLICY "Admins can view all attempts"
ON public.quiz_attempts
FOR SELECT
USING (is_admin(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);