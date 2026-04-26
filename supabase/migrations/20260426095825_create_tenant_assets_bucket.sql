-- Create the tenant-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-assets', 'tenant-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can delete" ON storage.objects;

-- Allow public read access to the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-assets');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tenant-assets');

-- Allow authenticated users to update their files (or any file in this bucket if we are simple)
CREATE POLICY "Authenticated Users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tenant-assets');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated Users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tenant-assets');

