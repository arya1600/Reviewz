import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Store, QrCode, CreditCard, TrendingUp,
  IndianRupee, CalendarPlus, RefreshCw, ArrowUpRight
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

function StatCard({ icon: Icon, label, value, sub, color, to }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    sky:    'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
  };
  const card = (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {to && <ArrowUpRight className="w-4 h-4 text-slate-300" />}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      <p className="text-sm font-medium text-slate-600 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

function BarChart({ data, title }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-36">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-600">{d.value || ''}</span>
            <div className="w-full flex items-end" style={{ height: '100px' }}>
              <div
                className="w-full bg-indigo-500 rounded-t-lg transition-all duration-500"
                style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 8 : 2)}px` }}
              />
            </div>
            <span className="text-xs text-slate-400 truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ active, expired, suspended }) {
  const total = active + expired + suspended || 1;
  const activePct   = (active / total) * 100;
  const expiredPct  = (expired / total) * 100;
  const suspendedPct = (suspended / total) * 100;

  // SVG donut via stroke-dasharray
  const r = 36, circ = 2 * Math.PI * r;
  const activeLen   = (activePct / 100) * circ;
  const expiredLen  = (expiredPct / 100) * circ;
  const suspLen     = (suspendedPct / 100) * circ;

  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        {/* Active */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#6366f1" strokeWidth="14"
          strokeDasharray={`${activeLen} ${circ - activeLen}`}
          strokeDashoffset={circ / 4} strokeLinecap="butt"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        {/* Expired */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f97316" strokeWidth="14"
          strokeDasharray={`${expiredLen} ${circ - expiredLen}`}
          strokeDashoffset={circ / 4 - activeLen}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        {/* Suspended */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#ef4444" strokeWidth="14"
          strokeDasharray={`${suspLen} ${circ - suspLen}`}
          strokeDashoffset={circ / 4 - activeLen - expiredLen}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">{total}</text>
      </svg>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-sm text-slate-600">Active <span className="font-semibold text-slate-800">{active}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-sm text-slate-600">Expired <span className="font-semibold text-slate-800">{expired}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-slate-600">Suspended <span className="font-semibold text-slate-800">{suspended}</span></span>
        </div>
      </div>
    </div>
  );
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function last6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] });
  }
  return months;
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [charts, setCharts]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    setRefreshing(true);
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const results = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('stores').select('*', { count: 'exact', head: true }),
      supabase.from('stores').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').gte('expiry_date', today),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).or(`status.eq.expired,and(status.eq.active,expiry_date.lt.${today})`),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
      supabase.from('payments').select('amount').gte('payment_date', startOfMonth),
      supabase.from('businesses').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('subscriptions').select('created_at').gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString()),
      supabase.from('businesses').select('id, name, owner_name, status, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const firstErr = results.find(r => r.error)?.error;
    if (firstErr) console.error('[AdminDashboard] loadData:', firstErr.message);

    const [
      { count: totalBiz },
      { count: totalStores },
      { count: activeStores },
      { count: activeSubs },
      { count: expiredSubs },
      { count: suspendedSubs },
      { data: monthPayments },
      { count: newBiz },
      { data: subsByDate },
      { data: recentBiz },
    ] = results;

    const monthlyRevenue = monthPayments?.reduce((s, p) => s + parseFloat(p.amount || 0), 0) || 0;

    // Build monthly sub growth chart
    const months = last6Months();
    const subChart = months.map(m => ({
      label: m.label,
      value: (subsByDate || []).filter(s => {
        const d = new Date(s.created_at);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      }).length,
    }));

    setStats({
      totalBiz: totalBiz || 0,
      totalStores: totalStores || 0,
      activeStores: activeStores || 0,
      activeSubs: activeSubs || 0,
      expiredSubs: expiredSubs || 0,
      suspendedSubs: suspendedSubs || 0,
      monthlyRevenue,
      newBiz: newBiz || 0,
      recentBiz: recentBiz || [],
    });
    setCharts({ subChart });
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const fmt = n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n;
  const fmtCurrency = n => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">Reviewz platform overview</p>
          </div>
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Building2}    label="Total Businesses"        value={fmt(stats.totalBiz)}        color="indigo" to="/admin/businesses" />
          <StatCard icon={Store}        label="Active Stores"           value={fmt(stats.activeStores)}    sub={`of ${stats.totalStores} total`} color="green" />
          <StatCard icon={QrCode}       label="Total QR Codes"          value={fmt(stats.totalStores)}     color="sky" />
          <StatCard icon={CreditCard}   label="Active Subscriptions"    value={fmt(stats.activeSubs)}      color="green" to="/admin/subscriptions" />
          <StatCard icon={TrendingUp}   label="Expired Subscriptions"   value={fmt(stats.expiredSubs)}     color="amber" to="/admin/subscriptions" />
          <StatCard icon={IndianRupee}  label="Revenue This Month"      value={fmtCurrency(stats.monthlyRevenue)} color="violet" to="/admin/payments" />
          <StatCard icon={CalendarPlus} label="New Businesses"          value={fmt(stats.newBiz)}          sub="this month" color="sky" />
          <StatCard icon={Building2}    label="Suspended"               value={fmt(stats.suspendedSubs)}   color="red" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Bar chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <BarChart data={charts.subChart} title="New Subscriptions — Last 6 Months" />
          </div>

          {/* Donut */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Subscription Status</h3>
            <DonutChart
              active={stats.activeSubs}
              expired={stats.expiredSubs}
              suspended={stats.suspendedSubs}
            />
          </div>
        </div>

        {/* Recent businesses */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Recent Businesses</h3>
            <Link to="/admin/businesses" className="text-sm text-indigo-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.recentBiz.length === 0 ? (
              <p className="px-6 py-8 text-slate-400 text-sm text-center">No businesses yet.</p>
            ) : (
              stats.recentBiz.map(biz => (
                <Link
                  key={biz.id}
                  to={`/admin/businesses/${biz.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {biz.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{biz.name}</p>
                    <p className="text-xs text-slate-400">{biz.owner_name || 'No owner name'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    biz.status === 'active'    ? 'bg-green-100 text-green-700' :
                    biz.status === 'suspended' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {biz.status || 'active'}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-300" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
