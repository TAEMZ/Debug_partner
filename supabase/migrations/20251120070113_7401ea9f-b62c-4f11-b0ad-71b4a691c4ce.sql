-- Drop the existing INSERT policy and recreate with proper authentication check
DROP POLICY IF EXISTS "Users can create their own problems" ON public.problems;

-- Recreate INSERT policy with authenticated check and user_id validation
CREATE POLICY "Users can create their own problems"
ON public.problems
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);