import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import BrandedQRCard from '../components/branding/BrandedQRCard';
import BusinessAvatar from '../components/branding/BusinessAvatar';
import {
  Download, Settings, Plus,
  Store, CreditCard, Star, AlertTriangle, QrCode,
  BarChart2, ChevronRight, X
} from 'lucide-react';
import Navbar from '../components/Navbar';
import AppFooter from '../components/AppFooter';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
  const cls = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-gray-800">{value ?? 0}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function AddStoreModal({ businessId, onClose, onSuccess }) {
  const [form, setForm] = useState({ store_name: '', city: '', google_review_link: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function generateSlug(name, city) {
    const base = `${name}-${city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { data, error: err } = await supabase.from('stores').insert({
      ...form,
      business_id: businessId,
      slug: generateSlug(form.store_name, form.city),
      status: 'active',
    }).select().single();
    if (err) { setError(err.message); setSaving(false); return; }
    onSuccess(data);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 text-lg">Add Store Location</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 rounded-lg p-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
            <input required value={form.store_name} onChange={e => setForm(p => ({ ...p, store_name: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Main Branch" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
            <input required value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Mumbai" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Review Link</label>
            <input value={form.google_review_link} onChange={e => setForm(p => ({ ...p, google_review_link: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://g.page/r/..." />
          </div>
          <p className="text-xs text-gray-400">A permanent QR code URL will be created. The same QR works even after subscription renewal.</p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 rounded-xl text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Adding…' : 'Add Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StoreCard({ store, business, canDownload }) {
  const qrRef = useRef(null);
  const qrUrl = `${window.location.origin}/r/${store.slug}`;

  async function downloadQR() {
    if (!qrRef.current || !canDownload) return;
    await qrRef.current.exportPng(`qr-${store.slug}.png`);
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 ${store.status !== 'active' ? 'border-amber-200 opacity-80' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{store.store_name}</p>
          <p className="text-xs text-gray-400">{store.city}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          store.status === 'active' ? 'bg-green-100 text-green-700' :
          store.status === 'expired' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
        }`}>{store.status}</span>
      </div>
      <div className="flex justify-center bg-gray-50 rounded-xl p-3 mb-3">
        <BrandedQRCard
          ref={qrRef}
          value={qrUrl}
          businessName={business?.name || store.store_name}
          logoUrl={business?.business_logo_url}
          qrSize={120}
          compact
          showSubtitle={false}
        />
      </div>
      <button
        type="button"
        onClick={downloadQR}
        disabled={!canDownload}
        title={canDownload ? 'Download QR code' : 'Activate your subscription to download'}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-xs"
      >
        <Download className="w-3.5 h-3.5" /> Download
      </button>
    </div>
  );
}

