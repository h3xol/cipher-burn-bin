-- Enable the pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the pg_net extension for HTTP requests  
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cleanup function to run every 5 minutes
SELECT cron.schedule(
  'cleanup-expired-pastes',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://klvsdmlqcommhwvlnzal.supabase.co/functions/v1/cleanup-expired-pastes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdnNkbWxxY29tbWh3dmxuemFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMjk1MjAsImV4cCI6MjA2OTYwNTUyMH0.9MgBQo0JBl9ZXmtePQ0k90us-sbH0CT0FCJNRODt5Ig"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);