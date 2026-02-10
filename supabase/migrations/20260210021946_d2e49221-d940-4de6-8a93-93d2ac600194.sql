
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (for password verification via edge function)
CREATE POLICY "Authenticated users can read settings"
  ON public.admin_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
  ON public.admin_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default password
INSERT INTO public.admin_settings (key, value)
VALUES ('admin_password', 'admin123');
