-- Add DELETE policy for pastes to allow deletion of expired and burned pastes
CREATE POLICY "Allow deletion of expired and burned pastes" 
ON public.pastes 
FOR DELETE 
USING (
  -- Allow deletion if paste has expired
  (expires_at IS NOT NULL AND expires_at < now()) 
  OR 
  -- Allow deletion if it's burn after reading and has been viewed
  (burn_after_reading = true AND viewed = true)
  OR
  -- Allow deletion by service role (for cleanup function)
  auth.jwt() ->> 'role' = 'service_role'
);