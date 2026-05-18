import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Star, Send, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import InactiveReviewFlowScreen from '../components/InactiveReviewFlowScreen';
import { checkLegacyBusinessReviewAccess } from '../utils/reviewAccess';

export default function PrivateFeedback() {
  const { businessId } = useParams();
  const { state }      = useLocation();
  const navigate       = useNavigate();

  const [business, setBusiness]       = useState(state?.business ?? null);
  const rating                        = state?.rating ?? null;
  const [feedback, setFeedback]       = useState('');
  const [submitted, setSubmitted]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [accessBlocked, setAccessBlocked] = useState(null);

  useEffect(() => {
    if (rating === null) {
      navigate(`/review/${businessId}`, { replace: true });
      return;
    }

    let cancelled = false;

    async function run() {
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
      setBusiness(access.business);
      setLoading(false);
    }
    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSubmitError('');

    const { error } = await supabase.from('reviews').insert({
      business_id: businessId,
      rating,
      type: 'negative',
      feedback: feedback.trim() || null,
    });

    setSaving(false);
    if (error) { setSubmitError('Could not send your feedback. Please try again.'); return; }
    setSubmitted(true);
  }

  if (accessBlocked) {
    return (
      <InactiveReviewFlowScreen
        businessName={accessBlocked.name}
        reason={accessBlocked.reason === 'suspended' ? 'suspended' : 'inactive'}
      />
    );
  }

  if (loading) return <LoadingSpinner fullScreen message="Loading…" />;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-red-500 fill-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Thank you for your feedback</h1>
          <p className="text-gray-500 leading-relaxed">
            We're sorry your experience wasn't perfect. Your feedback has been shared privately with the team at <strong>{business.name}</strong> so they can improve.
          </p>
          <p className="text-indigo-600 font-semibold mt-6 text-sm">We hope to serve you better next time!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">We want to do better</h1>
          <p className="text-gray-500 mt-2 text-sm">Your feedback goes directly to {business.name} — not public.</p>
          <div className="flex justify-center gap-0.5 mt-3">
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} className={`w-5 h-5 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What could we have done better?</label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={5}
                placeholder="Tell us what happened and how we can improve…"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
              />
            </div>
            {submitError && (
              <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                : <><Send className="w-4 h-4" /> Send feedback</>}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          This feedback is private and will never be posted publicly.
        </p>
      </div>
    </div>
  );
}
