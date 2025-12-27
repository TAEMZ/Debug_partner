-- Create enum for problem categories
CREATE TYPE public.problem_category AS ENUM ('bug', 'performance', 'api', 'ui', 'database', 'security', 'other');

-- Create enum for problem severity
CREATE TYPE public.problem_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Create enum for programming languages
CREATE TYPE public.programming_language AS ENUM ('javascript', 'typescript', 'python', 'java', 'csharp', 'ruby', 'go', 'rust', 'php', 'swift', 'kotlin', 'other');

-- Create enum for frameworks
CREATE TYPE public.framework_type AS ENUM ('react', 'vue', 'angular', 'svelte', 'nextjs', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'other');

-- Alter problems table to add new fields
ALTER TABLE public.problems 
ADD COLUMN category public.problem_category DEFAULT 'other',
ADD COLUMN severity public.problem_severity DEFAULT 'medium',
ADD COLUMN language public.programming_language,
ADD COLUMN framework public.framework_type,
ADD COLUMN archived BOOLEAN DEFAULT false,
ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ai_cost NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create comments table for insights
CREATE TABLE public.insight_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on comments
ALTER TABLE public.insight_comments ENABLE ROW LEVEL SECURITY;

-- Create problem shares table
CREATE TABLE public.problem_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL,
    shared_with_email TEXT NOT NULL,
    access_level TEXT DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'editor', 'admin')),
    accepted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on shares
ALTER TABLE public.problem_shares ENABLE ROW LEVEL SECURITY;

-- Create activity feed table
CREATE TABLE public.activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on activity feed
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Create user roles table for workspace collaboration
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role public.workspace_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create email notification preferences table
CREATE TABLE public.email_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    weekly_digest BOOLEAN DEFAULT true,
    new_insights BOOLEAN DEFAULT true,
    comments BOOLEAN DEFAULT true,
    shares BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on email preferences
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insight_comments
CREATE POLICY "Users can view comments on their problems' insights"
ON public.insight_comments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.insights i
        JOIN public.problems p ON p.id = i.problem_id
        WHERE i.id = insight_comments.insight_id
        AND (p.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.problem_shares ps
            WHERE ps.problem_id = p.id AND ps.shared_with_email = auth.email() AND ps.accepted = true
        ))
    )
);

CREATE POLICY "Users can create comments on accessible insights"
ON public.insight_comments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.insights i
        JOIN public.problems p ON p.id = i.problem_id
        WHERE i.id = insight_comments.insight_id
        AND (p.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.problem_shares ps
            WHERE ps.problem_id = p.id AND ps.shared_with_email = auth.email() AND ps.accepted = true
        ))
    ) AND auth.uid() = user_id
);

CREATE POLICY "Users can update their own comments"
ON public.insight_comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.insight_comments
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for problem_shares
CREATE POLICY "Users can view shares for their problems"
ON public.problem_shares
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id FROM public.problems WHERE id = problem_id
    ) OR shared_with_email = auth.email()
);

CREATE POLICY "Problem owners can create shares"
ON public.problem_shares
FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM public.problems WHERE id = problem_id
    ) AND auth.uid() = shared_by
);

CREATE POLICY "Problem owners can update shares"
ON public.problem_shares
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT user_id FROM public.problems WHERE id = problem_id
    )
);

CREATE POLICY "Problem owners can delete shares"
ON public.problem_shares
FOR DELETE
USING (
    auth.uid() IN (
        SELECT user_id FROM public.problems WHERE id = problem_id
    )
);

-- RLS Policies for activity_feed
CREATE POLICY "Users can view their own activity"
ON public.activity_feed
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create activity"
ON public.activity_feed
FOR INSERT
WITH CHECK (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for email_preferences
CREATE POLICY "Users can view their own email preferences"
ON public.email_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences"
ON public.email_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences"
ON public.email_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Update existing problems RLS to include shared access
DROP POLICY IF EXISTS "Users can view their own problems" ON public.problems;

CREATE POLICY "Users can view their own and shared problems"
ON public.problems
FOR SELECT
USING (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM public.problem_shares 
        WHERE problem_id = problems.id 
        AND shared_with_email = auth.email() 
        AND accepted = true
    )
);

-- Create trigger for updated_at on comments
CREATE TRIGGER update_insight_comments_updated_at
BEFORE UPDATE ON public.insight_comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_feed (user_id, problem_id, action_type, action_details)
        VALUES (
            NEW.user_id,
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
            NEW.user_id,
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

-- Add activity logging triggers
CREATE TRIGGER log_problem_activity
AFTER INSERT OR UPDATE ON public.problems
FOR EACH ROW
EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_comment_activity
AFTER INSERT ON public.insight_comments
FOR EACH ROW
EXECUTE FUNCTION public.log_activity();