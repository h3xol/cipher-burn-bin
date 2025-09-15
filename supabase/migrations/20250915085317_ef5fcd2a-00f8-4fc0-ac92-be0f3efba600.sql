-- Fix security issue: Set search path for the function
CREATE OR REPLACE FUNCTION public.set_paste_expiration()
RETURNS TRIGGER AS $$
BEGIN
  CASE NEW.expiration
    WHEN '10m' THEN NEW.expires_at := NEW.created_at + INTERVAL '10 minutes';
    WHEN '1h' THEN NEW.expires_at := NEW.created_at + INTERVAL '1 hour';
    WHEN '24h' THEN NEW.expires_at := NEW.created_at + INTERVAL '24 hours';
    WHEN 'burn' THEN NEW.expires_at := NULL; -- No time expiration for burn after reading
    ELSE NEW.expires_at := NEW.created_at + INTERVAL '1 hour'; -- Default fallback
  END CASE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;