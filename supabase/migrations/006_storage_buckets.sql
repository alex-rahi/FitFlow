-- Storage buckets and upload policies for video uploads

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('raw-uploads', 'raw-uploads', false),
  ('processed-videos', 'processed-videos', true),
  ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload own raw videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'raw-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can update own raw videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'raw-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can read own raw videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'raw-uploads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Public can read processed videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'processed-videos');

CREATE POLICY "Public can read thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'thumbnails');
