import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminLogin() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const navigate                  = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
      if (authErr) { setError(authErr.message); setLoading(false); return; }

      // Verify admin role
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!adminData) {
        await supabase.auth.signOut();
        setError('Access denied. This account does not have admin privileges.');
        setLoading(false);
        return;
      }

      navigate('/admin/dashboard');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-900/50">
            <Star className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ReviewBoost AI</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Shield className="w-4 h-4 text-indigo-400" />
            <p className="text-indigo-400 text-sm font-medium">Super Admin Portal</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-1">Admin Sign In</h2>
          <p className="text-slate-500 text-sm mb-6">Restricted access — authorized personnel only</p>

          {error && (
            <div className="flex items-start gap-3 p-3 mb-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@reviewboost.ai"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              {loading ? 'Signing in…' : 'Sign In to Admin Panel'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Not an admin?{' '}
            <Link to="/signin" className="text-indigo-600 hover:underline">Business owner login →</Link>
          </p>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © 2026 ReviewBoost AI · Admin Portal
        </p>
      </div>
    </div>
  );
}
