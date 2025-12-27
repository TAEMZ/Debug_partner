-- Unschedule the previous job to avoid conflicts
SELECT cron.unschedule('invoke-schedule-sessions');

-- Schedule the job again with safe JSON construction
SELECT
  cron.schedule(
    'invoke-schedule-sessions',
    '* * * * *', -- Every minute
    $$
    SELECT
      net.http_post(
        url:='https://vbbvdixskqabhgtxadcc.supabase.co/functions/v1/schedule-sessions',
        headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
        ),
        body:='{}'::jsonb
      ) AS request_id;
    $$
  );
