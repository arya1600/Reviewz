import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Star, Check, Minus, Plus, Zap, QrCode, BarChart2,
  MessageSquare, Smartphone, Store, Shield, ArrowRight,
  ChevronDown, ChevronUp, Phone
} from 'lucide-react';
import LandingNav from '../components/LandingNav';
import AppFooter from '../components/AppFooter';
import { useAuth } from '../contexts/AuthContext';

import { BASE_RATE, DURATIONS, BULK_TIERS, getBulkTier, calcPrice } from '../utils/pricing';

const fmt = n => n.toLocaleString('en-IN');

/* ── Animated number ─────────────────────────────────────────── */
function AnimatedNumber({ value, prefix = '', suffix = '', className = '' }) {
  const [display, setDisplay] = useState(value);
  const [fading, setFading]   = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    setFading(true);
    const t = setTimeout(() => { setDisplay(value); setFading(false); prev.current = value; }, 120);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span className={`inline-block transition-all duration-150 ${fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${className}`}>
      {prefix}{typeof display === 'number' ? fmt(display) : display}{suffix}
    </span>
  );
}

/* ── Features list ───────────────────────────────────────────── */
const FEATURES = [
  { icon: QrCode,       text: 'Unique QR code per store' },
  { icon: Zap,          text: 'AI-powered review suggestions' },
  { icon: Star,         text: 'Humanized review generation' },
  { icon: ArrowRight,   text: 'Google Review redirect flow' },
  { icon: MessageSquare,text: 'Customer feedback collection' },
  { icon: BarChart2,    text: 'Review analytics dashboard' },
  { icon: Store,        text: 'Multi-store management' },
  { icon: Smartphone,   text: 'Mobile-friendly QR landing page' },
  { icon: Shield,       text: 'QR auto-activation on renewal' },
  { icon: Check,        text: 'Free trial — no credit card needed' },
];

