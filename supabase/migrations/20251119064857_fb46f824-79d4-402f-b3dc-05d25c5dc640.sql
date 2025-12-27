-- Create security definer function to check problem access without recursion
CREATE OR REPLACE FUNCTION public.user_can_view_problem(_user_id uuid, _problem_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM problems WHERE id = _problem_id AND user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM problem_shares ps
    INNER JOIN auth.users u ON u.email = ps.shared_with_email
    WHERE ps.problem_id = _problem_id 
      AND u.id = _user_id
      AND ps.accepted = true
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their own and shared problems" ON public.problems;

-- Create new policy using the security definer function
CREATE POLICY "Users can view their own and shared problems"
ON public.problems
FOR SELECT
USING (public.user_can_view_problem(auth.uid(), id));