/* ── Business detail panel ───────────────────────────────────── */
function BusinessPanel({ business }) {
  const qrRef = useRef(null);
  const [stores, setStores]     = useState([]);
  const [subscription, setSub]  = useState(null);
  const [stats, setStats]       = useState({ scans: 0, reviews: 0 });
  const [loading, setLoading]   = useState(true);
  const [showAddStore, setShowAddStore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const [
      { data: storesData,  error: storesErr  },
      { data: subData,     error: subErr      },
      { count: scanCount,  error: scanErr     },
      { count: reviewCount,error: reviewErr   },
    ] = await Promise.all([
      supabase.from('stores').select('*').eq('business_id', business.id).order('created_at'),
      supabase.from('subscriptions').select('*').eq('business_id', business.id).eq('status', 'active').gte('expiry_date', today).order('expiry_date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('scans').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    ]);
    [storesErr, subErr, scanErr, reviewErr].forEach(e => {
      if (e) console.error('[Dashboard] load:', e.message);
    });
    setStores(storesData || []);
    setSub(subData);
    setStats({ scans: scanCount || 0, reviews: reviewCount || 0 });
    setLoading(false);
  }, [business.id]);

  useEffect(() => { load(); }, [load]);

  const canDownload = !!subscription;

  async function handleDownloadQR() {
    if (!qrRef.current || !canDownload) return;
    const slug = (business.name || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business';
    await qrRef.current.exportPng(`${slug}-qr.png`);
  }

  const reviewUrl = `${window.location.origin}/review/${business.id}`;
  const daysLeft  = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.expiry_date) - new Date()) / 86400000))
    : 0;

  if (loading) return <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {/* Subscription status */}
      {!subscription ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-800 text-sm">QR Not Yet Active</p>
            <p className="text-amber-700 text-xs mt-0.5">Your QR codes won't work until you have an active subscription. Choose a plan and contact the administrator to activate.</p>
          </div>
          <Link to="/pricing"
            className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors whitespace-nowrap">
            View Plans
          </Link>
        </div>
      ) : daysLeft <= 7 ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Subscription Expiring Soon — {daysLeft}d left</p>
            <p className="text-red-700 text-xs mt-0.5">Expires {new Date(subscription.expiry_date).toLocaleDateString('en-IN')}. Contact admin to renew.</p>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 text-sm font-medium">
            Subscription active · expires {new Date(subscription.expiry_date).toLocaleDateString('en-IN')} · {daysLeft}d remaining
          </p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Store}    label="Stores"       value={stores.length}  color="indigo" />
        <StatCard icon={QrCode}   label="QR Codes"     value={stores.length}  color="indigo" />
        <StatCard icon={BarChart2} label="Total Scans" value={stats.scans}    color="green" />
        <StatCard icon={Star}     label="Reviews"      value={stats.reviews}  color="amber" />
      </div>

      {/* Legacy QR */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-gray-800 text-sm">Original Business QR</p>
            <p className="text-xs text-gray-400">For existing printed QR codes</p>
          </div>
          <Link to={`/setup?edit=${business.id}`} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
            <Settings className="w-3 h-3" /> Edit
          </Link>
        </div>
        <div className="flex justify-center mb-3">
          <div className="p-4 bg-white border-2 border-gray-100 rounded-2xl">
            <BrandedQRCard
              ref={qrRef}
              value={reviewUrl}
              businessName={business.name}
              logoUrl={business.business_logo_url}
              qrSize={160}
              showSubtitle={false}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleDownloadQR}
          disabled={!canDownload}
          title={canDownload ? 'Download QR code' : 'Activate your subscription to download'}
          className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white font-semibold py-2.5 rounded-xl hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-xs"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </button>
        {!canDownload && (
          <p className="text-xs text-amber-600 text-center mt-2">
            Subscription required — contact admin or view plans to enable download.
          </p>
        )}
      </div>

      {/* Store locations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-500" />
            <h2 className="font-bold text-gray-800 text-sm">Store Locations <span className="text-gray-400 font-normal">({stores.length})</span></h2>
          </div>
          <button onClick={() => setShowAddStore(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700">
            <Plus className="w-3 h-3" /> Add Store
          </button>
        </div>
        {stores.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center px-6">
            <QrCode className="w-9 h-9 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium text-sm mb-1">No store locations yet</p>
            <p className="text-gray-400 text-xs mb-4">Add stores to get dedicated QR codes with subscription management.</p>
            <button onClick={() => setShowAddStore(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700">
              <Plus className="w-3 h-3" /> Add First Store
            </button>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stores.map(store => (
              <StoreCard key={store.id} store={store} business={business} canDownload={canDownload} />
            ))}
          </div>
        )}
      </div>

      {showAddStore && (
        <AddStoreModal businessId={business.id} onClose={() => setShowAddStore(false)} onSuccess={data => {
          setStores(prev => [...prev, data]);
          setShowAddStore(false);
        }} />
      )}
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────── */
export default function Dashboard() {
  const { user }                   = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);

  // Active business id from URL param, or first business
  const activeBizId = searchParams.get('biz');

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, category, location, google_link, status, business_logo_url')
        .eq('user_id', user.id)
        .order('created_at');
      if (error) {
        console.error('[Dashboard] businesses load:', error.message);
        // Don't fall through to empty state — keep loading true so we don't
        // incorrectly redirect to /onboarding on a transient failure.
        setLoading(false);
        return;
      }
      setBusinesses(data || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const activeBusiness = businesses.find(b => b.id === activeBizId) || businesses[0] || null;

  function selectBusiness(id) {
    setSearchParams(id ? { biz: id } : {});
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <LoadingSpinner fullScreen message="Loading your dashboard…" />
    </div>
  );

  // New user with no businesses → send to guided onboarding
  if (!loading && businesses.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">My Businesses</h1>
            <p className="text-gray-400 text-sm mt-0.5">{businesses.length} business{businesses.length !== 1 ? 'es' : ''}</p>
          </div>
          <Link to="/setup"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-sm">
            <Plus className="w-4 h-4" /> Add Business
          </Link>
        </div>

        {businesses.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Business selector sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <p className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-50">Select Business</p>
                <div className="divide-y divide-gray-50">
                  {businesses.map(biz => (
                    <button
                      key={biz.id}
                      onClick={() => selectBusiness(biz.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activeBusiness?.id === biz.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <BusinessAvatar
                        name={biz.name}
                        logoUrl={biz.business_logo_url}
                        size={36}
                        className={activeBusiness?.id === biz.id ? 'ring-2 ring-indigo-400' : ''}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${activeBusiness?.id === biz.id ? 'text-indigo-700' : 'text-gray-800'}`}>{biz.name}</p>
                        <p className="text-xs text-gray-400 truncate">{biz.category}</p>
                      </div>
                      {activeBusiness?.id === biz.id && <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-50">
                  <Link to="/setup" className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add another business
                  </Link>
                </div>
              </div>
            </div>

            {/* Business detail */}
            <div className="flex-1 min-w-0">
              {activeBusiness ? (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <BusinessAvatar
                      name={activeBusiness.name}
                      logoUrl={activeBusiness.business_logo_url}
                      size={48}
                      className="shadow-md flex-shrink-0"
                    />
                    <div>
                      <h2 className="text-xl font-extrabold text-gray-900">{activeBusiness.name}</h2>
                      <p className="text-gray-400 text-sm">{activeBusiness.category} · {activeBusiness.location}</p>
                    </div>
                  </div>
                  <BusinessPanel key={activeBusiness.id} business={activeBusiness} />
                </>
              ) : null}
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-8">
          Print or display your QR codes anywhere customers can see them — receipts, tables, windows, or counters.
        </p>
      </div>
      <AppFooter />
    </div>
  );
}
