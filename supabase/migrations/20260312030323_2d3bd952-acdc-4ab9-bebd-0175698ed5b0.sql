ALTER TABLE public.mechanical_layouts
ADD COLUMN isometric_view_image_url text,
ADD COLUMN isometric_view_saved boolean DEFAULT false;