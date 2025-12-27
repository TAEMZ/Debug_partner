-- Update log_activity function to safely handle different table columns
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    target_problem_id UUID;
    payload JSONB;
BEGIN
    -- Determine user_id and problem_id based on the table
    -- We use IF/ELSIF to avoid "record has no field" errors that occur in CASE statements
    IF TG_TABLE_NAME = 'problems' THEN
        target_user_id := NEW.user_id;
        target_problem_id := NEW.id;
    ELSIF TG_TABLE_NAME = 'insights' THEN
        SELECT user_id INTO target_user_id FROM public.problems WHERE id = NEW.problem_id;
        target_problem_id := NEW.problem_id;
    ELSIF TG_TABLE_NAME = 'insight_comments' THEN
        target_user_id := NEW.user_id;
        SELECT problem_id INTO target_problem_id FROM public.insights WHERE id = NEW.insight_id;
    END IF;

    IF TG_OP = 'INSERT' THEN
        payload := to_jsonb(NEW);
        INSERT INTO public.activity_feed (user_id, problem_id, action_type, action_details)
        VALUES (target_user_id, target_problem_id, TG_TABLE_NAME || '_created', payload);
    ELSIF TG_OP = 'UPDATE' THEN
        payload := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
        INSERT INTO public.activity_feed (user_id, problem_id, action_type, action_details)
        VALUES (target_user_id, target_problem_id, TG_TABLE_NAME || '_updated', payload);
    END IF;
    
    RETURN NEW;
END;
$$;
