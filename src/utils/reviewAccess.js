import { supabase } from '../lib/supabase';

/** Columns needed for customer review flows after access is granted. */
const BUSINESS_SELECT = `
  id, name, category, location, google_link, status, business_logo_url,
  description, highlights, vibe, products, staff_names, customer_types,
  complimented_features, tone_preference, review_length
`.replace(/\s+/g, ' ').trim();

/**
 * Gate for legacy URLs `/review/:businessId` (and child routes).
 * Same rules as `/r/:slug` — must mirror StoreReview.jsx subscription logic.
 *
 * @returns {{ ok: true, business: object } | { ok: false, reason: 'not_found'|'suspended'|'inactive'|'error', business?: object }}
 */
export async function checkLegacyBusinessReviewAccess(businessId) {
  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select(BUSINESS_SELECT)
    .eq('id', businessId)
    .maybeSingle();

  if (bizErr) return { ok: false, reason: 'error' };
  if (!biz) return { ok: false, reason: 'not_found' };
  if (biz.status === 'suspended') return { ok: false, reason: 'suspended', business: biz };

  const { data: subStatus, error: rpcErr } = await supabase.rpc('get_business_subscription_status', {
    p_business_id: businessId,
  });

  if (rpcErr) return { ok: false, reason: 'error', business: biz };
  if (subStatus === 'suspended') return { ok: false, reason: 'suspended', business: biz };
  if (subStatus !== 'active') return { ok: false, reason: 'inactive', business: biz };

  return { ok: true, business: biz };
}
