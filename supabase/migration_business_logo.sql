-- Business logo URL + public storage bucket for QR / landing branding

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS business_logo_url TEXT;

-- Public view (anon QR / review pages)
CREATE OR REPLACE VIEW businesses_public
  WITH (security_invoker = true)
AS
SELECT id, name, category, location, google_link,
       description, highlights, vibe, products, staff_names,
       customer_types, complimented_features, tone_preference,
       review_length, status, business_logo_url
FROM businesses;

GRANT SELECT ON businesses_public TO anon, authenticated;

-- Storage bucket (public read for embedded QR logos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-logos',
  'business-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Owners: upload / replace / delete logos under their business folder
CREATE POLICY "owners_upload_business_logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "owners_update_business_logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "owners_delete_business_logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'business-logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Public read (QR embed + customer landing pages)
CREATE POLICY "public_read_business_logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'business-logos');
