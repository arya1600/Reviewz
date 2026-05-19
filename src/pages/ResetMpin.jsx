import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

/* ── 4-digit MPIN pad (same as SignIn) ───────────────────────── */
function MpinInput({ value, onChange, disabled, autoFocus = false }) {
  const hiddenRef = useRef(null);

  useEffect(() => {
    if (autoFocus && hiddenRef.current) hiddenRef.current.focus();
  }, [autoFocus]);

  return (
    <div
      className="relative flex justify-center gap-3 cursor-text"
      onClick={() => hiddenRef.current?.focus()}
    >
      <input
        ref={hiddenRef}
        type="tel"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        disabled={disabled}
        className="absolute inset-0 opacity-0 cursor-text w-full h-full z-10"
        aria-label="6-digit MPIN"
      />
      {[0, 1, 2, 3, 4, 5].map(i => {
        const filled = i < value.length;
        const active = i === value.length;
        return (
          <div
            key={i}
            className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center transition-all select-none
              ${active  ? 'border-indigo-500 bg-indigo-50' : ''}
              ${filled  ? 'border-indigo-200 bg-white'     : ''}
              ${!filled && !active ? 'border-gray-200 bg-white' : ''}
            `}
          >
            {filled && <div className="w-3 h-3 rounded-full bg-indigo-600" />}
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function ResetMpin() {
  const navigate = useNavigate();

  const [step, setStep]           = useState('waiting');  // 'waiting' | 'set' | 'confirm' | 'done' | 'error'
  const [mpin, setMpin]           = useState('');
  const [confirmMpin, setConfirm] = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  /* Supabase sends a PASSWORD_RECOVERY event when the user arrives via the reset link */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStep('set');
    });
    return () => subscription.unsubscribe();
  }, []);

  /* Auto-advance from set → confirm when 4 digits entered */
  useEffect(() => {
    if (step === 'set' && mpin.length === 6) setStep('confirm');
  }, [mpin, step]);

  /* Auto-submit when confirm is full */
  useEffect(() => {
    if (step === 'confirm' && confirmMpin.length === 6) handleReset();
  }, [confirmMpin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReset() {
    if (confirmMpin !== mpin) {
      setError('MPINs do not match. Please try again.');
      setMpin('');
      setConfirm('');
      setStep('set');
      return;
    }

    setLoading(true);
    setError('');
    const { data: { user }, error: err } = await supabase.auth.updateUser({ password: mpin });
    setLoading(false);

    if (err) {
      setError(err.message);
      setMpin('');
      setConfirm('');
      setStep('set');
      return;
    }

    // Redirect admins to the admin portal, owners to their dashboard
    const { data: adminRow } = await supabase
      .from('admin_users').select('id').eq('id', user?.id ?? '').maybeSingle();
    const dest = adminRow ? '/admin/dashboard' : '/dashboard';

    setStep('done');
    setTimeout(() => navigate(dest, { replace: true }), 2500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">

        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-indigo-600 mb-8">
          <Star className="w-6 h-6 fill-indigo-600" />
          Reviewz
        </Link>

        {/* Waiting for Supabase event */}
        {step === 'waiting' && (
          <div className="py-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Verifying your reset link…</p>
            <p className="text-gray-400 text-xs mt-2">
              If nothing happens, the link may have expired.{' '}
              <Link to="/signin" className="text-indigo-500 hover:underline">Go back to sign in.</Link>
            </p>
          </div>
        )}

        {/* Set new MPIN */}
        {step === 'set' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Set new MPIN</h1>
            <p className="text-gray-500 text-sm mb-8">Choose a 6-digit code you'll remember</p>
            <MpinInput value={mpin} onChange={v => { setMpin(v); setError(''); }} disabled={loading} autoFocus />
            <p className="text-xs text-gray-400 mt-4">Tip: avoid 1234, 0000, or your birth year</p>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </>
        )}

        {/* Confirm */}
        {step === 'confirm' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Confirm MPIN</h1>
            <p className="text-gray-500 text-sm mb-8">Enter the same 4-digit code again</p>
            <MpinInput value={confirmMpin} onChange={v => { setConfirm(v); setError(''); }} disabled={loading} autoFocus />
            {loading && (
              <p className="text-indigo-500 text-sm mt-4 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </p>
            )}
            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <button
              type="button"
              onClick={() => { setStep('set'); setConfirm(''); setError(''); }}
              className="mt-5 text-sm text-gray-400 hover:text-gray-600"
            >
              ← Re-enter MPIN
            </button>
          </>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="py-4">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">MPIN updated!</h1>
            <p className="text-gray-500 text-sm">Taking you to your dashboard…</p>
          </div>
        )}
      </div>
    </div>
  );
}
