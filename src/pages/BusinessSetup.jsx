import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2, MapPin, Link as LinkIcon, Tag, ArrowRight, Loader2,
  Sparkles, Heart, MessageSquare, ShoppingBag, Users, Smile, Sliders,
  ArrowLeft,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import LogoUpload from '../components/branding/LogoUpload';
import { uploadBusinessLogo } from '../lib/logoStorage';

const categories = [
  'Restaurant', 'Cafe', 'Bakery', 'Bar', 'Retail Store', 'Boutique',
  'Hair Salon', 'Barber', 'Beauty Spa', 'Gym / Fitness',
  'Hotel', 'Dental Clinic', 'Pharmacy', 'Auto Service',
  'Clothing Store', 'Cosmetics / Beauty', 'Electronics', 'Jewellery',
  'Home Decor', 'Bookstore', 'Toy Store', 'Pet Store', 'Other',
];

const vibeOptions = [
  'Cozy', 'Modern', 'Family-friendly', 'Romantic', 'Lively',
  'Luxury', 'Casual', 'Professional', 'Quirky', 'Traditional',
];

const toneOptions = [
  { value: 'casual',        label: 'Casual & Friendly',   desc: '"Loved this place, will def be back!"' },
  { value: 'enthusiastic',  label: 'Enthusiastic',         desc: '"Absolutely amazing experience!!"' },
  { value: 'neutral',       label: 'Honest & Balanced',    desc: '"Good overall, a few things could improve."' },
  { value: 'professional',  label: 'Polished',             desc: '"The staff demonstrated excellent knowledge."' },
];

const lengthOptions = [
  { value: 'short',  label: 'Short',  desc: '20–30 words' },
  { value: 'medium', label: 'Medium', desc: '30–45 words' },
  { value: 'long',   label: 'Long',   desc: '45–60 words' },
];

const EMPTY_FORM = {
  name: '', category: '', location: '', googleLink: '',
  description: '', highlights: '', vibe: [],
  products: '', staffNames: '', customerTypes: '',
  complimentedFeatures: '', tone: 'casual', reviewLength: 'medium',
};

