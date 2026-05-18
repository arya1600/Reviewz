/**
 * Shared pricing constants and helpers.
 * Both PricingPage.jsx and AdminBusinessDetail.jsx import from here.
 * Change numbers in ONE place — both UIs stay in sync automatically.
 */

export const BASE_RATE = 99; // ₹ per store per month

/**
 * Single source of truth for plan durations.
 * Contains every field needed by either consumer:
 *   - label / shortLabel / badge / popular  → PricingPage tabs & display
 *   - days                                  → AdminBusinessDetail expiry calc
 *   - months / discount                     → price calculations everywhere
 */
export const PLAN_DURATIONS = {
  monthly:   { key: 'monthly',   label: 'Monthly',   shortLabel: '1 Mo', days: 30,  months: 1,  discount: 0,    badge: null,       popular: false },
  '3months': { key: '3months',   label: '3 Months',  shortLabel: '3 Mo', days: 90,  months: 3,  discount: 0.08, badge: 'Save 8%',  popular: false },
  '6months': { key: '6months',   label: '6 Months',  shortLabel: '6 Mo', days: 180, months: 6,  discount: 0.16, badge: 'Save 16%', popular: false },
  '12months':{ key: '12months',  label: '12 Months', shortLabel: '1 Yr', days: 365, months: 12, discount: 0.25, badge: 'Save 25%', popular: true  },
};

/** Ordered array form — use this wherever you need to iterate over plans. */
export const DURATIONS = Object.values(PLAN_DURATIONS);

export const BULK_TIERS = [
  { min: 1,  max: 4,          discount: 0,    label: null },
  { min: 5,  max: 9,          discount: 0.10, label: '10% bulk discount' },
  { min: 10, max: 24,         discount: 0.15, label: '15% bulk discount' },
  { min: 25, max: Infinity,   discount: null, label: 'Custom pricing' },
];

export function getBulkTier(stores) {
  return BULK_TIERS.find(t => stores >= t.min && stores <= t.max);
}

/**
 * Full price breakdown used by PricingPage's interactive calculator.
 * Returns null when the store count falls in the "contact sales" tier.
 */
export function calcPrice(stores, durationKey) {
  const dur  = PLAN_DURATIONS[durationKey];
  const tier = getBulkTier(stores);
  if (!dur || tier.discount === null) return null;

  const base             = BASE_RATE * stores * dur.months;
  const bulkAmt          = Math.round(base * tier.discount);
  const afterBulk        = base - bulkAmt;
  const durationAmt      = Math.round(afterBulk * dur.discount);
  const total            = afterBulk - durationAmt;
  const perMonth         = Math.round(total / dur.months);
  const perStorePerMonth = Math.round(total / dur.months / stores);
  const savings          = base - total;

  return {
    base, bulkAmt, bulkDiscount: tier.discount,
    durationAmt, durationDiscount: dur.discount,
    total, perMonth, perStorePerMonth, savings, months: dur.months,
  };
}

/**
 * Simpler helper used by AdminBusinessDetail to pre-fill the amount field.
 * No bulk-tier logic — admins set their own price; this is just a suggestion.
 */
export function suggestedPrice(storeCount, planKey) {
  const plan = PLAN_DURATIONS[planKey];
  if (!plan) return 0;
  return Math.round(BASE_RATE * storeCount * plan.months * (1 - plan.discount));
}
