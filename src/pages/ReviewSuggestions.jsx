import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, Star, Sparkles, RefreshCw, Globe } from 'lucide-react';
import { generateReviews } from '../utils/reviewGenerator';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import InactiveReviewFlowScreen from '../components/InactiveReviewFlowScreen';
import { checkLegacyBusinessReviewAccess } from '../utils/reviewAccess';

const LANGUAGES = [
  { code: 'English',    label: 'English',    flag: '🇬🇧' },
  { code: 'Hindi',      label: 'हिंदी',       flag: '🇮🇳' },
  { code: 'Marathi',    label: 'मराठी',       flag: '🇮🇳' },
  { code: 'Gujarati',   label: 'ગુજરાતી',     flag: '🇮🇳' },
  { code: 'Tamil',      label: 'தமிழ்',       flag: '🇮🇳' },
  { code: 'Telugu',     label: 'తెలుగు',      flag: '🇮🇳' },
  { code: 'Kannada',    label: 'ಕನ್ನಡ',        flag: '🇮🇳' },
  { code: 'Bengali',    label: 'বাংলা',       flag: '🇮🇳' },
  { code: 'Malayalam',  label: 'മലയാളം',      flag: '🇮🇳' },
  { code: 'Punjabi',    label: 'ਪੰਜਾਬੀ',      flag: '🇮🇳' },
];

