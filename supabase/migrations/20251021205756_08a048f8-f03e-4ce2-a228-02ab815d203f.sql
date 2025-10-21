-- Allow users to update their own transactions (to mark as pending approval)
CREATE POLICY "Users can update their own transactions"
ON public.transactions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());