-- Update the existing user to be an admin
UPDATE profiles 
SET is_admin = true 
WHERE email = 'adserboard@gmail.com';