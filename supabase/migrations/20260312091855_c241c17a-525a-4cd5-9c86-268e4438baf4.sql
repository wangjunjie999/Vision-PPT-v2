
-- 机构表添加 3D 模型字段
ALTER TABLE public.mechanisms ADD COLUMN model_3d_url text;

-- 创建 3D 模型存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('3d-models', '3d-models', true);

-- 存储桶 RLS
CREATE POLICY "Authenticated users can upload 3d models"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = '3d-models');

CREATE POLICY "Anyone can view 3d models"
ON storage.objects FOR SELECT TO public
USING (bucket_id = '3d-models');

CREATE POLICY "Authenticated users can delete own 3d models"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = '3d-models' AND auth.uid()::text = (storage.foldername(name))[1]);
