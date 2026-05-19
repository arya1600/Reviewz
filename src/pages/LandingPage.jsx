import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, ArrowRight, CheckCircle, QrCode, Zap, Shield,
  BarChart2, ChevronDown, ChevronUp, MessageSquare,
  Smartphone, RefreshCw, TrendingUp, Store
} from 'lucide-react';
import LandingNav from '../components/LandingNav';

/* ── Product mockup — phone frame with QR flow ───────────────── */
function PhoneMockup() {
  const [screen, setScreen] = useState('qr'); // 'qr' | 'stars' | 'review'

  return (
    <div className="relative flex flex-col items-center">
      {/* Step tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'qr',     label: 'QR Scan' },
          { key: 'stars',  label: 'Star Rating' },
          { key: 'review', label: 'AI Review' },
        ].map((s, i) => (
          <button key={s.key} onClick={() => setScreen(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              screen === s.key ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300'
            }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${screen === s.key ? 'bg-white/20' : 'bg-slate-100'}`}>{i+1}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="relative w-56 bg-slate-900 rounded-[2.5rem] p-2 shadow-2xl shadow-slate-900/40">
        {/* Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 rounded-full z-10" />
        <div className="bg-white rounded-[2rem] overflow-hidden h-[460px] relative">

          {/* ── Screen: QR Scan ── */}
          {screen === 'qr' && (
            <div className="h-full flex flex-col bg-gradient-to-br from-indigo-50 to-white p-5 pt-10">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-indigo-200">
                  <span className="text-white font-extrabold text-lg">Z</span>
                </div>
                <p className="font-bold text-slate-800 text-sm">Zari Boutique</p>
                <p className="text-slate-400 text-xs">Kolhapur</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-100">
                  {/* Fake QR code using CSS grid */}
                  <div className="w-28 h-28 grid grid-cols-7 gap-0.5 p-1">
                    {Array.from({ length: 49 }).map((_, i) => {
                      const corners = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48];
                      const inner = [8,9,10,15,16,17,22,23,24];
                      return (
                        <div key={i} className={`rounded-[1px] ${
                          corners.includes(i) ? 'bg-slate-800' :
                          inner.includes(i) ? 'bg-indigo-600' :
                          [11,18,25,31,36,37,38,30,12,19,26,32,33,39,40,29].includes(i) ? 'bg-slate-700' :
                          'bg-white'
                        }`} />
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center">Scan to leave a review</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-1 text-[10px] text-slate-300">
                  <Star className="w-3 h-3 fill-slate-300 text-slate-300" />
                  Powered by Reviewz
                </div>
              </div>
            </div>
          )}

          {/* ── Screen: Star rating ── */}
          {screen === 'stars' && (
            <div className="h-full flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-5 pt-10">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-md shadow-indigo-200">
                  <span className="text-white font-extrabold text-lg">Z</span>
                </div>
                <p className="font-bold text-slate-800 text-sm">Zari Boutique</p>
                <p className="text-slate-400 text-xs">Kolhapur</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-slate-700 font-semibold text-sm mb-4 text-center">How was your experience?</p>
                <div className="flex gap-1.5 mb-6">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-8 h-8 ${s <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <button className="bg-indigo-600 text-white text-xs font-bold px-6 py-2.5 rounded-xl w-full shadow-sm shadow-indigo-200">
                  Continue →
                </button>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-1 text-[10px] text-slate-300">
                  <Star className="w-3 h-3 fill-slate-300 text-slate-300" />
                  Powered by Reviewz
                </div>
              </div>
            </div>
          )}

          {/* ── Screen: AI Review ── */}
          {screen === 'review' && (
            <div className="h-full flex flex-col bg-gradient-to-br from-indigo-50 to-purple-50 p-4 pt-8">
              <div className="text-center mb-3">
                <div className="flex justify-center gap-0.5 mb-1">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="font-bold text-slate-800 text-xs">Choose your review</p>
                <p className="text-slate-400 text-[10px]">Tap to copy & post on Google</p>
              </div>
              <div className="flex-1 space-y-2 overflow-hidden">
                {[
                  "Amazing experience at Zari Boutique! The saree collection is stunning and Priya helped me find the perfect one for my wedding. Worth every visit!",
                  "Visited for my wedding shopping — couldn't be happier. Beautiful fabrics, great prices. Will definitely return next time!",
                ].map((review, i) => (
                  <div key={i} className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-sm">
                    <p className="text-[9px] text-slate-600 leading-relaxed line-clamp-3">{review}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[9px] text-slate-400">Review {i+1}</span>
                      <span className="text-[9px] text-indigo-600 font-semibold">Copy & Post →</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-2">
                <div className="inline-flex items-center gap-1 text-[10px] text-slate-300">
                  <Star className="w-3 h-3 fill-slate-300 text-slate-300" />
                  Powered by Reviewz
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-advance hint */}
      <p className="text-xs text-slate-400 mt-4">
        ← Tap to explore the flow
      </p>
    </div>
  );
}

/* ── FAQ ─────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Will my QR code stop working if my subscription expires?',
    a: 'When your subscription expires, the QR URL shows a friendly "Subscription Expired" message instead of the review flow. The moment you renew, the exact same QR code becomes active again — automatically, with zero reprinting.',
  },
  {
    q: 'Do I need to print a new QR code after renewal?',
    a: 'Never. Your QR code URL is permanent and never changes. Expiry and reactivation happen on the server side. The printed QR on your counter works forever.',
  },
  {
    q: 'Can one account manage multiple businesses or stores?',
    a: 'Yes. One login can manage multiple businesses, and each business can have unlimited store locations. Each store gets its own unique QR code and separate analytics.',
  },
  {
    q: 'What do unhappy customers see?',
    a: 'Customers who give 1–3 stars are quietly routed to a private feedback form instead of Google. This protects your public rating while still capturing constructive feedback.',
  },
  {
    q: 'Do the AI-generated reviews look real?',
    a: 'Yes. Reviews are generated using the specific details you provide — your staff names, products, atmosphere, and customer types. Every review is different and reads like a genuine customer wrote it.',
  },
  {
    q: 'How long does setup take?',
    a: 'Under 2 minutes. Enter your business name, location, Google review link, and add one store — your QR code is ready to download and print.',
  },
  {
    q: 'How do I get started?',
    a: 'Choose a plan, complete signup, and contact us to activate your subscription. Once active, your QR codes work immediately — plans start at ₹99/store/month.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border transition-all duration-200 ${open ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100 bg-white'}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left">
        <span className={`font-semibold text-sm leading-snug transition-colors ${open ? 'text-indigo-700' : 'text-slate-800'}`}>{q}</span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${open ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>
      {open && (
        <p className="px-5 pb-5 text-slate-600 text-sm leading-relaxed">{a}</p>
      )}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <LandingNav showAnchors />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-60 -z-10" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-40 -z-10" />

        <div className="max-w-4xl mx-auto">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-full text-sm font-medium text-slate-600 mb-6">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
            </div>
            Trusted by growing businesses across India
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            Get <span className="text-indigo-600">10x more</span><br />
            Google reviews<br />
            <span className="text-slate-400">with one QR code</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            Customers scan → rate → our AI writes a real Google review for them.
            Businesses using Reviewz collect reviews 10x faster than asking manually.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link to="/signin"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-8 py-4 rounded-2xl text-base transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200 hover:-translate-y-0.5">
              Get started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-indigo-300 text-slate-700 font-semibold px-8 py-4 rounded-2xl text-base transition-all hover:text-indigo-600">
              See pricing →
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-5 text-sm text-slate-500">
            {['Plans from ₹99/store/month', 'Setup in under 2 minutes', 'QR code never changes', 'Subscription activation by admin'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product demo ────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-slate-50" id="demo">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Phone mockup */}
            <div className="flex-shrink-0 order-2 lg:order-1">
              <PhoneMockup />
            </div>

            {/* Description */}
            <div className="flex-1 order-1 lg:order-2">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">The complete review flow</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                From QR scan to<br />Google review in 30 seconds
              </h2>

              <div className="space-y-5">
                {[
                  {
                    n: '01',
                    title: 'Customer scans your QR',
                    desc: 'Display the QR on your counter, receipt, or table. One scan opens the review page instantly — no app download needed.',
                    color: 'bg-indigo-100 text-indigo-700',
                  },
                  {
                    n: '02',
                    title: 'They tap their star rating',
                    desc: '4–5 stars → goes to Google review flow. 1–3 stars → private feedback form (protects your public rating).',
                    color: 'bg-amber-100 text-amber-700',
                  },
                  {
                    n: '03',
                    title: 'AI writes 3 real reviews',
                    desc: 'Our AI generates 3 human-sounding review options, tailored to your specific business, staff, and atmosphere.',
                    color: 'bg-green-100 text-green-700',
                  },
                  {
                    n: '04',
                    title: 'One tap posts it on Google',
                    desc: 'Customer taps "Copy & Post" — review is copied and Google Maps opens. They just paste and submit.',
                    color: 'bg-purple-100 text-purple-700',
                  },
                ].map(step => (
                  <div key={step.n} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5 ${step.color}`}>
                      {step.n}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{step.title}</p>
                      <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof numbers ─────────────────────────────── */}
      <section className="py-14 px-4 bg-indigo-600">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { stat: '10x',   label: 'More reviews vs manual ask' },
            { stat: '< 30s', label: 'Time to post a review' },
            { stat: '100%',  label: 'Same QR after renewal' },
            { stat: '₹99',   label: 'Per store per month' },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{stat}</p>
              <p className="text-indigo-200 text-sm mt-1 leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Get started</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Up and running in 2 minutes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Store,
                step: '1',
                title: 'Add your business',
                desc: 'Enter your business name, category, location, and paste your Google review link.',
                color: 'bg-indigo-50 text-indigo-600',
              },
              {
                icon: QrCode,
                step: '2',
                title: 'Get your QR code',
                desc: 'Download your permanent QR code. Print it and place it wherever customers can see it.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: TrendingUp,
                step: '3',
                title: 'Reviews start flowing',
                desc: 'Customers scan, AI writes, reviews go to Google. Watch your rating climb from your dashboard.',
                color: 'bg-green-50 text-green-600',
              },
            ].map(({ icon: Icon, step, title, desc, color }) => (
              <div key={step} className="relative bg-slate-50 rounded-3xl p-7 border border-slate-100">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="absolute top-5 right-5 text-5xl font-extrabold text-slate-100 select-none">{step}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Everything included in every plan</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: QrCode,        title: 'Permanent QR Codes',          desc: 'One URL forever — survives subscription changes, renewals, and plan upgrades.' },
              { icon: Zap,           title: 'AI Review Generation',         desc: 'Humanized reviews tailored to your specific business, staff, and vibe.' },
              { icon: Shield,        title: 'Reputation Protection',        desc: 'Unhappy customers go to private feedback, not Google. Your rating stays clean.' },
              { icon: BarChart2,     title: 'Analytics Dashboard',          desc: 'Track scans, reviews sent, ratings, and feedback per store — all in one place.' },
              { icon: Store,         title: 'Multi-store Management',       desc: 'One account, multiple businesses, unlimited store locations with separate QRs.' },
              { icon: Smartphone,    title: 'Mobile-first Landing Page',    desc: 'Customers land on a fast, beautiful page optimised for every phone.' },
              { icon: RefreshCw,     title: 'Auto QR Reactivation',         desc: 'Renew your plan and the same QR code wakes up instantly — no reprinting.' },
              { icon: MessageSquare, title: 'Private Feedback Collection',  desc: 'Capture constructive criticism privately so you can act on it before it goes public.' },
              { icon: TrendingUp,    title: 'Review Trend Tracking',        desc: 'See which stores are performing, which need attention, and how ratings trend over time.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            One simple price per store
          </h2>
          <p className="text-slate-500 text-lg mb-8">
            Starting at <span className="font-bold text-slate-800">₹99/store/month.</span> Save up to 25% on annual plans.
            Multi-store bulk discounts built in.
          </p>
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-3xl p-8 text-white mb-6 shadow-xl shadow-indigo-200">
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-2xl font-bold text-indigo-200 mb-2">₹</span>
              <span className="text-7xl font-extrabold leading-none">99</span>
              <span className="text-indigo-300 text-lg mb-2">/store/month</span>
            </div>
            <p className="text-indigo-300 text-sm mb-6">Unique QR · AI Reviews · Analytics · Everything included</p>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-extrabold px-6 py-3 rounded-2xl hover:bg-indigo-50 transition-colors">
              See all plans & discounts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-slate-400 text-sm">Plans from ₹99/store/month · Setup in 2 minutes</p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-3xl font-extrabold text-slate-900">Questions we get a lot</h2>
          </div>
          <div className="space-y-2.5">
            {FAQS.map(f => <FAQItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="py-24 px-4 text-center relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50 to-white -z-10" />
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-0.5 mb-4">
            {[1,2,3,4,5].map(s => <Star key={s} className="w-6 h-6 fill-amber-400 text-amber-400" />)}
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 leading-tight">
            Your next 50 Google reviews<br />
            are waiting
          </h2>
          <p className="text-slate-500 text-lg mb-8">
            Choose a plan, activate your subscription, and start collecting more Google reviews.
          </p>
          <Link to="/signin"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-10 py-5 rounded-2xl text-lg transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-200 hover:-translate-y-0.5">
            Get started
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-slate-400 text-sm mt-4">Plans from ₹99/store/month · Setup in 2 minutes</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-white">Reviewz</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link to="/signin" className="hover:text-white transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Reviewz</p>
        </div>
      </footer>
    </div>
  );
}