/* ── FAQ ─────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Does the same QR code work after I renew?',
    a: 'Yes, absolutely. Your QR code URL never changes. When your subscription expires the QR shows an expiry message, and the moment you renew it becomes active again automatically — no reprinting needed.',
  },
  {
    q: 'Can I add more stores later?',
    a: 'Yes. You can add stores to your account at any time. Each store gets its own unique QR code and analytics.',
  },
  {
    q: 'What happens when my trial ends?',
    a: 'After your 14-day trial ends, your QR code will pause until you activate a paid plan. Contact us or upgrade from your dashboard to continue.',
  },
  {
    q: 'Can one account manage multiple businesses?',
    a: 'Yes. One account can manage multiple businesses and each business can have multiple store locations — all under one dashboard.',
  },
  {
    q: 'Is there a setup fee?',
    a: 'No setup fee ever. You only pay the subscription amount shown above.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="font-semibold text-slate-800 text-sm">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>
      {open && <p className="text-slate-500 text-sm pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function PricingPage() {
  const { user }                    = useAuth();
  const navigate                    = useNavigate();
  const [stores, setStores]         = useState(1);
  const [duration, setDuration]     = useState('12months');
  const pricing                     = calcPrice(stores, duration);
  const tier                        = getBulkTier(stores);
  const dur                         = DURATIONS.find(d => d.key === duration);
  const isContactSales              = stores >= 25;

  function changeStores(delta) {
    setStores(s => Math.max(1, s + delta));
  }

  function handleCTA() {
    if (user) navigate('/dashboard');
    else navigate('/signin');
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="pt-16 pb-8 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-indigo-100">
          <Star className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
          14-day free trial · No credit card required
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-3">
          Simple pricing for<br className="hidden sm:block" /> every business
        </h1>
        <p className="text-slate-500 text-lg max-w-md mx-auto">
          Grow your Google reviews with AI-powered QR codes.
          One plan, all features, priced by store.
        </p>
      </section>

      {/* ── Calculator ──────────────────────────────────────── */}
      <section className="px-4 pb-16 max-w-2xl mx-auto">

        {/* Store selector */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">How many store locations?</p>
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => changeStores(-1)} disabled={stores <= 1}
              className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 text-center">
              <p className="text-4xl font-extrabold text-slate-900 leading-none">
                <AnimatedNumber value={stores >= 25 ? '25+' : stores} />
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {stores === 1 ? 'Store location' : 'Store locations'}
                {tier.discount > 0 && (
                  <span className="ml-1.5 text-green-600 font-semibold text-xs">
                    · {Math.round(tier.discount * 100)}% bulk discount
                  </span>
                )}
              </p>
            </div>

            <button onClick={() => changeStores(1)}
              className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Store tier indicator */}
          <div className="mt-4 flex gap-1.5">
            {BULK_TIERS.filter(t => t.discount !== null).map(t => (
              <div key={t.min}
                className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
                  stores >= t.min && stores <= t.max ? 'bg-indigo-500' :
                  stores > t.max ? 'bg-indigo-300' : 'bg-slate-200'
                }`} />
            ))}
            <div className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${stores >= 25 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-slate-400">1</span>
            <span className="text-xs text-slate-400">5 stores</span>
            <span className="text-xs text-slate-400">10 stores</span>
            <span className="text-xs text-slate-400">25+</span>
          </div>
        </div>

        {/* Duration tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-4 bg-slate-100 p-1.5 rounded-2xl">
          {DURATIONS.map(d => (
            <button key={d.key} onClick={() => setDuration(d.key)}
              className={`relative py-3 px-1 rounded-xl text-xs font-bold transition-all duration-200 ${
                duration === d.key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}>
              {d.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  BEST VALUE
                </span>
              )}
              <span className="block sm:hidden">{d.shortLabel}</span>
              <span className="hidden sm:block">{d.label}</span>
              {d.badge && duration !== d.key && (
                <span className="block text-[9px] text-green-600 font-semibold mt-0.5">{d.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Price card */}
        <div className={`rounded-3xl border-2 p-6 sm:p-8 transition-all duration-300 ${
          isContactSales
            ? 'bg-slate-50 border-slate-200'
            : 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-600'
        }`}>

          {isContactSales ? (
            /* Contact Sales state */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Custom Enterprise Pricing</h3>
              <p className="text-slate-500 text-sm mb-6">
                For 25+ store locations, we offer custom pricing, dedicated support, and white-label options.
              </p>
              <a href="mailto:hello@reviewboost.ai"
                className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors">
                Contact Sales <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <>
              {/* Main price display */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-end gap-1">
                    <span className="text-white/80 text-2xl font-bold mb-1">₹</span>
                    <AnimatedNumber
                      value={pricing.perMonth}
                      className="text-white text-6xl sm:text-7xl font-extrabold leading-none tracking-tight"
                    />
                  </div>
                  <p className="text-indigo-200 text-sm mt-1.5">per month · {stores} store{stores > 1 ? 's' : ''}</p>
                  {dur.months > 1 && (
                    <p className="text-indigo-300 text-xs mt-0.5">
                      Billed as <AnimatedNumber value={pricing.total} prefix="₹" /> / {dur.months} months
                    </p>
                  )}
                </div>

                {/* Savings badge */}
                {pricing.savings > 0 && (
                  <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-3 text-center border border-white/20 flex-shrink-0">
                    <p className="text-white/80 text-xs font-medium">You save</p>
                    <p className="text-white text-xl font-extrabold">
                      <AnimatedNumber value={pricing.savings} prefix="₹" />
                    </p>
                    <p className="text-white/70 text-xs">vs monthly</p>
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="bg-white/10 rounded-2xl p-4 mb-5 space-y-2 border border-white/10">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">Price breakdown</p>

                <div className="flex justify-between text-sm">
                  <span className="text-indigo-200">
                    ₹{BASE_RATE} × {stores} stores × {dur.months} month{dur.months > 1 ? 's' : ''}
                  </span>
                  <span className="text-white font-semibold">₹{fmt(pricing.base)}</span>
                </div>

                {pricing.bulkAmt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-300">Bulk discount ({Math.round(pricing.bulkDiscount * 100)}%)</span>
                    <span className="text-green-300 font-semibold">−₹{fmt(pricing.bulkAmt)}</span>
                  </div>
                )}

                {pricing.durationAmt > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-300">{dur.label} discount ({Math.round(pricing.durationDiscount * 100)}%)</span>
                    <span className="text-green-300 font-semibold">−₹{fmt(pricing.durationAmt)}</span>
                  </div>
                )}

                <div className="border-t border-white/20 pt-2 mt-1 flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-white font-bold text-lg">₹{fmt(pricing.total)}</span>
                </div>

                <p className="text-indigo-300 text-xs text-right">
                  = ₹{fmt(pricing.perStorePerMonth)}/store/month effective
                </p>
              </div>

              {/* CTA */}
              <button onClick={handleCTA}
                className="w-full flex items-center justify-center gap-2 bg-white text-indigo-700 font-extrabold py-4 rounded-2xl hover:bg-indigo-50 transition-all text-base shadow-lg shadow-indigo-900/20">
                Start Growing Reviews
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-indigo-300 text-xs mt-2.5">
                14-day free trial · No credit card required
              </p>
            </>
          )}
        </div>

        {/* Per-store rate callout */}
        {!isContactSales && (
          <p className="text-center text-slate-400 text-sm mt-4">
            Starting at <span className="font-semibold text-slate-600">₹99/store/month</span>
            {tier.discount > 0 && <> · Your bulk rate: <span className="font-semibold text-green-600">₹{fmt(pricing.perStorePerMonth)}/store/month</span></>}
          </p>
        )}
      </section>

      {/* ── Features grid ───────────────────────────────────── */}
      <section className="bg-slate-50 border-t border-slate-100 py-14 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Every plan includes</p>
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-8">
            Everything you need to collect reviews
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-100 shadow-sm">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof strip ──────────────────────────────── */}
      <section className="py-10 px-4 border-t border-slate-100">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { stat: '10x',    label: 'More reviews vs manual ask' },
            { stat: '< 30s',  label: 'Setup time per store' },
            { stat: '₹0',     label: 'To start your trial' },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <p className="text-3xl font-extrabold text-indigo-600">{stat}</p>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-t border-slate-100 py-14 px-4">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 text-center mb-8">Frequently asked questions</h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5">
            {FAQS.map(f => <FAQItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────────── */}
      <section className="py-14 px-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
          Ready to grow your reviews?
        </h2>
        <p className="text-slate-500 mb-6">Start your free 14-day trial. No credit card needed.</p>
        <button onClick={handleCTA}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl transition-colors shadow-md shadow-indigo-200 text-base">
          Start Free Trial <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* ── Sticky mobile CTA ───────────────────────────────── */}
      {!isContactSales && pricing && (
        <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-slate-200 p-3 shadow-2xl z-40">
          <button onClick={handleCTA}
            className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3.5 rounded-xl transition-colors">
            <div className="text-left">
              <p className="text-sm font-extrabold">₹{fmt(pricing.perMonth)}/month</p>
              <p className="text-indigo-300 text-xs">{stores} store{stores > 1 ? 's' : ''} · {dur.label}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Bottom padding for mobile sticky CTA */}
      <div className="sm:hidden h-20" />

      <AppFooter />
    </div>
  );
}
