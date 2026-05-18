import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, CreditCard, ArrowUpRight, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

const PLAN_LABELS = {
  monthly:   'Monthly',
  '3months': '3 Months',
  '6months': '6 Months',
  '12months':'12 Months',
};

function getEffectiveStatus(sub) {
  const today = new Date().toISOString().split('T')[0];
  if (sub.status === 'suspended') return 'suspended';
  if (sub.status === 'active' && sub.expiry_date >= today) return 'active';
  return 'expired';
}

const STATUS_CLS = {
  active:    'bg-green-100 text-green-700',
  expired:   'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
  pending:   'bg-sky-100 text-sky-700',
};

export default function AdminSubscriptions() {
  const [subs, setSubs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('subscriptions')
      .select(`
        id, plan_duration, amount, start_date, expiry_date, status, notes, created_at,
        businesses(id, name, owner_name, email)
      `)
      .order('created_at', { ascending: false });
    setSubs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id, status) {
    const { error } = await supabase.from('subscriptions').update({ status }).eq('id', id);
    if (error) { alert(`Failed to update status: ${error.message}`); return; }
    setSubs(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  }

  function exportCSV() {
    const headers = ['Business', 'Owner', 'Email', 'Plan', 'Amount', 'Start', 'Expiry', 'Status'];
    const rows = subs.map(s => [
      s.businesses?.name || '', s.businesses?.owner_name || '', s.businesses?.email || '',
      PLAN_LABELS[s.plan_duration] || s.plan_duration, s.amount,
      s.start_date, s.expiry_date, getEffectiveStatus(s),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'subscriptions.csv' }).click();
    URL.revokeObjectURL(url);
  }

  const filtered = subs.filter(s => {
    const status = getEffectiveStatus(s);
    const matchFilter = filter === 'all' || status === filter;
    const searchStr = [s.businesses?.name, s.businesses?.owner_name, s.businesses?.email].join(' ').toLowerCase();
    const matchSearch = !search || searchStr.includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    all:       subs.length,
    active:    subs.filter(s => getEffectiveStatus(s) === 'active').length,
    expired:   subs.filter(s => getEffectiveStatus(s) === 'expired').length,
    suspended: subs.filter(s => getEffectiveStatus(s) === 'suspended').length,
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Subscriptions</h1>
            <p className="text-slate-500 text-sm mt-0.5">{subs.length} total records</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total',     value: counts.all,       cls: 'bg-slate-50 border-slate-200 text-slate-700' },
            { label: 'Active',    value: counts.active,    cls: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Expired',   value: counts.expired,   cls: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Suspended', value: counts.suspended, cls: 'bg-red-50 border-red-200 text-red-700' },
          ].map(c => (
            <div key={c.label} className={`rounded-2xl border p-4 ${c.cls}`}>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-sm font-medium mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by business name, owner, email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {['all', 'active', 'expired', 'suspended'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <CreditCard className="w-10 h-10 text-slate-200" />
              <p className="text-slate-400 text-sm">No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Business', 'Plan', 'Amount', 'Start Date', 'Expiry Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(sub => {
                    const status = getEffectiveStatus(sub);
                    const today  = new Date().toISOString().split('T')[0];
                    const daysLeft = status === 'active'
                      ? Math.ceil((new Date(sub.expiry_date) - new Date()) / 86400000)
                      : 0;
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/admin/businesses/${sub.businesses?.id}`}
                            className="flex items-center gap-2 group">
                            <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs">
                              {sub.businesses?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{sub.businesses?.name || '—'}</p>
                              <p className="text-xs text-slate-400">{sub.businesses?.owner_name || ''}</p>
                            </div>
                            <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-400" />
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                            {PLAN_LABELS[sub.plan_duration] || sub.plan_duration}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          ₹{parseFloat(sub.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(sub.start_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-slate-700">{new Date(sub.expiry_date).toLocaleDateString('en-IN')}</p>
                          {status === 'active' && (
                            <p className={`text-xs ${daysLeft <= 7 ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                              {daysLeft}d remaining
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_CLS[status]}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {status !== 'suspended' && (
                              <button onClick={() => updateStatus(sub.id, 'suspended')}
                                className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100">Suspend</button>
                            )}
                            {status === 'suspended' && (
                              <button onClick={() => updateStatus(sub.id, 'active')}
                                className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-lg hover:bg-green-100">Activate</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
