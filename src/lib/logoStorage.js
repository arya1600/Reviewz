import { supabase } from './supabase';

const BUCKET = 'business-logos';

/** Storage path: `{businessId}/logo.png` */
function logoPath(businessId) {
  return `${businessId}/logo.png`;
}

/**
 * Upload (or replace) a business logo. Returns the public URL.
 * @param {string} businessId
 * @param {Blob} fileBlob — PNG/JPEG recommended
 */
export async function uploadBusinessLogo(businessId, fileBlob) {
  const path = logoPath(businessId);
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, fileBlob, {
      upsert: true,
      contentType: fileBlob.type || 'image/png',
      cacheControl: '3600',
    });

  if (uploadErr) throw new Error(uploadErr.message);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: dbErr } = await supabase
    .from('businesses')
    .update({ business_logo_url: publicUrl })
    .eq('id', businessId);

  if (dbErr) throw new Error(dbErr.message);

  return publicUrl;
}

/** Remove logo from storage and clear DB field. */
export async function removeBusinessLogo(businessId) {
  const path = logoPath(businessId);
  await supabase.storage.from(BUCKET).remove([path]);

  const { error } = await supabase
    .from('businesses')
    .update({ business_logo_url: null })
    .eq('id', businessId);

  if (error) throw new Error(error.message);
}
