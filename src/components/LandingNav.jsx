import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

/**
 * Public-facing navigation for marketing pages (landing page, pricing).
 * Pass showAnchors={true} on the landing page to show the section links.
 */
export default function LandingNav({ showAnchors = false }) {
  const { user }    = useAuth();
  const { isAdmin } = useAdmin();

  const dashTarget = isAdmin ? '/admin/dashboard' : '/dashboard';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
          Reviewz
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-500">
          {showAnchors && (
            <>
              <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</a>
              <a href="#faq"          className="hover:text-indigo-600 transition-colors">FAQ</a>
            </>
          )}
          <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <Link to={dashTarget}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-indigo-200">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/signin" className="hidden sm:block text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Log in</Link>
              <Link to="/signin" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-indigo-200">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
