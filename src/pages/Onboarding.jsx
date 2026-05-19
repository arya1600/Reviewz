/**
 * Onboarding — guided setup for new business owners
 *
 * Step 1: Full business details (basic info + AI-enhancement fields)
 * Step 2: Add first store → permanent QR slug
 * Step 3: QR code ready → download & go to dashboard
 *
 * Resumable: if user refreshes mid-flow, we detect where they left off.
 * Subscriptions are activated by admin after payment.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCode } from 'react-qr-code';
import {
  Star, Building2, MapPin, Link as LinkIcon, Tag,
  Check, ArrowRight, Loader2, CheckCircle,
  Sparkles, QrCode, ShoppingBag, Heart, Users, Smile, Sliders,
  MessageSquare,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';

const CATEGORIES = [
  'Restaurant', 'Cafe', 'Bakery', 'Bar', 'Retail Store', 'Boutique',
  'Hair Salon', 'Barber', 'Beauty Spa', 'Gym / Fitness',
  'Hotel', 'Dental Clinic', 'Pharmacy', 'Auto Service',
  'Clothing Store', 'Cosmetics / Beauty', 'Electronics', 'Jewellery',
  'Home Decor', 'Bookstore', 'Toy Store', 'Pet Store', 'Other',
];

const VIBE_OPTIONS = [
  'Cozy', 'Modern', 'Family-friendly', 'Romantic', 'Lively',
  'Luxury', 'Casual', 'Professional', 'Quirky', 'Traditional',
];

const TONE_OPTIONS = [
  { value: 'casual',       label: 'Casual & Friendly',  desc: '"Loved this place, will def be back!"' },
  { value: 'enthusiastic', label: 'Enthusiastic',        desc: '"Absolutely amazing experience!!"' },
  { value: 'neutral',      label: 'Honest & Balanced',   desc: '"Good overall, a few things could improve."' },
  { value: 'professional', label: 'Polished',            desc: '"The staff demonstrated excellent knowledge."' },
];

const LENGTH_OPTIONS = [
  { value: 'short',  label: 'Short',  desc: '20–30 words' },
  { value: 'medium', label: 'Medium', desc: '30–45 words' },
  { value: 'long',   label: 'Long',   desc: '45–60 words' },
];

function generateSlug(name, city) {
  const base = `${name}-${city}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ── Progress bar ────────────────────────────────────────────── */
