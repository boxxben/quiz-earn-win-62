-- Fix recursive RLS on profiles causing 500 errors and blocking login/profile fetch
-- 1) Create a helper function to check admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = uid AND p.is_admin = true
  );
$$;

-- 2) Replace recursive policies with function-based checks
-- Drop existing admin policies that self-reference profiles and cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

-- Recreate admin policies using the helper function
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING ( public.is_admin(auth.uid()) );

CREATE POLICY "Admins can update profiles"
ON public.profiles
FOR UPDATE
USING ( public.is_admin(auth.uid()) )
WITH CHECK ( public.is_admin(auth.uid()) );
