-- Add is_vip column to quizzes table
ALTER TABLE public.quizzes ADD COLUMN is_vip boolean NOT NULL DEFAULT false;