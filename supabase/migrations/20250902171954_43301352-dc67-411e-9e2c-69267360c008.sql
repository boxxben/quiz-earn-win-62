-- Remove the conflicting admin profile to allow fresh registration
DELETE FROM profiles WHERE email = 'games@learn2earn';