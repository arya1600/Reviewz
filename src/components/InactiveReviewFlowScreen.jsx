import { AlertTriangle } from 'lucide-react';

/**
 * Shown when a customer opens a review URL but the business has no active subscription
 * or is suspended. Used by /r/:slug and legacy /review/:businessId flows.
 */
export default function InactiveReviewFlowScreen({
  businessName,
  storeName,
  reason = 'inactive', // 'inactive' | 'suspended'
}) {
  const suspended = reason === 'suspended';
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          {suspended ? 'Business Suspended' : 'Reviews Not Available'}
        </h2>
        {storeName && <p className="text-slate-500 text-sm mb-1">{storeName}</p>}
        {businessName && (
          <p className={`text-slate-400 text-xs mb-5 ${storeName ? '' : 'text-slate-500 text-sm mb-3'}`}>
            {businessName}
          </p>
        )}
        <p className="text-slate-600 text-sm">
          {suspended
            ? 'This business is temporarily unavailable.'
            : 'This review link is not active. The business needs an active subscription before customers can leave reviews here.'}
        </p>
        <p className="text-slate-500 text-sm mt-3 font-medium">Please contact the business if you need help.</p>
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-300">Powered by ReviewBoost AI</p>
        </div>
      </div>
    </div>
  );
}