function StepBar({ current }) {
  const steps = [
    { n: 1, label: 'Business info' },
    { n: 2, label: 'Add store' },
    { n: 3, label: 'Get QR code' },
  ];
  return (
    <div className="flex items-start justify-center gap-0 mb-8 select-none">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-start">
          <div className="flex flex-col items-center w-24">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              s.n < current   ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' :
              s.n === current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md shadow-indigo-200' :
              'bg-slate-100 text-slate-400'
            }`}>
              {s.n < current ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span className={`text-xs mt-1.5 font-medium text-center leading-tight ${
              s.n === current ? 'text-indigo-600' : s.n < current ? 'text-slate-500' : 'text-slate-300'
            }`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 mt-4 flex-shrink-0 transition-all duration-300 ${s.n < current ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Shared field wrappers ───────────────────────────────────── */
function SectionTitle({ title, badge }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
      <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">{title}</h3>
      {badge && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
    </div>
  );
}

function Field({ label, icon, hint, error, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
        {icon && <span className="w-4 h-4 text-indigo-500 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>}
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {hint && !error && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full border rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all ${err ? 'border-red-400 bg-red-50' : 'border-slate-200'}`;

/* ── Step 1 — Full business details ──────────────────────────── */
const EMPTY_FORM = {
  name: '', category: '', location: '', google_link: '',
  description: '', highlights: '', vibe: [],
  products: '', staffNames: '', customerTypes: '',
  complimentedFeatures: '', tone: 'casual', reviewLength: 'medium',
};

function Step1({ user, onDone }) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(key, val) {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  }

  function toggleVibe(v) {
    setForm(p => ({ ...p, vibe: p.vibe.includes(v) ? p.vibe.filter(x => x !== v) : [...p.vibe, v] }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())        e.name        = 'Business name is required';
    if (!form.category)           e.category    = 'Please select a category';
    if (!form.location.trim())    e.location    = 'City / location is required';
    if (!form.google_link.trim()) e.google_link = 'Google review link is required';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);

    try {
      const { data: biz, error: bizErr } = await supabase
        .from('businesses')
        .insert({
          user_id:               user.id,
          name:                  form.name.trim(),
          category:              form.category,
          location:              form.location.trim(),
          google_link:           form.google_link.trim(),
          description:           form.description.trim(),
          highlights:            form.highlights.trim(),
          vibe:                  form.vibe,
          products:              form.products.trim(),
          staff_names:           form.staffNames.trim(),
          customer_types:        form.customerTypes.trim(),
          complimented_features: form.complimentedFeatures.trim(),
          tone_preference:       form.tone,
          review_length:         form.reviewLength,
          status:                'active',
          onboarding_complete:   false,
        })
        .select()
        .single();

      if (bizErr) throw bizErr;
      onDone({ business: biz });
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">

      {/* ── Basic info ───────────────────────────────────────── */}
      <div>
        <SectionTitle title="Basic information" />
        <div className="space-y-4">
          <Field label="Business name" icon={<Building2 />} error={errors.name}>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Zari Boutique" className={inputCls(errors.name)} />
          </Field>

          <Field label="Category" icon={<Tag />} error={errors.category}>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls(errors.category)}>
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="City / Location" icon={<MapPin />} error={errors.location} hint="e.g. Bandra, Mumbai">
            <input value={form.location} onChange={e => set('location', e.target.value)}
              placeholder="e.g. Kolhapur, Maharashtra" className={inputCls(errors.location)} />
          </Field>

          <Field label="Google Review Link" icon={<LinkIcon />} error={errors.google_link} hint="Google Maps → Share → Copy link">
            <input value={form.google_link} onChange={e => set('google_link', e.target.value)}
              placeholder="https://g.page/r/…" className={inputCls(errors.google_link)} />
          </Field>
        </div>
      </div>

      {/* ── AI enhancement ───────────────────────────────────── */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <p className="text-sm font-semibold text-indigo-700">AI review personalisation</p>
        </div>
        <p className="text-xs text-indigo-500">The more details you add, the more human and specific your AI-generated reviews will sound. All optional.</p>
      </div>

      {/* What you sell */}
      <div>
        <SectionTitle title="What you sell" badge="Boosts review specificity" />
        <div className="space-y-4">
          <Field label="Products / Services" icon={<ShoppingBag />}
            hint="Comma-separated. e.g. sarees, kurtis, lehengas, bridal wear">
            <input value={form.products} onChange={e => set('products', e.target.value)}
              placeholder="e.g. sarees, kurtis, lehengas, bridal wear" className={inputCls(false)} />
          </Field>

          <Field label="Most complimented features" icon={<Heart />}
            hint="What do customers praise most? e.g. fabric quality, price range, packaging">
            <input value={form.complimentedFeatures} onChange={e => set('complimentedFeatures', e.target.value)}
              placeholder="e.g. fabric quality, variety, easy exchange policy" className={inputCls(false)} />
          </Field>
        </div>
      </div>

      {/* Your team */}
      <div>
        <SectionTitle title="Your team" badge="Makes reviews feel personal" />
        <div className="space-y-4">
          <Field label="Staff names" icon={<Users />}
            hint="First names only, comma-separated. Naturally mentioned in reviews.">
            <input value={form.staffNames} onChange={e => set('staffNames', e.target.value)}
              placeholder="e.g. Priya, Rohan, Meena" className={inputCls(false)} />
          </Field>

          <Field label="Common customer types" icon={<Smile />}
            hint="Who usually shops here? e.g. brides, college students, families">
            <input value={form.customerTypes} onChange={e => set('customerTypes', e.target.value)}
              placeholder="e.g. brides, families, college girls, working women" className={inputCls(false)} />
          </Field>
        </div>
      </div>

      {/* Store ambience */}
      <div>
        <SectionTitle title="Store ambience" badge="Sets review tone" />
        <div className="space-y-4">
          <Field label="What makes you special?" icon={<MessageSquare />}
            hint="Your story, USP, years open. 2–3 sentences.">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="e.g. Family-run boutique in Bandra since 2012. Known for hand-picked ethnic wear and helping brides find their perfect look without pressure."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm" />
          </Field>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
              <span className="w-4 h-4 text-indigo-500"><Sparkles className="w-4 h-4" /></span>
              Atmosphere
            </label>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map(v => (
                <button key={v} type="button" onClick={() => toggleVibe(v)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    form.vibe.includes(v)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review preferences */}
      <div>
        <SectionTitle title="Review preferences" badge="Controls output style" />
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
              <Sliders className="w-4 h-4 text-indigo-500" /> Tone preference
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TONE_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, tone: opt.value }))}
                  className={`text-left p-3 rounded-xl border text-sm transition-colors ${
                    form.tone === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                  }`}>
                  <span className="font-semibold block">{opt.label}</span>
                  <span className="text-xs opacity-70 mt-0.5 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Review length</label>
            <div className="flex gap-2">
              {LENGTH_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, reviewLength: opt.value }))}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                    form.reviewLength === opt.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
                  }`}>
                  {opt.label}
                  <span className="block text-xs opacity-60 font-normal">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {errors.submit && (
        <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{errors.submit}</p>
      )}

      <button type="submit" disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm shadow-indigo-200">
        {saving
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting up…</>
          : <>Continue <ArrowRight className="w-5 h-5" /></>}
      </button>
    </form>
  );
}

/* ── Step 2 — Add first store ────────────────────────────────── */
function Step2({ business, onDone }) {
  const [form, setForm] = useState({
    store_name:         '',
    city:               business.location || '',
    google_review_link: business.google_link || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.store_name.trim()) errs.store_name = 'Store name is required';
    if (!form.city.trim())       errs.city       = 'City is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);

    try {
      const slug = generateSlug(form.store_name, form.city);
      const { data: store, error: storeErr } = await supabase
        .from('stores')
        .insert({
          business_id:        business.id,
          store_name:         form.store_name.trim(),
          city:               form.city.trim(),
          slug,
          google_review_link: form.google_review_link.trim(),
          status:             'active',
        })
        .select()
        .single();

      if (storeErr) throw storeErr;

      await supabase.from('businesses').update({ onboarding_complete: true }).eq('id', business.id);

      onDone({ store });
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  }

  const ic = (err) => `w-full border rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all ${err ? 'border-red-400 bg-red-50' : 'border-slate-200'}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 flex items-start gap-3">
        <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-700">
          Adding first location for <strong>{business.name}</strong>. You can add more stores from your dashboard later.
        </p>
      </div>

      <Field label="Store / Branch Name" error={errors.store_name} hint='e.g. "Main Branch", "Kolhapur Store", "Ground Floor"'>
        <input value={form.store_name}
          onChange={e => { setForm(p => ({ ...p, store_name: e.target.value })); setErrors(p => ({ ...p, store_name: '' })); }}
          placeholder="Main Branch" className={ic(errors.store_name)} />
      </Field>

      <Field label="City" error={errors.city}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={form.city}
            onChange={e => { setForm(p => ({ ...p, city: e.target.value })); setErrors(p => ({ ...p, city: '' })); }}
            placeholder="Mumbai" className={`${ic(errors.city)} pl-9`} />
        </div>
      </Field>

      <Field label="Google Review Link" hint="Leave as-is to use your business's link, or enter a store-specific one">
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={form.google_review_link}
            onChange={e => setForm(p => ({ ...p, google_review_link: e.target.value }))}
            placeholder="https://g.page/r/…" className={`${ic(false)} pl-9`} />
        </div>
      </Field>

      <div className="bg-slate-50 rounded-xl p-3.5 flex items-start gap-2.5">
        <QrCode className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          A <strong>permanent QR code URL</strong> will be created for this store. It never changes — even after subscription renewal or plan upgrades.
        </p>
      </div>

      {errors.submit && (
        <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{errors.submit}</p>
      )}

      <button type="submit" disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm shadow-indigo-200">
        {saving
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating store…</>
          : <>Generate my QR code <ArrowRight className="w-5 h-5" /></>}
      </button>
    </form>
  );
}

