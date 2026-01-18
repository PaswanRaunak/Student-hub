-- Create storage bucket for notes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('notes', 'notes', true, 52428800, ARRAY['application/pdf']);

-- Create storage policies for notes bucket
CREATE POLICY "Anyone can view notes files"
ON storage.objects FOR SELECT
USING (bucket_id = 'notes');

CREATE POLICY "Admins can upload notes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'notes' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update notes files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'notes' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete notes files"
ON storage.objects FOR DELETE
USING (bucket_id = 'notes' AND public.is_admin(auth.uid()));