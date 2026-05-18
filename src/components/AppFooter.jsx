import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Shared footer for authenticated owner pages and public pages like /pricing.
 * The landing page (/) has its own elaborate footer — don't use this there.
 * Owner-only links (Dashboard, Add Business) are hidden from unauthenticated users.
 */
export default function AppFooter() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-gray-100 bg-white py-6 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:opacity-80 transition-opacity">
          <Star className="w-4 h-4 fill-indigo-600" />
          ReviewBoost AI
        </Link>

        <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-400">
          {user && (
            <>
              <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
              <Link to="/setup"     className="hover:text-indigo-600 transition-colors">Add Business</Link>
            </>
          )}
          <Link to="/pricing" className="hover:text-indigo-600 transition-colors">Pricing</Link>
          <Link to="/"        className="hover:text-indigo-600 transition-colors">Home</Link>
        </div>

        <p className="text-xs text-gray-300">© {new Date().getFullYear()} ReviewBoost AI</p>
      </div>
    </footer>
  );
}
