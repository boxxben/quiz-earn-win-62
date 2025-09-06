-- Set admin status directly for games@learn2earn email
INSERT INTO profiles (user_id, name, email, country, balance, total_earnings, quizzes_played, quizzes_won, rank, is_admin)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', 'Admin') as name,
    'games@learn2earn' as email,
    COALESCE(au.raw_user_meta_data->>'country', '') as country,
    1000 as balance,
    0 as total_earnings,
    0 as quizzes_played,
    0 as quizzes_won,
    1 as rank,
    true as is_admin
FROM auth.users au 
WHERE au.email = 'games@learn2earn'
ON CONFLICT (user_id) 
DO UPDATE SET 
    is_admin = true,
    balance = 1000,
    rank = 1;