/* ── Step 3 — QR Preview (locked until subscription active) ─────── */
function Step3({ store }) {
  const navigate = useNavigate();
  const qrUrl    = `${window.location.origin}/r/${store.slug}`;

  return (
    <div className="text-center">
      {/* Header */}
      <div className="mb-5">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Business created!</h3>
        <p className="text-slate-500 text-sm mt-1">Here's a preview of your QR code.</p>
      </div>

      {/* QR — locked preview */}
      <div className="relative inline-block mb-3">
        <div className="bg-slate-50 rounded-2xl p-5">
          <div className="relative">
            <div className="bg-white rounded-xl shadow-sm p-4 inline-block">
              {/* Blurred / faded QR */}
              <div className="opacity-30 blur-[2px] select-none pointer-events-none">
                <QRCode id="onboarding-qr" value={qrUrl} size={160} />
              </div>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center shadow-lg mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded-full shadow">
                Not yet active
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium mt-3">{store.store_name} · {store.city}</p>
        </div>
      </div>

      {/* Activation notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-left">
        <p className="text-sm font-semibold text-amber-800 mb-1">Activate to enable your QR</p>
        <p className="text-xs text-amber-700">
          Your QR code is created but <strong>not yet active</strong>. Customers who scan it will see an "inactive" message until you have an active subscription. Contact the administrator to choose a plan and activate your QR.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 mb-4">
        <button
          onClick={() => navigate('/pricing')}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
          View Plans
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 font-semibold py-3 rounded-xl transition-colors text-sm">
          Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Once activated, your QR works permanently — it never changes even after subscription renewal.
      </p>
    </div>
  );
}

/* ── Main Onboarding component ───────────────────────────────── */
export default function Onboarding() {
  const { user }    = useAuth();
  const { isAdmin } = useAdmin();
  const navigate    = useNavigate();
  const [step, setStep]         = useState(null);
  const [business, setBusiness] = useState(null);
  const [store, setStore]       = useState(null);

  // Admins have their own portal
  useEffect(() => {
    if (isAdmin) navigate('/admin/dashboard', { replace: true });
  }, [isAdmin, navigate]);

  // Resume detection
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function detect() {
      try {
        const { data: businesses, error: bizErr } = await supabase
          .from('businesses')
          .select('id, name, category, location, google_link, onboarding_complete')
          .eq('user_id', user.id)
          .order('created_at')
          .limit(1);

        if (cancelled) return;
        if (bizErr) throw bizErr;

        const biz = businesses?.[0];

        if (biz?.onboarding_complete) {
          navigate('/dashboard', { replace: true });
          return;
        }

        if (biz) {
          setBusiness(biz);

          const { data: stores, error: storesErr } = await supabase
            .from('stores').select('*').eq('business_id', biz.id).limit(1);

          if (cancelled) return;
          if (storesErr) throw storesErr;

          if (stores?.[0]) {
            await supabase.from('businesses').update({ onboarding_complete: true }).eq('id', biz.id);
            if (!cancelled) navigate('/dashboard', { replace: true });
            return;
          }

          if (!cancelled) setStep(2);
        } else {
          if (!cancelled) setStep(1);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[Onboarding] detect failed:', err.message);
          setStep(1);
        }
      }
    }

    detect();
    return () => { cancelled = true; };
  }, [user, navigate]);

  const stepTitles = {
    1: { title: 'Set up your business',    sub: 'Tell us about your business. The more detail you add, the better your AI reviews.' },
    2: { title: 'Add your first location', sub: 'Each location gets its own permanent QR code.' },
    3: { title: 'Your QR code is ready',   sub: '' },
  };

  if (step === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex flex-col items-center justify-center p-4 py-12">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-200">
          <Star className="w-5 h-5 text-white fill-white" />
        </div>
        <span className="font-bold text-xl text-slate-800">Reviewz</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
        <StepBar current={step} />

        {step !== 3 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">{stepTitles[step]?.title}</h2>
            {stepTitles[step]?.sub && (
              <p className="text-slate-500 text-sm mt-1">{stepTitles[step].sub}</p>
            )}
          </div>
        )}

        {step === 1 && (
          <Step1
            user={user}
            onDone={({ business: biz }) => { setBusiness(biz); setStep(2); }}
          />
        )}

        {step === 2 && business && (
          <Step2
            business={business}
            onDone={({ store: s }) => { setStore(s); setStep(3); }}
          />
        )}

        {step === 3 && store && (
          <Step3 store={store} />
        )}
      </div>

      <p className="text-slate-400 text-xs mt-6 text-center">
        Already set up?{' '}
        <button onClick={() => navigate('/dashboard')} className="text-indigo-500 hover:underline">
          Go to dashboard
        </button>
      </p>
    </div>
  );
}
