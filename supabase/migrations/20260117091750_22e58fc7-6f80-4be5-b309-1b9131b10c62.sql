-- Create storage bucket for PYQs
INSERT INTO storage.buckets (id, name, public) VALUES ('pyqs', 'pyqs', true);

-- RLS policies for pyqs bucket
CREATE POLICY "Anyone can view pyqs files"
ON storage.objects FOR SELECT
USING (bucket_id = 'pyqs');

CREATE POLICY "Only admins can upload pyqs files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pyqs' AND is_admin(auth.uid()));

CREATE POLICY "Only admins can update pyqs files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'pyqs' AND is_admin(auth.uid()));

CREATE POLICY "Only admins can delete pyqs files"
ON storage.objects FOR DELETE
USING (bucket_id = 'pyqs' AND is_admin(auth.uid()));