-- Confirm email and set admin status for games@learn2earn.com
-- First update the auth.users table to confirm the email
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'games@learn2earn.com' AND email_confirmed_at IS NULL;

-- Create or update profile with admin privileges
INSERT INTO profiles (user_id, name, email, country, balance, total_earnings, quizzes_played, quizzes_won, rank, is_admin)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', 'Admin User') as name,
    'games@learn2earn.com' as email,
    COALESCE(au.raw_user_meta_data->>'country', 'Nigeria') as country,
    1000 as balance,
    0 as total_earnings,
    0 as quizzes_played,
    0 as quizzes_won,
    1 as rank,
    true as is_admin
FROM auth.users au 
WHERE au.email = 'games@learn2earn.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    is_admin = true,
    balance = 1000,
    rank = 1;