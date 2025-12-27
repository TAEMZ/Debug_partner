-- Update log_activity function to correctly handle user_id for insights
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Determine the user_id based on the table
    IF TG_TABLE_NAME = 'problems' THEN
        target_user_id := NEW.user_id;
    ELSIF TG_TABLE_NAME = 'insights' THEN
        SELECT user_id INTO target_user_id FROM public.problems WHERE id = NEW.problem_id;
    ELSIF TG_TABLE_NAME = 'insight_comments' THEN
        target_user_id := NEW.user_id;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_feed (user_id, problem_id, action_type, action_details)
        VALUES (
            target_user_id,
            CASE TG_TABLE_NAME
                WHEN 'problems' THEN NEW.id
                WHEN 'insights' THEN NEW.problem_id
                WHEN 'insight_comments' THEN (SELECT problem_id FROM insights WHERE id = NEW.insight_id)
                ELSE NULL
            END,
            TG_TABLE_NAME || '_created',
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.activity_feed (user_id, problem_id, action_type, action_details)
        VALUES (
            target_user_id,
            CASE TG_TABLE_NAME
                WHEN 'problems' THEN NEW.id
                WHEN 'insights' THEN NEW.problem_id
                ELSE NULL
            END,
            TG_TABLE_NAME || '_updated',
            jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        );
    END IF;
    RETURN NEW;
END;
$$;
