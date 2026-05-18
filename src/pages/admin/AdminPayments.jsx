import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download, Plus, Receipt, ArrowUpRight, X } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

const PLAN_LABELS = {
  monthly: 'Monthly', '3months': '3 Months',
  '6months': '6 Months', '12months': '12 Months',
};

function AddPaymentModal({ onClose, onSuccess }) {
  const [businesses, setBusinesses] = useState([]);
  const [form, setForm] = useState({
    business_id: '', amount: '', transaction_id: '',
    plan_duration: 'monthly', notes: '',
    payment_date: new Date().toISOString().slice(0, 16),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    supabase.from('businesses').select('id, name').order('name').then(({ data }) => setBusinesses(data || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('payments').insert({
      business_id: form.business_id,
      transaction_id: form.transaction_id || null,
      amount: parseFloat(form.amount),
      payment_date: new Date(form.payment_date).toISOString(),
      plan_duration: form.plan_duration,
      notes: form.notes || null,
    });
    if (err) { setError(err.message); setSaving(false); return; }
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-lg">Add Payment Record</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg p-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Business *</label>
            <select required value={form.business_id} onChange={e => setForm(p => ({ ...p, business_id: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select business…</option>
              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹) *</label>
            <input type="number" required min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="999" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
            <select value={form.plan_duration} onChange={e => setForm(p => ({ ...p, plan_duration: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
            <input type="datetime-local" value={form.payment_date} onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID <span className="text-slate-400 font-normal">(optional)</span></label>
            <input value={form.transaction_id} onChange={e => setForm(p => ({ ...p, transaction_id: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="UPI ref / Razorpay ID…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select(`
        id, amount, payment_date, transaction_id, plan_duration, notes, created_at,
        businesses(id, name, owner_name)
      `)
      .order('payment_date', { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    const headers = ['Date', 'Business', 'Owner', 'Amount', 'Plan', 'Transaction ID', 'Notes'];
    const rows = payments.map(p => [
      new Date(p.payment_date).toLocaleString('en-IN'),
      p.businesses?.name || '', p.businesses?.owner_name || '',
      p.amount, PLAN_LABELS[p.plan_duration] || p.plan_duration || '',
      p.transaction_id || '', p.notes || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'payments.csv' }).click();
    URL.revokeObjectURL(url);
  }

  const totalRevenue = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const currentMonth = new Date().getMonth();
  const currentYear  = new Date().getFullYear();
  const monthRevenue = payments
    .filter(p => { const d = new Date(p.payment_date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
    .reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const filtered = payments.filter(p => {
    if (!search) return true;
    return [p.businesses?.name, p.businesses?.owner_name, p.transaction_id]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
            <p className="text-slate-500 text-sm mt-0.5">{payments.length} payment records</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm">
              <Plus className="w-4 h-4" /> Add Payment
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-800">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">This Month</p>
            <p className="text-2xl font-bold text-indigo-600">₹{monthRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Transactions</p>
            <p className="text-2xl font-bold text-slate-800">{payments.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by business, owner, transaction ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <Receipt className="w-10 h-10 text-slate-200" />
              <p className="text-slate-400 text-sm">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Date & Time', 'Business', 'Amount', 'Plan', 'Transaction ID', 'Notes'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <br />
                        <span className="text-slate-400">{new Date(p.payment_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/businesses/${p.businesses?.id}`} className="flex items-center gap-2 group">
                          <div>
                            <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{p.businesses?.name || '—'}</p>
                            <p className="text-xs text-slate-400">{p.businesses?.owner_name || ''}</p>
                          </div>
                          <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-400" />
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800 text-base">
                        ₹{parseFloat(p.amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3">
                        {p.plan_duration && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                            {PLAN_LABELS[p.plan_duration] || p.plan_duration}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.transaction_id || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddPaymentModal onClose={() => setShowAdd(false)} onSuccess={() => { load(); setShowAdd(false); }} />}
    </AdminLayout>
  );
}
