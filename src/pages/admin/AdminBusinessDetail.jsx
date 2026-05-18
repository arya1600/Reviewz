import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, Store, CreditCard, Receipt, Edit2,
  CheckCircle, Ban, Trash2, Plus, QrCode, ExternalLink,
  Calendar, Clock, AlertTriangle, Download, Copy, Check
} from 'lucide-react';
import QRCode from 'react-qr-code';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

import { PLAN_DURATIONS, suggestedPrice } from '../../utils/pricing';

function addDays(dateStr, days) {
  const d = new Date(dateStr || new Date());
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function StatusBadge({ status }) {
  const cls = {
    active:    'bg-green-100 text-green-700',
    expired:   'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
    pending:   'bg-sky-100 text-sky-700',
    none:      'bg-slate-100 text-slate-500',
    inactive:  'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${cls[status] || cls.none}`}>
      {status || 'none'}
    </span>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
        active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}>
      {children}
    </button>
  );
}

/* ── Store QR Card ───────────────────────────────────────────── */
function StoreCard({ store, onToggleStatus, onDelete }) {
  const [copied, setCopied] = useState(false);
  const qrUrl = `${window.location.origin}/r/${store.slug}`;

  function copyLink() {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQR() {
    const svg = document.getElementById(`qr-${store.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, 256, 256); canvas.toBlob(blob => { const url = URL.createObjectURL(blob); Object.assign(document.createElement('a'), { href: url, download: `qr-${store.slug}.png` }).click(); URL.revokeObjectURL(url); }); };
    img.src = 'data:image/svg+xml;base64,' + btoa(
      Array.from(new TextEncoder().encode(svgData), b => String.fromCharCode(b)).join('')
    );
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 ${store.status === 'suspended' ? 'border-red-200 opacity-75' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-slate-800">{store.store_name}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{store.city}</p>
        </div>
        <StatusBadge status={store.status} />
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center bg-slate-50 rounded-xl p-4 mb-4">
        <div className="bg-white p-3 rounded-xl shadow-sm mb-2">
          <QRCode id={`qr-${store.id}`} value={qrUrl} size={120} />
        </div>
        <p className="text-xs text-slate-500 text-center break-all mt-1">{qrUrl}</p>
      </div>

      {/* Info */}
      {store.google_review_link && (
        <a href={store.google_review_link} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline mb-3">
          <ExternalLink className="w-3 h-3" /> Google Review Link
        </a>
      )}
      {store.last_scan_at && (
        <p className="text-xs text-slate-400 mb-3">
          <Clock className="w-3 h-3 inline mr-1" />
          Last scan: {new Date(store.last_scan_at).toLocaleDateString('en-IN')}
        </p>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button onClick={copyLink} className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button onClick={downloadQR} className="flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors">
          <Download className="w-3 h-3" /> Download QR
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onToggleStatus(store.id, store.status === 'active' ? 'suspended' : 'active')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
            store.status === 'active'
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
              : 'bg-green-50 hover:bg-green-100 text-green-700'
          }`}>
          {store.status === 'active' ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
          {store.status === 'active' ? 'Suspend' : 'Activate'}
        </button>
        <button onClick={() => onDelete(store.id)} className="flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-medium text-red-600 transition-colors">
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>
    </div>
  );
}

/* ── Add Store Modal ─────────────────────────────────────────── */
function AddStoreModal({ businessId, onClose, onSuccess }) {
  const [form, setForm] = useState({ store_name: '', city: '', google_review_link: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function generateSlug(name, city) {
    const base = `${name}-${city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const rand = Math.random().toString(36).slice(2, 6);
    return `${base}-${rand}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const slug = generateSlug(form.store_name, form.city);
    const { data, error: err } = await supabase.from('stores').insert({
      ...form,
      business_id: businessId,
      slug,
      status: 'active',
    }).select().single();
    if (err) { setError(err.message); setSaving(false); return; }
    onSuccess(data);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Add Store Location</h3>
        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg p-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Store Name *</label>
            <input required value={form.store_name} onChange={e => setForm(p => ({ ...p, store_name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Main Branch" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
            <input required value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Mumbai" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Google Review Link</label>
            <input value={form.google_review_link} onChange={e => setForm(p => ({ ...p, google_review_link: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://g.page/r/..." />
          </div>
          <p className="text-xs text-slate-400">A unique QR code URL will be generated for this store and will never change.</p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Adding…' : 'Add Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Extend Subscription Modal ───────────────────────────────── */
function ExtendSubModal({ businessId, storeCount, currentExpiry, onClose, onSuccess }) {
  const [plan, setPlan]         = useState('monthly');
  const [amount, setAmount]     = useState(String(suggestedPrice(storeCount, 'monthly')));
  const [txId, setTxId]         = useState('');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const today = new Date().toISOString().split('T')[0];
  const base  = currentExpiry && currentExpiry >= today ? currentExpiry : today;
  const newExpiry = addDays(base, PLAN_DURATIONS[plan].days);

  function onPlanChange(p) {
    setPlan(p);
    setAmount(String(suggestedPrice(storeCount, p)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Expire any currently active subscription rows for this business so
      // AdminDashboard's "active subscriptions" count stays accurate.
      // (The RPC uses latest-expiry-wins, so access gating is unaffected,
      // but duplicate active rows inflate reporting metrics.)
      const { error: expireErr } = await supabase
        .from('subscriptions')
        .update({ status: 'expired' })
        .eq('business_id', businessId)
        .eq('status', 'active');
      if (expireErr) throw expireErr;

      // Create the new subscription record
      const { data: sub, error: subErr } = await supabase.from('subscriptions').insert({
        business_id: businessId,
        plan_duration: plan,
        plan_name:    'manual',
        amount: parseFloat(amount),
        start_date: today,
        expiry_date: newExpiry,
        status: 'active',
        notes,
      }).select().single();
      if (subErr) throw subErr;

      // Create payment record
      const { error: pmtErr } = await supabase.from('payments').insert({
        business_id: businessId,
        subscription_id: sub.id,
        transaction_id: txId || null,
        amount: parseFloat(amount),
        payment_date: new Date().toISOString(),
        plan_duration: plan,
        notes,
      });
      if (pmtErr) throw pmtErr;

      // Re-activate all stores for this business (if expired)
      await supabase.from('stores')
        .update({ status: 'active' })
        .eq('business_id', businessId)
        .in('status', ['expired']);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <h3 className="font-bold text-slate-800 text-lg mb-1">Extend Subscription</h3>
        <p className="text-slate-500 text-sm mb-4">Current expiry: <strong>{currentExpiry || 'None'}</strong></p>
        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 rounded-lg p-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plan Duration</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PLAN_DURATIONS).map(([key, val]) => (
                <button key={key} type="button" onClick={() => onPlanChange(key)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${plan === key ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  <div>{val.label}</div>
                  <div className="text-xs mt-0.5 font-normal text-slate-400">₹{suggestedPrice(storeCount, key).toLocaleString('en-IN')}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>New expiry date:</span>
              <span className="font-semibold text-indigo-700">{newExpiry}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID <span className="text-slate-400 font-normal">(optional)</span></label>
            <input value={txId} onChange={e => setTxId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="UPI / Razorpay / Bank ref" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Processing…' : 'Extend & Activate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function AdminBusinessDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [tab, setTab]               = useState('overview');
  const [biz, setBiz]               = useState(null);
  const [stores, setStores]         = useState([]);
  const [subs, setSubs]             = useState([]);
  const [payments, setPayments]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAddStore, setShowAddStore]   = useState(false);
  const [showExtend, setShowExtend]       = useState(false);
  const [editing, setEditing]             = useState(false);
  const [editForm, setEditForm]           = useState({});
  const [saving, setSaving]               = useState(false);
  const [pageError, setPageError]         = useState('');
  const [saveError, setSaveError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setPageError('');
    const [
      { data: bizData, error: bizErr },
      { data: storesData },
      { data: subsData },
      { data: paymentsData },
    ] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', id).single(),
      supabase.from('stores').select('*').eq('business_id', id).order('created_at'),
      supabase.from('subscriptions').select('*').eq('business_id', id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('business_id', id).order('payment_date', { ascending: false }),
    ]);
    if (bizErr) { setPageError(bizErr.message); setLoading(false); return; }
    setBiz(bizData);
    setEditForm(bizData || {});
    setStores(storesData || []);
    setSubs(subsData || []);
    setPayments(paymentsData || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function saveEdit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    const { error: err } = await supabase.from('businesses').update({
      name: editForm.name, owner_name: editForm.owner_name,
      email: editForm.email, phone: editForm.phone,
      location: editForm.location, category: editForm.category,
      plan_type: editForm.plan_type, google_link: editForm.google_link,
      status: editForm.status,
    }).eq('id', id);
    setSaving(false);
    if (err) { setSaveError(err.message); return; }
    setEditing(false);
    load();
  }

  async function toggleStoreStatus(storeId, newStatus) {
    const { error } = await supabase.from('stores').update({ status: newStatus }).eq('id', storeId);
    if (error) { alert(`Failed to update store: ${error.message}`); return; }
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, status: newStatus } : s));
  }

  async function deleteStore(storeId) {
    if (!confirm('Delete this store? This cannot be undone.')) return;
    const { error } = await supabase.from('stores').delete().eq('id', storeId);
    if (error) { alert(`Failed to delete store: ${error.message}`); return; }
    setStores(prev => prev.filter(s => s.id !== storeId));
  }

  async function deleteBusiness() {
    if (!confirm(`Delete "${biz.name}" permanently? All data will be lost.`)) return;
    const { error } = await supabase.from('businesses').delete().eq('id', id);
    if (error) { alert(`Failed to delete: ${error.message}`); return; }
    navigate('/admin/businesses');
  }

  const today = new Date().toISOString().split('T')[0];
  const activeSub = subs.find(s => s.status === 'active' && s.expiry_date >= today);
  const currentExpiry = activeSub?.expiry_date || subs[0]?.expiry_date || null;
  const subStatus = activeSub ? 'active' : (subs.length > 0 ? 'expired' : 'none');

  const daysLeft = activeSub
    ? Math.max(0, Math.ceil((new Date(activeSub.expiry_date) - new Date()) / 86400000))
    : 0;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (pageError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-red-600 bg-red-50 rounded-xl p-4 text-sm">{pageError}</p>
        </div>
      </AdminLayout>
    );
  }

  if (!biz) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-slate-500">Business not found.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Back */}
        <Link to="/admin/businesses" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Businesses
        </Link>

        {/* Business header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-indigo-600">
                {biz.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{biz.name}</h1>
                <p className="text-slate-500 text-sm">{biz.category} · {biz.location}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={biz.status || 'active'} />
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-400">Sub: </span>
                  <StatusBadge status={subStatus} />
                  {activeSub && (
                    <span className={`text-xs font-medium ${daysLeft <= 7 ? 'text-red-500' : 'text-slate-400'}`}>
                      {daysLeft <= 7 && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                      {daysLeft}d left
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowExtend(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700">
                <CreditCard className="w-3.5 h-3.5" /> Extend Subscription
              </button>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-medium rounded-xl hover:bg-slate-200">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              {biz.status !== 'suspended' ? (
                <button onClick={async () => {
                  const { error } = await supabase.from('businesses').update({ status: 'suspended' }).eq('id', id);
                  if (error) { alert(error.message); return; }
                  load();
                }} className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 text-xs font-medium rounded-xl hover:bg-amber-100">
                  <Ban className="w-3.5 h-3.5" /> Suspend
                </button>
              ) : (
                <button onClick={async () => {
                  const { error } = await supabase.from('businesses').update({ status: 'active' }).eq('id', id);
                  if (error) { alert(error.message); return; }
                  load();
                }} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 text-xs font-medium rounded-xl hover:bg-green-100">
                  <CheckCircle className="w-3.5 h-3.5" /> Activate
                </button>
              )}
              <button onClick={deleteBusiness} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-medium rounded-xl hover:bg-red-100">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-5 overflow-x-auto">
          {[
            { id: 'overview',      label: 'Overview',      icon: Building2 },
            { id: 'stores',        label: `Stores (${stores.length})`, icon: Store },
            { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
            { id: 'payments',      label: 'Payments',      icon: Receipt },
          ].map(t => (
            <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </TabButton>
          ))}
        </div>

        {/* ── Overview Tab ───────────────────────────────────── */}
        {tab === 'overview' && (
          editing ? (
            <form onSubmit={saveEdit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Edit Business</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Business Name' },
                  { key: 'owner_name', label: 'Owner Name' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'location', label: 'Location' },
                  { key: 'category', label: 'Category' },
                  { key: 'google_link', label: 'Google Review Link' },
                ].map(f => (
                  <div key={f.key} className={f.key === 'google_link' ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                    <input type={f.type || 'text'} value={editForm[f.key] || ''}
                      onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Plan Type</label>
                  <select value={editForm.plan_type || 'monthly'} onChange={e => setEditForm(p => ({ ...p, plan_type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="monthly">Monthly</option>
                    <option value="3months">3 Months</option>
                    <option value="6months">6 Months</option>
                    <option value="12months">12 Months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={editForm.status || 'active'} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              {saveError && (
                <p className="text-red-600 text-sm bg-red-50 rounded-xl p-3 mt-2">{saveError}</p>
              )}
              <div className="flex gap-3 mt-5">
                <button type="button" onClick={() => { setEditing(false); setSaveError(''); }} className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Owner Name', value: biz.owner_name },
                { label: 'Email', value: biz.email },
                { label: 'Phone', value: biz.phone },
                { label: 'Category', value: biz.category },
                { label: 'Location', value: biz.location },
                { label: 'Plan Type', value: biz.plan_type },
                { label: 'Total Stores', value: stores.length },
                { label: 'Active Stores', value: stores.filter(s => s.status === 'active').length },
                { label: 'Subscription', value: subStatus },
                { label: 'Expiry Date', value: currentExpiry || 'None' },
                { label: 'Joined', value: new Date(biz.created_at).toLocaleDateString('en-IN') },
                { label: 'Total Payments', value: payments.length },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Stores Tab ────────────────────────────────────── */}
        {tab === 'stores' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-500">{stores.length} store{stores.length !== 1 ? 's' : ''}</p>
              <button onClick={() => setShowAddStore(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700">
                <Plus className="w-3.5 h-3.5" /> Add Store
              </button>
            </div>
            {stores.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <QrCode className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No store locations yet.</p>
                <button onClick={() => setShowAddStore(true)} className="mt-3 text-indigo-600 text-sm hover:underline">Add first store →</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stores.map(store => (
                  <StoreCard key={store.id} store={store} onToggleStatus={toggleStoreStatus} onDelete={deleteStore} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Subscriptions Tab ─────────────────────────────── */}
        {tab === 'subscriptions' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-500">{subs.length} subscription records</p>
              <button onClick={() => setShowExtend(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700">
                <Plus className="w-3.5 h-3.5" /> Add Subscription
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {subs.length === 0 ? (
                <p className="text-center text-slate-400 py-12 text-sm">No subscriptions yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Plan', 'Amount', 'Start', 'Expiry', 'Status', 'Notes'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {subs.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700 capitalize">{PLAN_DURATIONS[sub.plan_duration]?.label || sub.plan_duration}</td>
                        <td className="px-4 py-3 text-slate-600">₹{parseFloat(sub.amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(sub.start_date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(sub.expiry_date).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3"><StatusBadge status={sub.expiry_date < today ? 'expired' : sub.status} /></td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{sub.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Payments Tab ──────────────────────────────────── */}
        {tab === 'payments' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {payments.length === 0 ? (
              <p className="text-center text-slate-400 py-12 text-sm">No payment records.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Date', 'Amount', 'Plan', 'Transaction ID', 'Notes'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(p.payment_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{PLAN_DURATIONS[p.plan_duration]?.label || p.plan_duration || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.transaction_id || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showAddStore && (
        <AddStoreModal businessId={id} onClose={() => setShowAddStore(false)} onSuccess={data => {
          setStores(prev => [...prev, data]);
          setShowAddStore(false);
        }} />
      )}

      {showExtend && (
        <ExtendSubModal
          businessId={id}
          storeCount={stores.length || 1}
          currentExpiry={currentExpiry}
          onClose={() => setShowExtend(false)}
          onSuccess={() => load()}
        />
      )}
    </AdminLayout>
  );
}
