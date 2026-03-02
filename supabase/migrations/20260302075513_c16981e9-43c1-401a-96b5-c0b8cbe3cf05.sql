
-- Create generated_documents table
CREATE TABLE public.generated_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  format TEXT NOT NULL DEFAULT 'ppt',
  generation_method TEXT NOT NULL DEFAULT 'scratch',
  template_id TEXT,
  page_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON public.generated_documents
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can insert their own documents"
ON public.generated_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON public.generated_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-documents', 'generated-documents', true);

-- Storage policies
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'generated-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view generated documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'generated-documents');

CREATE POLICY "Users can delete their own generated documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'generated-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
