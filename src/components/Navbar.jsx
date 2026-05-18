import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Star, LogOut, Plus, LayoutDashboard,
  ChevronDown, Menu, X, Settings, ShieldCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

const OWNER_NAV = [
  { to: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/setup',     label: 'Add Business', icon: Plus },
];

const ADMIN_NAV = [
  { to: '/admin/dashboard',     label: 'Overview',      icon: LayoutDashboard },
  { to: '/admin/businesses',    label: 'Businesses',    icon: Settings },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: ShieldCheck },
];

export default function Navbar() {
  const { user }              = useAuth();
  const { isAdmin }           = useAdmin();
  const navigate              = useNavigate();
  const { pathname }  = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  const displayName = user?.user_metadata?.name ?? user?.email ?? '';
  const initials    = user?.user_metadata?.name
    ? user.user_metadata.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? '?');

  function isActive(to) {
    return pathname === to || pathname.startsWith(to + '/');
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) { alert(`Sign-out failed: ${error.message}`); return; }
    navigate('/');
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ──────────────────────────────────────── */}
        <Link
          to={user ? (isAdmin ? '/admin/dashboard' : '/dashboard') : '/'}
          className="flex items-center gap-2 font-bold text-lg text-indigo-600 flex-shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="hidden sm:block">ReviewBoost AI</span>
        </Link>

        {/* ── Desktop nav links ─────────────────────────── */}
        {user && (
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {(isAdmin ? ADMIN_NAV : OWNER_NAV).map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* ── Right side ────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* User avatar dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setDropdownOpen(o => !o); setMobileOpen(false); }}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {initials}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[130px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />

                    {/* Menu */}
                    <div className="absolute right-0 top-11 z-20 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 text-sm overflow-hidden">
                      {/* User info header */}
                      <div className="px-4 py-2.5 border-b border-gray-50 mb-1">
                        <p className="font-semibold text-gray-800 truncate">{displayName}</p>
                        <p className="text-gray-400 text-xs truncate mt-0.5">{user.email}</p>
                      </div>

                      {isAdmin ? (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" /> Admin Portal
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" /> My Dashboard
                          </Link>
                          <Link
                            to="/setup"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                          >
                            <Settings className="w-4 h-4" /> Manage Business
                          </Link>
                        </>
                      )}

                      <div className="border-t border-gray-50 mt-1 pt-1">
                        <button
                          onClick={() => { setDropdownOpen(false); handleSignOut(); }}
                          className="flex items-center gap-2.5 px-4 py-2.5 w-full text-left text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => { setMobileOpen(o => !o); setDropdownOpen(false); }}
                className="md:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            /* Unauthenticated */
            <div className="flex items-center gap-2">
              <Link
                to="/pricing"
                className="hidden sm:block text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/signin"
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile slide-down menu ─────────────────────── */}
      {user && mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-sm">
          {(isAdmin ? ADMIN_NAV : OWNER_NAV).map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(to) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
          <div className="border-t border-gray-50 pt-2 mt-2">
            <button
              onClick={() => { setMobileOpen(false); handleSignOut(); }}
              className="flex items-center gap-2.5 px-4 py-2.5 w-full text-left text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