export default function ReviewSuggestions() {
  const { businessId } = useParams();
  const { state }      = useLocation();
  const navigate       = useNavigate();

  const [business, setBusiness]         = useState(state?.business ?? null);
  // If there is no navigation state (direct URL / refresh), send back to the
  // rating screen so the customer makes a real choice instead of defaulting to 5.
  const [rating]                        = useState(state?.rating ?? null);
  const [reviews, setReviews]           = useState([]);
  const [isAI, setIsAI]                 = useState(false);
  const [selectedIdx, setSelectedIdx]   = useState(null); // which card is selected
  const [language, setLanguage]         = useState('English');
  const [loading, setLoading]           = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [saved, setSaved]               = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [postDone, setPostDone]         = useState(false);
  const [accessBlocked, setAccessBlocked] = useState(null); // { reason, name } | null

  const buildCtx = useCallback((biz, lang) => ({
    description:          biz.description,
    highlights:           biz.highlights,
    vibe:                 biz.vibe,
    products:             biz.products,
    staffNames:           biz.staff_names,
    customerTypes:        biz.customer_types,
    complimentedFeatures: biz.complimented_features,
    tone:                 biz.tone_preference,
    reviewLength:         biz.review_length,
    language:             lang,
  }), []);

  const generate = useCallback(async (biz, lang = 'English') => {
    return generateReviews(biz.name, biz.category, rating, buildCtx(biz, lang));
  }, [rating, buildCtx]);

  const bootstrapped = useRef(false);

  useEffect(() => {
    // No rating means user landed here directly (refresh / shared URL).
    // Redirect to the rating screen so they start the flow properly.
    if (rating === null) {
      navigate(`/review/${businessId}`, { replace: true });
      return;
    }

    // Guard against StrictMode double-invoke and remount without route change.
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    let cancelled = false;

    async function bootstrap() {
      const access = await checkLegacyBusinessReviewAccess(businessId);
      if (cancelled) return;
      if (!access.ok) {
        if (access.reason === 'not_found') {
          navigate('/', { replace: true });
          return;
        }
        setAccessBlocked({ reason: access.reason, name: access.business?.name });
        setLoading(false);
        return;
      }

      const biz = access.business;
      setBusiness(biz);
      try {
        const { reviews: r, isAI: ai } = await generate(biz, 'English');
        if (cancelled) return;
        setReviews(r);
        setIsAI(ai);
      } catch (err) {
        if (cancelled) return;
        console.error('[ReviewSuggestions] generate failed:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    bootstrap();
    return () => { cancelled = true; };
  // businessId and rating are route-derived and stable for this mount;
  // navigate and generate are stable references — safe to omit from deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRegenerate(lang = language) {
    setRegenerating(true);
    setSelectedIdx(null);
    try {
      const { reviews: r, isAI: ai } = await generate(business, lang);
      setReviews(r);
      setIsAI(ai);
    } catch (err) {
      console.error('[ReviewSuggestions] regenerate failed:', err.message);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleLanguageChange(lang) {
    setLanguage(lang);
    setShowLangPicker(false);
    setSelectedIdx(null);
    await handleRegenerate(lang);
  }

  async function recordReview() {
    if (saved) return;
    const { error } = await supabase
      .from('reviews')
      .insert({ business_id: businessId, rating, type: 'positive' });
    if (!error) setSaved(true);
  }

  // Copy the selected review and open Google — one tap does both
  async function handleCopyAndPost() {
    if (selectedIdx === null) return;
    const text = reviews[selectedIdx];

    // Attempt clipboard write; fall back gracefully when the Permissions API
    // blocks it (e.g. some Android WebViews, cross-origin iframes).
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard blocked — create a temporary textarea so the browser can
      // execute a document.execCommand copy without a permissions prompt.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        // Both methods failed (e.g. sandboxed iframe with no user gesture).
        // We still open Google so the customer can paste manually.
        console.warn('[ReviewSuggestions] clipboard write failed — user must paste manually');
      }
    }

    await recordReview();
    setPostDone(true);
    setTimeout(() => {
      window.open(business.google_link ?? business.googleLink, '_blank');
    }, 400); // small delay so user sees the confirmation flash
  }

  if (accessBlocked) {
    return (
      <InactiveReviewFlowScreen
        businessName={accessBlocked.name}
        reason={accessBlocked.reason === 'suspended' ? 'suspended' : 'inactive'}
      />
    );
  }

  if (loading) return <LoadingSpinner fullScreen message="Generating your reviews…" />;

  const iconColor = rating >= 4 ? 'text-green-600' : rating === 3 ? 'text-yellow-600' : 'text-orange-500';
  const iconBg    = rating >= 4 ? 'bg-green-100'  : rating === 3 ? 'bg-yellow-100'  : 'bg-orange-100';
  const currentLang = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white px-4 py-10">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
            <Sparkles className={`w-7 h-7 ${iconColor}`} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Pick your review</h1>
          <p className="text-gray-500 mt-1 text-sm">Tap a card to select it, then post to Google in one tap.</p>
          <div className="flex justify-center gap-0.5 mt-2">
            {[1,2,3,4,5].map(n => (
              <Star key={n} className={`w-4 h-4 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
            ))}
          </div>
          <span className={`inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full font-medium ${
            isAI ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
          }`}>
            {isAI ? '✦ AI-personalised' : 'Suggested reviews'}
          </span>
        </div>

        {/* Language selector */}
        <div className="flex items-center justify-end mb-4 relative">
          <button
            onClick={() => setShowLangPicker(v => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-xl px-3 py-1.5 bg-white hover:border-indigo-300 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{currentLang.flag} {currentLang.label}</span>
          </button>

          {showLangPicker && (
            <div className="absolute top-10 right-0 z-20 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 w-52">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                    language === lang.code
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                  {lang.code !== 'English' && (
                    <span className="ml-auto text-xs text-indigo-400 font-medium">AI</span>
                  )}
                </button>
              ))}
              <p className="text-gray-400 text-xs px-3 pt-1 pb-1 border-t border-gray-100 mt-1">
                Non-English requires OpenAI key
              </p>
            </div>
          )}
        </div>

        {/* Review cards — tap to select */}
        <div className={`space-y-3 mb-5 transition-opacity duration-300 ${regenerating ? 'opacity-40 pointer-events-none' : ''}`}>
          {reviews.map((review, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx === selectedIdx ? null : idx)}
              className={`w-full text-left rounded-2xl border-2 p-5 transition-all shadow-sm ${
                selectedIdx === idx
                  ? 'border-indigo-500 bg-indigo-50 shadow-indigo-100'
                  : 'border-gray-100 bg-white hover:border-indigo-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Selection indicator */}
                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center transition-colors ${
                  selectedIdx === idx ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                }`}>
                  {selectedIdx === idx && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{review}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Regenerate */}
        <button
          onClick={() => handleRegenerate()}
          disabled={regenerating}
          className="w-full flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-600 font-semibold py-2.5 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Generating…' : 'Get 3 new reviews'}
        </button>

        {/* Copy & Post on Google — single tap */}
        <button
          onClick={handleCopyAndPost}
          disabled={selectedIdx === null || regenerating}
          className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all text-base shadow-lg ${
            selectedIdx !== null
              ? postDone
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {postDone
            ? <><Check className="w-5 h-5" /> Copied! Opening Google…</>
            : selectedIdx !== null
              ? <><Copy className="w-5 h-5" /> Copy & Open Google</>
              : <>← Select a review above first</>}
        </button>

        {selectedIdx !== null && !postDone && (
          <p className="text-center text-gray-400 text-xs mt-3">
            This will copy your selected review and open Google Reviews in one tap.
          </p>
        )}
      </div>

      {/* Close lang picker on outside click */}
      {showLangPicker && (
        <div className="fixed inset-0 z-10" onClick={() => setShowLangPicker(false)} />
      )}
    </div>
  );
}
