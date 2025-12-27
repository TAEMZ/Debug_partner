-- Create trigger to log activity for new insights
DROP TRIGGER IF EXISTS log_insight_activity ON public.insights;
CREATE TRIGGER log_insight_activity
AFTER INSERT ON public.insights
FOR EACH ROW
EXECUTE FUNCTION public.log_activity();
