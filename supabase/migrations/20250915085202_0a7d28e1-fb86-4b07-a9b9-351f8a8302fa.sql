-- Create table for encrypted pastes
CREATE TABLE public.pastes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'text',
  expiration TEXT NOT NULL DEFAULT '1h',
  burn_after_reading BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  viewed BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.pastes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read pastes (they're encrypted anyway)
CREATE POLICY "Anyone can view pastes" 
ON public.pastes 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to create pastes (anonymous app)
CREATE POLICY "Anyone can create pastes" 
ON public.pastes 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow updating view status
CREATE POLICY "Anyone can update paste view status" 
ON public.pastes 
FOR UPDATE 
USING (true);

-- Create function to set expiration timestamp based on expiration string
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set expiration
CREATE TRIGGER set_paste_expiration_trigger
BEFORE INSERT ON public.pastes
FOR EACH ROW
EXECUTE FUNCTION public.set_paste_expiration();

-- Create index for faster lookups
CREATE INDEX idx_pastes_expires_at ON public.pastes(expires_at);
CREATE INDEX idx_pastes_created_at ON public.pastes(created_at);