import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Plus, Eye, Edit2, Ban, CheckCircle,
  Trash2, Download, ArrowUpRight, Building2, MoreVertical
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

const STATUS_COLORS = {
  active:    'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  inactive:  'bg-slate-100 text-slate-500',
};

function ConfirmModal({ title, message, onConfirm, onCancel, danger }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="font-bold text-slate-800 text-lg mb-2">{title}</h3>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function AddBusinessModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', owner_name: '', email: '', phone: '', location: '', category: '', plan_type: 'monthly', google_link: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    // user_id is NULL for admin-created businesses (no linked auth user yet)
    const { data, error: err } = await supabase.from('businesses').insert({
      ...form,
      user_id: null,
      status: 'active',
    }).select().single();

    if (err) { setError(err.message); setSaving(false); return; }
    onSuccess(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Add Business</h3>
        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg p-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name', label: 'Business Name', required: true },
            { key: 'owner_name', label: 'Owner Name' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'Phone' },
            { key: 'location', label: 'Location / Address', required: true },
            { key: 'category', label: 'Category', required: true },
            { key: 'google_link', label: 'Google Review Link', required: true },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                required={f.required}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plan Type</label>
            <select value={form.plan_type} onChange={e => setForm(p => ({ ...p, plan_type: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="monthly">Monthly</option>
              <option value="3months">3 Months</option>
              <option value="6months">6 Months</option>
              <option value="12months">12 Months</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Adding…' : 'Add Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all');
  const [confirm, setConfirm]       = useState(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [openMenu, setOpenMenu]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('businesses')
      .select(`
        id, name, owner_name, email, phone, location, category,
        plan_type, status, created_at,
        stores(count),
        subscriptions(status, expiry_date)
      `)
      .order('created_at', { ascending: false });
    setBusinesses(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id, status) {
    const { error } = await supabase.from('businesses').update({ status }).eq('id', id);
    if (error) { alert(`Failed to update status: ${error.message}`); setConfirm(null); return; }
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    setConfirm(null);
  }

  async function deleteBusiness(id) {
    const { error } = await supabase.from('businesses').delete().eq('id', id);
    if (error) { alert(`Failed to delete business: ${error.message}`); setConfirm(null); return; }
    setBusinesses(prev => prev.filter(b => b.id !== id));
    setConfirm(null);
  }

  function exportCSV() {
    const headers = ['Name', 'Owner', 'Email', 'Phone', 'Location', 'Plan', 'Status'];
    const rows = businesses.map(b => [
      b.name, b.owner_name || '', b.email || '', b.phone || '',
      b.location || '', b.plan_type || '', b.status || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'businesses.csv' }).click();
    URL.revokeObjectURL(url);
  }

  const filtered = businesses.filter(b => {
    const matchSearch = !search || [b.name, b.owner_name, b.email, b.phone, b.location]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === 'all' || b.status === filter;
    return matchSearch && matchFilter;
  });

  function getSubStatus(biz) {
    const subs = biz.subscriptions || [];
    const today = new Date().toISOString().split('T')[0];
    const active = subs.find(s => s.status === 'active' && s.expiry_date >= today);
    if (active) return { label: 'Active', cls: 'bg-green-100 text-green-700', expiry: active.expiry_date };
    const latest = [...subs].sort((a, b) => new Date(b.expiry_date) - new Date(a.expiry_date))[0];
    if (!latest) return { label: 'None', cls: 'bg-slate-100 text-slate-500', expiry: null };
    return { label: 'Expired', cls: 'bg-amber-100 text-amber-700', expiry: latest.expiry_date };
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Businesses</h1>
            <p className="text-slate-500 text-sm mt-0.5">{businesses.length} total businesses</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm">
              <Plus className="w-4 h-4" /> Add Business
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, owner, location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {['all', 'active', 'suspended', 'inactive'].map(s => (
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
              <Building2 className="w-10 h-10 text-slate-200" />
              <p className="text-slate-400 text-sm">No businesses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Business', 'Owner / Email', 'Stores', 'Plan', 'Status', 'Subscription', 'Expiry', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(biz => {
                    const sub = getSubStatus(biz);
                    const storeCount = biz.stores?.[0]?.count ?? 0;
                    return (
                      <tr key={biz.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                              {biz.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{biz.name}</p>
                              <p className="text-xs text-slate-400">{biz.location || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700">{biz.owner_name || '—'}</p>
                          <p className="text-xs text-slate-400">{biz.email || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{storeCount}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium capitalize">
                            {biz.plan_type || 'monthly'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[biz.status] || STATUS_COLORS.active}`}>
                            {biz.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${sub.cls}`}>{sub.label}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {sub.expiry ? new Date(sub.expiry).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link to={`/admin/businesses/${biz.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <div className="relative">
                              <button onClick={() => setOpenMenu(openMenu === biz.id ? null : biz.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenu === biz.id && (
                                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 z-10 py-1" onMouseLeave={() => setOpenMenu(null)}>
                                  <Link to={`/admin/businesses/${biz.id}`}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                  </Link>
                                  {biz.status !== 'suspended' ? (
                                    <button onClick={() => { setOpenMenu(null); setConfirm({ type: 'suspend', id: biz.id, name: biz.name }); }}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 w-full">
                                      <Ban className="w-3.5 h-3.5" /> Suspend
                                    </button>
                                  ) : (
                                    <button onClick={() => { setOpenMenu(null); updateStatus(biz.id, 'active'); }}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 w-full">
                                      <CheckCircle className="w-3.5 h-3.5" /> Activate
                                    </button>
                                  )}
                                  <button onClick={() => { setOpenMenu(null); setConfirm({ type: 'delete', id: biz.id, name: biz.name }); }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
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

      {confirm?.type === 'suspend' && (
        <ConfirmModal
          title={`Suspend "${confirm.name}"?`}
          message="This will suspend all their QR codes and store flows immediately."
          onConfirm={() => updateStatus(confirm.id, 'suspended')}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}

      {confirm?.type === 'delete' && (
        <ConfirmModal
          title={`Delete "${confirm.name}"?`}
          message="This will permanently delete the business and all its stores, subscriptions, and data. This cannot be undone."
          onConfirm={() => deleteBusiness(confirm.id)}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}

      {showAdd && (
        <AddBusinessModal onClose={() => setShowAdd(false)} onSuccess={() => load()} />
      )}
    </AdminLayout>
  );
}
