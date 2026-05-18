import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Store, CreditCard, Receipt,
  Settings, LogOut, Star, Menu, X, ChevronRight, Bell, Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/admin/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/businesses',     icon: Building2,       label: 'Businesses' },
  { to: '/admin/subscriptions',  icon: CreditCard,      label: 'Subscriptions' },
  { to: '/admin/payments',       icon: Receipt,         label: 'Payments' },
  { to: '/admin/settings',       icon: Settings,        label: 'Settings' },
];

function NavLink({ to, icon: Icon, label, onClick }) {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
        ${active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-400 hover:text-white hover:bg-slate-700'
        }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {label}
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) { alert(`Sign-out failed: ${error.message}`); return; }
    navigate('/admin/login');
  }

  const sidebar = (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Star className="w-4 h-4 text-white fill-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">ReviewBoost AI</p>
          <p className="text-slate-400 text-xs flex items-center gap-1">
            <Shield className="w-3 h-3" /> Super Admin
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink key={item.to} {...item} onClick={() => setSidebarOpen(false)} />
        ))}
      </nav>

      {/* User + Sign Out */}
      <div className="px-3 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.email?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.email}</p>
            <p className="text-slate-400 text-xs">Super Admin</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-60 z-10">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              <Bell className="w-5 h-5" />
            </button>
            <Link
              to="/"
              target="_blank"
              className="text-xs text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
            >
              View Site ↗
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
