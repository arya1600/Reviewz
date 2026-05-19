import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/* ── Google icon ─────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
    </svg>
  );
}

/* ── 4-digit MPIN pad ────────────────────────────────────────── */
/**
 * Invisible input overlaid on 4 visual dot-boxes.
 * Works reliably on mobile (triggers numeric keyboard) and desktop.
 */
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
      {/* Hidden real input captures keyboard / mobile numpad */}
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

      {/* Visual boxes */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const filled   = i < value.length;
        const active   = i === value.length;
        return (
          <div
            key={i}
            className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center transition-all select-none
              ${active  ? 'border-indigo-500 bg-indigo-50' : ''}
              ${filled  ? 'border-indigo-200 bg-white'     : ''}
              ${!filled && !active ? 'border-gray-200 bg-white' : ''}
            `}
          >
            {filled && (
              <div className="w-3 h-3 rounded-full bg-indigo-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function SignIn() {
  const navigate      = useNavigate();
  const { user }      = useAuth();

  const [tab, setTab]           = useState('signin');   // 'signin' | 'signup'
  const [step, setStep]         = useState('email');    // 'email' | 'mpin' | 'set-mpin' | 'confirm-mpin' | 'reset-sent'
  const [form, setForm]         = useState({ name: '', email: '' });
  const [mpin, setMpin]         = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  function resetFlow(newTab) {
    setTab(newTab);
    setStep('email');
    setForm({ name: '', email: '' });
    setMpin('');
    setConfirmMpin('');
    setError('');
    setForgotMode(false);
  }

  /* ── Google OAuth ─────────────────────────────────────────── */
  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (err) { setError(err.message); setGoogleLoading(false); }
  }

  /* ── Email step (shared between signin / signup) ─────────── */
  async function handleEmailNext(e) {
    e.preventDefault();
    setError('');

    const email = form.email.trim();
    if (tab === 'signup' && !form.name.trim()) {
      setError('Please enter your name.'); return;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email.'); return;
    }

    // Forgot-MPIN flow
    if (forgotMode) {
      setLoading(true);
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-mpin`,
      });
      setLoading(false);
      if (err) {
        setError(err.message || 'Error sending recovery email');
        return;
      }
      setStep('reset-sent');
      return;
    }

    setStep(tab === 'signin' ? 'mpin' : 'set-mpin');
  }

  /* ── Sign In with MPIN ───────────────────────────────────── */
  useEffect(() => {
    if (step === 'mpin' && mpin.length === 6) handleSignIn();
  }, [mpin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignIn() {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email:    form.email.trim(),
      password: mpin,
    });
    setLoading(false);
    if (err) {
      setMpin('');
      setError(
        err.message.includes('Invalid login credentials')
          ? 'Incorrect MPIN. Please try again.'
          : err.message,
      );
      return;
    }
    // Redirect admins to the admin portal, owners to their dashboard
    const { data: adminRow } = await supabase
      .from('admin_users').select('id').eq('id', data.user.id).maybeSingle();
    navigate(adminRow ? '/admin/dashboard' : '/dashboard', { replace: true });
  }

  /* ── Sign Up — set MPIN ──────────────────────────────────── */
  useEffect(() => {
    if (step === 'set-mpin' && mpin.length === 6) setStep('confirm-mpin');
  }, [mpin]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Sign Up — confirm MPIN ──────────────────────────────── */
  useEffect(() => {
    if (step === 'confirm-mpin' && confirmMpin.length === 6) handleSignUp();
  }, [confirmMpin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignUp() {
    if (confirmMpin !== mpin) {
      setError('MPINs do not match. Let\'s try again.');
      setMpin('');
      setConfirmMpin('');
      setStep('set-mpin');
      return;
    }

    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signUp({
      email:    form.email.trim(),
      password: mpin,
      options:  { data: { name: form.name.trim() } },
    });
    setLoading(false);
    if (err) {
      setMpin('');
      setConfirmMpin('');
      setStep('set-mpin');
      setError(err.message);
      return;
    }
    // New sign-ups are never admins — go straight to onboarding
    const { data: adminRow } = await supabase
      .from('admin_users').select('id').eq('id', data.user?.id ?? '').maybeSingle();
    navigate(adminRow ? '/admin/dashboard' : '/dashboard', { replace: true });
  }

  /* ── Shared input class ──────────────────────────────────── */
  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-indigo-600">
            <Star className="w-6 h-6 fill-indigo-600" />
            Reviewz
          </Link>
        </div>

        {/* ── MPIN step: sign in ─────────────────────────── */}
        {step === 'mpin' && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Enter your MPIN</h1>
            <p className="text-gray-500 text-sm mb-8">
              Welcome back, <span className="font-medium text-gray-700">{form.email}</span>
            </p>
            <MpinInput value={mpin} onChange={v => { setMpin(v); setError(''); }} disabled={loading} autoFocus />
            {loading && <p className="text-indigo-500 text-sm mt-4 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</p>}
            {error  && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <div className="flex justify-between mt-6 text-sm">
              <button type="button" onClick={() => { setStep('email'); setMpin(''); setError(''); }} className="text-gray-400 hover:text-gray-600">← Back</button>
              <button type="button" onClick={() => { setForgotMode(true); setStep('email'); setMpin(''); setError(''); }} className="text-indigo-500 hover:text-indigo-700">Forgot MPIN?</button>
            </div>
          </div>
        )}

        {/* ── MPIN step: set new (signup) ───────────────── */}
        {step === 'set-mpin' && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Set your MPIN</h1>
            <p className="text-gray-500 text-sm mb-8">Choose a 6-digit code you'll use to log in</p>
            <MpinInput value={mpin} onChange={v => { setMpin(v); setError(''); }} disabled={loading} autoFocus />
            <p className="text-xs text-gray-400 mt-4">Tip: avoid 1234, 0000, or your birth year</p>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <button type="button" onClick={() => { setStep('email'); setMpin(''); setError(''); }} className="mt-5 text-sm text-gray-400 hover:text-gray-600">← Back</button>
          </div>
        )}

        {/* ── MPIN step: confirm (signup) ───────────────── */}
        {step === 'confirm-mpin' && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Confirm your MPIN</h1>
            <p className="text-gray-500 text-sm mb-8">Enter the same 4-digit code again</p>
            <MpinInput value={confirmMpin} onChange={v => { setConfirmMpin(v); setError(''); }} disabled={loading} autoFocus />
            {loading && <p className="text-indigo-500 text-sm mt-4 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</p>}
            {error  && <p className="text-red-500 text-sm mt-4">{error}</p>}
            <button type="button" onClick={() => { setStep('set-mpin'); setConfirmMpin(''); setError(''); }} className="mt-5 text-sm text-gray-400 hover:text-gray-600">← Re-enter MPIN</button>
          </div>
        )}

        {/* ── Reset sent ───────────────────────────────── */}
        {step === 'reset-sent' && (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm">
              We sent a reset link to <span className="font-medium text-gray-700">{form.email}</span>.
              Click it to set a new MPIN.
            </p>
            <button
              type="button"
              onClick={() => resetFlow('signin')}
              className="mt-6 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to sign in
            </button>
          </div>
        )}

        {/* ── Email step (sign in / sign up / forgot) ───── */}
        {step === 'email' && (
          <>
            {/* Tabs */}
            {!forgotMode && (
              <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
                {['signin', 'signup'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => resetFlow(t)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all
                      ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {t === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>
            )}

            {forgotMode && (
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Forgot MPIN?</h1>
                <p className="text-gray-500 text-sm mt-1">Enter your email to receive a reset link</p>
              </div>
            )}

            {/* Google OAuth */}
            {!forgotMode && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {googleLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <GoogleIcon />}
                  Continue with Google
                </button>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </>
            )}

            {/* Email form */}
            <form onSubmit={handleEmailNext} className="space-y-4">
              {tab === 'signup' && !forgotMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setError(''); }}
                    placeholder="John Smith"
                    className={inputCls}
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setError(''); }}
                    placeholder="john@example.com"
                    className={`${inputCls} pl-10`}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
                  : <><ArrowRight className="w-4 h-4" /> {forgotMode ? 'Send reset link' : 'Continue'}</>}
              </button>
            </form>

            {forgotMode && (
              <button
                type="button"
                onClick={() => { setForgotMode(false); setError(''); }}
                className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600"
              >
                ← Back to sign in
              </button>
            )}
          </>
        )}

        {/* Footer note */}
        {step === 'email' && !forgotMode && (
          <p className="text-center text-gray-400 text-xs mt-6">
            {tab === 'signin'
              ? 'Sign in with your 6-digit MPIN — no long password needed.'
              : 'You\'ll set a 6-digit MPIN on the next screen.'}
          </p>
        )}
      </div>
    </div>
  );
}
