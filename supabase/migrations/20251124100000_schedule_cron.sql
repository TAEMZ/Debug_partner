-- Enable pg_cron extension
create extension if not exists "pg_cron" with schema "extensions";

-- Schedule the schedule-sessions function to run every minute
select
  cron.schedule(
    'invoke-schedule-sessions',
    '* * * * *', -- Every minute
    $$
    select
      net.http_post(
        url:='https://vbbvdixskqabhgtxadcc.supabase.co/functions/v1/schedule-sessions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );
