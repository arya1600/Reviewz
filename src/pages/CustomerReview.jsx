import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import InactiveReviewFlowScreen from '../components/InactiveReviewFlowScreen';
import { checkLegacyBusinessReviewAccess } from '../utils/reviewAccess';
import BusinessAvatar from '../components/branding/BusinessAvatar';

export default function CustomerReview() {
  const { businessId } = useParams();
  const navigate       = useNavigate();
  const [business, setBusiness] = useState(null);
  const [blocked, setBlocked]   = useState(null); // { reason } | null
  const [loading, setLoading]   = useState(true);
  const [hovered, setHovered]   = useState(0);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const access = await checkLegacyBusinessReviewAccess(businessId);
      if (cancelled) return;

      if (!access.ok) {
        if (access.reason === 'not_found') {
          setBusiness(null);
          setBlocked(null);
        } else {
          setBlocked({ reason: access.reason, name: access.business?.name });
        }
        setLoading(false);
        return;
      }

      setBusiness(access.business);
      setLoading(false);

      supabase.from('scans').insert({ business_id: businessId })
        .then(({ error: e }) => { if (e) console.warn('[CustomerReview] scan insert:', e.message); });
    }
    load();
    return () => { cancelled = true; };
  }, [businessId]);

  if (loading) return <LoadingSpinner fullScreen message="Loading…" />;

  if (blocked) {
    return (
      <InactiveReviewFlowScreen
        businessName={blocked.name}
        reason={blocked.reason === 'suspended' ? 'suspended' : 'inactive'}
      />
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business not found</h2>
          <p className="text-gray-500">This review page is no longer active.</p>
        </div>
      </div>
    );
  }

  const labels = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

  function handleSelect(rating) {
    setSelected(rating);
    setTimeout(() => {
      navigate(`/review/${businessId}/suggestions`, { state: { rating, business } });
    }, 300);
  }

  const activeRating = hovered || selected;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10">
          <BusinessAvatar
            name={business.name}
            logoUrl={business.business_logo_url}
            size={80}
            className="mx-auto mb-4 shadow-lg"
          />
          <h1 className="text-2xl font-extrabold text-gray-900">{business.name}</h1>
          <p className="text-gray-500 flex items-center justify-center gap-1 mt-1 text-sm">
            <MapPin className="w-4 h-4" /> {business.location}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">How was your experience?</h2>
          <p className="text-gray-500 text-sm mb-8">Tap a star to rate your visit</p>

          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => handleSelect(n)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-12 h-12 transition-colors ${n <= activeRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                />
              </button>
            ))}
          </div>

          <div className="h-6">
            {activeRating > 0 && (
              <p className={`text-base font-semibold ${activeRating >= 4 ? 'text-green-600' : activeRating === 3 ? 'text-yellow-600' : 'text-red-500'}`}>
                {labels[activeRating - 1]}
              </p>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6">Powered by Reviewz</p>
      </div>
    </div>
  );
}