export default function BusinessSetup() {
  const navigate                       = useNavigate();
  const { user }                       = useAuth();
  const [searchParams]                 = useSearchParams();
  const editId                         = searchParams.get('edit'); // present when editing existing
  const [form, setForm]                = useState(EMPTY_FORM);
  const [errors, setErrors]            = useState({});
  const [loading, setLoading]          = useState(!!editId); // only load if editing
  const [saving, setSaving]            = useState(false);
  const [existingId, setExistingId]    = useState(editId || null);
  const [logoUrl, setLogoUrl]          = useState(null);
  const [pendingLogoBlob, setPendingLogoBlob] = useState(null);

  function handleLogoChange(url) {
    if (logoUrl?.startsWith('blob:') && url !== logoUrl) URL.revokeObjectURL(logoUrl);
    setLogoUrl(url);
  }

  function handlePendingLogo(blob) {
    setPendingLogoBlob(blob);
  }

  useEffect(() => {
    // If no editId, this is a fresh "Add Business" — skip loading
    if (!editId || !user) { setLoading(false); return; }

    async function loadExisting() {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', editId)
        .eq('user_id', user.id)   // ensure user owns this business
        .maybeSingle();

      if (data) {
        setExistingId(data.id);
        setForm({
          name:               data.name,
          category:           data.category,
          location:           data.location,
          googleLink:         data.google_link,
          description:        data.description           ?? '',
          highlights:         data.highlights            ?? '',
          vibe:               data.vibe                  ?? [],
          products:           data.products              ?? '',
          staffNames:         data.staff_names           ?? '',
          customerTypes:      data.customer_types        ?? '',
          complimentedFeatures: data.complimented_features ?? '',
          tone:               data.tone_preference       ?? 'casual',
          reviewLength:       data.review_length         ?? 'medium',
        });
        setLogoUrl(data.business_logo_url ?? null);
      }
      setLoading(false);
    }
    loadExisting();
  }, [editId, user]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  }

  function toggleVibe(v) {
    setForm(prev => ({
      ...prev,
      vibe: prev.vibe.includes(v) ? prev.vibe.filter(x => x !== v) : [...prev.vibe, v],
    }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim())       errs.name       = 'Business name is required.';
    if (!form.category)          errs.category   = 'Please select a category.';
    if (!form.location.trim())   errs.location   = 'Location is required.';
    if (!form.googleLink.trim()) errs.googleLink = 'Google review link is required.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);

    const payload = {
      user_id:               user.id,
      name:                  form.name.trim(),
      category:              form.category,
      location:              form.location.trim(),
      google_link:           form.googleLink.trim(),
      description:           form.description.trim(),
      highlights:            form.highlights.trim(),
      vibe:                  form.vibe,
      products:              form.products.trim(),
      staff_names:           form.staffNames.trim(),
      customer_types:        form.customerTypes.trim(),
      complimented_features: form.complimentedFeatures.trim(),
      tone_preference:       form.tone,
      review_length:         form.reviewLength,
    };

    let dbError;
    let savedId = existingId;
    if (existingId) {
      ({ error: dbError } = await supabase.from('businesses').update(payload).eq('id', existingId));
    } else {
      const { data: created, error } = await supabase.from('businesses').insert(payload).select('id').single();
      dbError = error;
      savedId = created?.id ?? null;
    }

    if (dbError) {
      setSaving(false);
      setErrors({ submit: dbError.message });
      return;
    }

    if (pendingLogoBlob && savedId) {
      try {
        const url = await uploadBusinessLogo(savedId, pendingLogoBlob);
        if (logoUrl?.startsWith('blob:')) URL.revokeObjectURL(logoUrl);
        setLogoUrl(url);
        setPendingLogoBlob(null);
      } catch (err) {
        setSaving(false);
        setErrors({ submit: `Business saved, but logo upload failed: ${err.message}` });
        setExistingId(savedId);
        navigate(`/setup?edit=${savedId}`, { replace: true });
        return;
      }
    }

    setSaving(false);

    if (!existingId && savedId) {
      setExistingId(savedId);
      navigate(`/setup?edit=${savedId}`, { replace: true });
      return;
    }
    navigate('/dashboard');
  }

  const inputClass = (field) =>
    `w-full border rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm ${errors[field] ? 'border-red-400' : 'border-gray-200'}`;

  if (loading) return <><Navbar /><LoadingSpinner fullScreen message="Loading business…" /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Back link */}
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">
            {existingId ? 'Edit business' : 'Add a new business'}
          </h1>
          <p className="text-gray-500 mt-2">
            The more detail you add, the more human your AI reviews will sound.
          </p>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── 1. Basic info ──────────────────────────────────────── */}
            <Section title="Basic information">
              <Field label="Business name" icon={<Building2 />} error={errors.name}>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. Priya's Boutique" className={inputClass('name')} />
              </Field>

              <Field label="Category" icon={<Tag />} error={errors.category}>
                <select name="category" value={form.category} onChange={handleChange} className={inputClass('category')}>
                  <option value="">Select a category…</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="City / Location" icon={<MapPin />} error={errors.location}>
                <input name="location" value={form.location} onChange={handleChange}
                  placeholder="e.g. Bandra, Mumbai" className={inputClass('location')} />
              </Field>

              <Field label="Google review link" icon={<LinkIcon />} error={errors.googleLink}
                hint="Google Maps → Share → Copy link">
                <input name="googleLink" value={form.googleLink} onChange={handleChange}
                  placeholder="https://g.page/r/…" className={inputClass('googleLink')} />
              </Field>
            </Section>

            {/* ── Business branding ─────────────────────────────────── */}
            <Section title="Business branding" badge="QR & review pages">
              <LogoUpload
                businessId={existingId}
                businessName={form.name}
                logoUrl={logoUrl}
                onLogoChange={handleLogoChange}
                onPendingLogoChange={handlePendingLogo}
                previewQrValue={
                  existingId
                    ? `${window.location.origin}/review/${existingId}`
                    : null
                }
              />
            </Section>

            {/* ── 2. What you sell ───────────────────────────────────── */}
            <Section title="What you sell" badge="Boosts review specificity">
              <Field label="Products / Services" icon={<ShoppingBag />}
                hint="Comma-separated. e.g. sarees, kurtis, lehengas, indo-western fusion">
                <input name="products" value={form.products} onChange={handleChange}
                  placeholder="e.g. sarees, kurtis, lehengas, bridal wear"
                  className={inputClass('products')} />
              </Field>

              <Field label="Most complimented features" icon={<Heart />}
                hint="What do customers praise most? e.g. fabric quality, fitting, price range, packaging">
                <input name="complimentedFeatures" value={form.complimentedFeatures} onChange={handleChange}
                  placeholder="e.g. fabric quality, variety, easy exchange policy"
                  className={inputClass('complimentedFeatures')} />
              </Field>
            </Section>

            {/* ── 3. Your team ───────────────────────────────────────── */}
            <Section title="Your team" badge="Makes reviews feel personal">
              <Field label="Staff names" icon={<Users />}
                hint="First names only, comma-separated. These get naturally mentioned in reviews.">
                <input name="staffNames" value={form.staffNames} onChange={handleChange}
                  placeholder="e.g. Priya, Rohan, Meena"
                  className={inputClass('staffNames')} />
              </Field>

              <Field label="Common customer types" icon={<Smile />}
                hint="Who usually shops here? e.g. brides, college students, working women, families">
                <input name="customerTypes" value={form.customerTypes} onChange={handleChange}
                  placeholder="e.g. brides, families, college girls, working women"
                  className={inputClass('customerTypes')} />
              </Field>
            </Section>

            {/* ── 4. Store vibe ──────────────────────────────────────── */}
            <Section title="Store ambience" badge="Sets review tone">
              <Field label="What makes you special?" icon={<Sparkles />}
                hint="Your story, USP, years open. 2–3 sentences.">
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={3} placeholder="e.g. Family-run boutique in Bandra since 2012. Known for our hand-picked ethnic wear and helping brides find their perfect look without pressure."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm" />
              </Field>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-500" /> Atmosphere
                </label>
                <div className="flex flex-wrap gap-2">
                  {vibeOptions.map(v => (
                    <button key={v} type="button" onClick={() => toggleVibe(v)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        form.vibe.includes(v)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* ── 5. Review preferences ──────────────────────────────── */}
            <Section title="Review preferences" badge="Controls output style">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-500" /> Tone preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {toneOptions.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(prev => ({ ...prev, tone: opt.value }))}
                      className={`text-left p-3 rounded-xl border text-sm transition-colors ${
                        form.tone === opt.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                      }`}>
                      <span className="font-semibold block">{opt.label}</span>
                      <span className="text-xs opacity-70 mt-0.5 block">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review length</label>
                <div className="flex gap-2">
                  {lengthOptions.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(prev => ({ ...prev, reviewLength: opt.value }))}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                        form.reviewLength === opt.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                      }`}>
                      {opt.label}
                      <span className="block text-xs opacity-60 font-normal">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {errors.submit && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{errors.submit}</p>
            )}

            <button type="submit" disabled={saving}
              className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {saving
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
                : <>{existingId ? 'Save changes' : 'Save business'} <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

function Section({ title, badge, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <h2 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">{title}</h2>
        {badge && (
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">{badge}</span>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, icon, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
        <span className="w-4 h-4 text-indigo-500 [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {hint && !error && <p className="text-gray-400 text-xs mt-1">{hint}</p>}
    </div>
  );
}
