-- Clean up all demo/mock data
DELETE FROM public.quizzes;
DELETE FROM public.profiles WHERE email LIKE '%demo%' OR email = 'games@learn2earn';
DELETE FROM public.transactions;

-- Reset quiz questions table to be empty for now - admin will add real quizzes
UPDATE public.quizzes SET questions = '[]'::jsonb WHERE id IS NOT NULL;