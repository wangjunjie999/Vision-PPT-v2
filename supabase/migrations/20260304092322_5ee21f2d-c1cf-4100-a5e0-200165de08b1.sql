ALTER TABLE public.mechanical_layouts 
  ADD COLUMN IF NOT EXISTS primary_view text DEFAULT 'front',
  ADD COLUMN IF NOT EXISTS auxiliary_view text DEFAULT 'side',
  ADD COLUMN IF NOT EXISTS layout_description text DEFAULT '';