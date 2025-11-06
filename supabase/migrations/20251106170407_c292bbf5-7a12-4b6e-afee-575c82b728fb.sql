-- Add UPDATE policy for posts table so users can like posts
CREATE POLICY "Anyone can like posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);