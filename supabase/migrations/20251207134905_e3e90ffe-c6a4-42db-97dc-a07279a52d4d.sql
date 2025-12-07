-- Allow users to view all profiles (name and avatar only for community features)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create policy that allows users to view all profiles for community features
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
USING (true);