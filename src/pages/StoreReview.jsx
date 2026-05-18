/**
 * StoreReview — QR Code Landing Page
 *
 * URL: /r/:storeSlug
 *
 * Flow:
 *   1. Load store by slug (slug never changes → QR never breaks)
 *   2. Check business subscription status in real-time
 *   3. ACTIVE  → Show star-rating review flow
 *   4. EXPIRED → Show "Subscription Expired" message (same URL, no new QR needed)
 *
 * Key: The QR code URL (/r/:storeSlug) is permanent.
 *      Activating/deactivating happens server-side by changing subscription status.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, AlertTriangle, ThumbsUp, MessageSquare, ExternalLink, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateReviews } from '../utils/reviewGenerator';

/* ── Expired / Suspended screen ──────────────────────────────── */
function ExpiredScreen({ storeName, businessName, reason }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {reason === 'suspended' ? 'Store Suspended' : 'Subscription Expired'}
        </h2>
        <p className="text-slate-500 text-sm mb-1">{storeName}</p>
        {businessName && <p className="text-slate-400 text-xs mb-5">{businessName}</p>}
        <p className="text-slate-600 text-sm">
          {reason === 'suspended'
            ? 'This store location is currently suspended.'
            : 'This store\'s subscription has expired and QR code access is temporarily disabled.'}
        </p>
        <p className="text-slate-500 text-sm mt-3 font-medium">
          Please contact the business owner to renew.
        </p>
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-300">Powered by ReviewBoost AI</p>
        </div>
      </div>
    </div>
  );
}

/* ── Star rating row ──────────────────────────────────────────── */
function StarRating({ rating, onRate }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => onRate(s)}>
          <Star
            className={`w-10 h-10 transition-all ${s <= (hover || rating) ? 'fill-amber-400 text-amber-400 scale-110' : 'text-slate-200'}`}
          />
        </button>
      ))}
    </div>
  );
}

