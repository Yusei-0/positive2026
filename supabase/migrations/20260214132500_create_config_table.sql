-- Create config table
CREATE TABLE IF NOT EXISTS public.config (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text
);

-- Insert initial version
INSERT INTO public.config (key, value, description)
VALUES ('latest_version', '0.3.0', 'Current latest version of the application')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to config"
ON public.config
FOR SELECT
TO public
USING (true);
