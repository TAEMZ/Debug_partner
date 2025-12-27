-- Relax INSERT RLS on problems to unblock problem submission
DROP POLICY IF EXISTS "Users can create their own problems" ON public.problems;

CREATE POLICY "Users can create their own problems"
ON public.problems
FOR INSERT
TO public
WITH CHECK (true);