/* ── AI review suggestions ────────────────────────────────────── */
function SuggestionsScreen({ rating, store, business, onBack }) {
  const [reviews, setReviews]     = useState([]);
  const [isAI, setIsAI]           = useState(false);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [copied, setCopied]       = useState(false);
  const [posted, setPosted]       = useState(false);

  useEffect(() => {
    generateReviews(business.name, business.category, rating, {
      description:          business.description,
      highlights:           business.highlights,
      vibe:                 business.vibe,
      products:             business.products,
      staffNames:           business.staff_names,
      customerTypes:        business.customer_types,
      complimentedFeatures: business.complimented_features,
      tone:                 business.tone_preference,
      reviewLength:         business.review_length,
    }).then(({ reviews: r, isAI: ai }) => {
      setReviews(r);
      setIsAI(ai);
    }).catch(err => {
      console.error('[SuggestionsScreen] generateReviews failed:', err.message);
    }).finally(() => {
      setLoading(false);
    });
    // Track the scan — last_scan_at is updated automatically by DB trigger
    supabase.from('store_scans').insert({ store_id: store.id })
      .then(({ error: e }) => { if (e) console.warn('[SuggestionsScreen] scan insert:', e.message); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id]);

  async function handleCopyAndPost(review) {
    setSelected(review);
    await navigator.clipboard.writeText(review).catch(() => {});
    setCopied(true);
    // Log as positive review — fire-and-forget, error doesn't block UX
    supabase.from('store_reviews').insert({
      store_id: store.id, rating, type: 'positive', feedback: review,
    }).then(({ error }) => {
      if (error) console.error('[StoreReview] store_reviews insert:', error.message);
    });
    // Open Google review link — fall back to business-level link
    const googleUrl = store.google_review_link || business.google_link;
    if (googleUrl) window.open(googleUrl, '_blank');
    setPosted(true);
  }

  if (posted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Thank You! 🎉</h2>
          <p className="text-slate-500 text-sm">Your review has been copied. Please paste it on Google to help {business.name}.</p>
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-300">Powered by ReviewBoost AI</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-lg mx-auto pt-6">
        <div className="text-center mb-6">
          <div className="flex justify-center gap-1 mb-2">
            {[1,2,3,4,5].map(s => <Star key={s} className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
          </div>
          <h2 className="text-xl font-bold text-slate-800">Choose Your Review</h2>
          <p className="text-slate-500 text-sm mt-1">Tap a review, copy it, and paste on Google</p>
          {!loading && (
            <span className={`inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full font-medium ${
              isAI ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {isAI ? '✦ AI-personalised' : 'Suggested reviews'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleCopyAndPost(review)}
                className={`w-full text-left bg-white rounded-2xl p-5 border-2 shadow-sm transition-all ${selected === review ? 'border-indigo-500' : 'border-transparent hover:border-indigo-200'}`}
              >
                <p className="text-slate-700 text-sm leading-relaxed">{review}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-400">Review {i + 1}</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Copy & Post on Google
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          Powered by <span className="font-medium">ReviewBoost AI</span>
        </p>
      </div>
    </div>
  );
}

/* ── Private feedback screen ──────────────────────────────────── */
function FeedbackScreen({ rating, store, business, onDone }) {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    // Log scan for low-rating visits (analytics parity with SuggestionsScreen)
    supabase.from('store_scans').insert({ store_id: store.id })
      .then(({ error: e }) => { if (e) console.warn('[FeedbackScreen] scan insert:', e.message); });

    const { error } = await supabase.from('store_reviews').insert({
      store_id: store.id, rating, type: 'negative', feedback,
    });
    setSubmitting(false);
    if (error) {
      alert('Could not send feedback. Please try again.');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Feedback Received</h2>
          <p className="text-slate-500 text-sm">Thank you for sharing your experience. We'll make it better.</p>
          <p className="text-xs text-slate-300 mt-6">Powered by ReviewBoost AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full">
        <div className="text-center mb-6">
          <div className="flex justify-center gap-1 mb-3">
            {[1,2,3,4,5].map(s => <Star key={s} className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
          </div>
          <h2 className="text-xl font-bold text-slate-800">We're Sorry</h2>
          <p className="text-slate-500 text-sm mt-1">Tell us how we can improve</p>
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            required
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={4}
            placeholder="What could we do better?"
            className="w-full border border-slate-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
          />
          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60">
            {submitting ? 'Sending…' : 'Send Feedback'}
          </button>
        </form>
        <p className="text-center text-xs text-slate-300 mt-4">Powered by ReviewBoost AI</p>
      </div>
    </div>
  );
}

/* ── Main rating screen ───────────────────────────────────────── */
function RatingScreen({ store, business }) {
  const [rating, setRating]   = useState(0);
  const [screen, setScreen]   = useState('rating'); // 'rating' | 'suggestions' | 'feedback'

  function handleRate(r) {
    setRating(r);
    setTimeout(() => setScreen(r >= 4 ? 'suggestions' : 'feedback'), 300);
  }

  if (screen === 'suggestions') return <SuggestionsScreen rating={rating} store={store} business={business} />;
  if (screen === 'feedback')    return <FeedbackScreen    rating={rating} store={store} business={business} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        {/* Business avatar */}
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
          <span className="text-2xl font-bold text-white">{business.name?.[0]?.toUpperCase()}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800">{business.name}</h2>
        <p className="text-slate-400 text-sm mt-0.5 mb-6">{store.store_name} · {store.city}</p>

        <p className="text-slate-600 font-medium mb-4">How was your experience?</p>
        <StarRating rating={rating} onRate={handleRate} />

        <p className="text-xs text-slate-400 mt-6">Tap a star to rate your visit</p>
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-300">Powered by ReviewBoost AI</p>
        </div>
      </div>
    </div>
  );
}

/* ── Route component ──────────────────────────────────────────── */
export default function StoreReview() {
  const { storeSlug }   = useParams();
  const [state, setState] = useState('loading'); // 'loading' | 'active' | 'expired' | 'suspended' | 'not_found' | 'error'
  const [store, setStore]     = useState(null);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        // 1. Load store by slug
        const { data: storeData, error: storeErr } = await supabase
          .from('stores')
          .select('*, businesses(id, name, category, location, google_link, description, highlights, vibe, products, staff_names, customer_types, complimented_features, tone_preference, review_length, status)')
          .eq('slug', storeSlug)
          .maybeSingle();

        if (storeErr) { console.error('[StoreReview] load:', storeErr.message); setState('error'); return; }
        if (!storeData) { setState('not_found'); return; }

        setStore(storeData);
        setBusiness(storeData.businesses);

        // 2. Check store-level status
        if (storeData.status === 'suspended') { setState('suspended'); return; }

        // 3. Check business-level status
        if (storeData.businesses?.status === 'suspended') { setState('suspended'); return; }

        // 4. Check subscription via the canonical DB function so logic never drifts
        const { data: subStatus, error: rpcErr } = await supabase
          .rpc('get_business_subscription_status', { p_business_id: storeData.business_id });

        if (rpcErr) { console.error('[StoreReview] rpc:', rpcErr.message); setState('error'); return; }
        if (subStatus === 'suspended') { setState('suspended'); return; }
        if (subStatus !== 'active')   { setState('expired');   return; }

        setState('active');
      } catch (err) {
        console.error('[StoreReview] unexpected:', err);
        setState('error');
      }
    }
    load();
  }, [storeSlug]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-slate-500 text-sm">Could not load this page. Please check your connection and try again.</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700">
            Retry
          </button>
          <p className="text-xs text-slate-300 mt-6">Powered by ReviewBoost AI</p>
        </div>
      </div>
    );
  }

  if (state === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">QR Code Not Found</h2>
          <p className="text-slate-500 text-sm">This QR code is not valid or has been removed.</p>
          <p className="text-xs text-slate-300 mt-6">Powered by ReviewBoost AI</p>
        </div>
      </div>
    );
  }

  if (state === 'expired') {
    return (
      <ExpiredScreen
        storeName={store?.store_name}
        businessName={business?.name}
        reason="expired"
      />
    );
  }

  if (state === 'suspended') {
    return (
      <ExpiredScreen
        storeName={store?.store_name}
        businessName={business?.name}
        reason="suspended"
      />
    );
  }

  return <RatingScreen store={store} business={business} />;
}
