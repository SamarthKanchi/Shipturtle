import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Zap, ArrowRight, Check, Star, ChevronDown, Menu, X,
  BarChart3, ShoppingCart, Users, Bot, Package, Globe,
  Shield, Clock, TrendingUp, Layers, RefreshCw, MessageSquare,
  Sparkles, ArrowUpRight, Play
} from 'lucide-react';
import Logo from '../../components/Logo';

/* ─── ANIMATION VARIANTS ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } }
};

/* ─── NAVBAR ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Pricing', 'Integrations', 'Docs'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="text-sm text-zinc-400 hover:text-white transition-colors duration-200">
              {item}
            </a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login"
            className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors">
            Log in
          </Link>
          <Link to="/signup"
            className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
            Start Free Trial
          </Link>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-zinc-400">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass border-t border-white/5 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {['Features', 'Pricing', 'Integrations', 'Docs'].map(i => (
                <a key={i} href={`#${i.toLowerCase()}`} className="text-sm text-zinc-400 py-2">{i}</a>
              ))}
              <Link to="/login" className="text-sm text-zinc-300 py-2">Log in</Link>
              <Link to="/signup" className="mt-2 px-4 py-2.5 text-sm font-medium text-center text-white rounded-lg bg-gradient-to-r from-blue-500 to-violet-500">
                Start Free Trial
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ─── HERO ─── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 dot-grid opacity-40" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center">
          {/* Badge */}
          <motion.div variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-white/10 bg-white/[0.03] text-sm text-zinc-400">
            <Sparkles size={14} className="text-violet-400" />
            <span>AI-Powered Marketplace Automation</span>
            <ArrowRight size={14} />
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl">
            The Smartest Way to
            <br />
            <span className="gradient-brand-text">Run Your Marketplace</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={fadeUp} custom={2}
            className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed">
            Sync vendors, automate orders, predict inventory — all powered by AI.
            Built for Shopify merchants who want to scale without the chaos.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link to="/signup"
              className="group px-8 py-3.5 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center gap-2">
              Start Free — No Card Needed
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="group px-8 py-3.5 text-base font-medium text-zinc-300 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/[0.03] transition-all flex items-center gap-2">
              <Play size={18} className="text-blue-400" />
              Watch Demo
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp} custom={4} className="mt-12 flex items-center gap-6 text-sm text-zinc-500">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-[10px] font-semibold text-zinc-300">
                  {['JD', 'KL', 'MR', 'AS', 'TP'][i]}
                </div>
              ))}
            </div>
            <span>Trusted by <span className="text-zinc-300 font-medium">2,400+</span> marketplace owners</span>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div variants={fadeUp} custom={5}
            className="mt-16 w-full max-w-5xl relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-50" />
            <div className="relative rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
              {/* Mock dashboard */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 text-center text-xs text-zinc-500">SyncFlow AI — Dashboard</div>
              </div>
              <div className="p-6 grid grid-cols-4 gap-4">
                {[
                  { label: 'Revenue', value: '$84,230', change: '+12.5%', color: 'text-emerald-400' },
                  { label: 'Orders', value: '1,847', change: '+8.3%', color: 'text-emerald-400' },
                  { label: 'Vendors', value: '142', change: '+3', color: 'text-blue-400' },
                  { label: 'Fulfillment', value: '97.2%', change: '+1.1%', color: 'text-emerald-400' },
                ].map((stat, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 + i * 0.15 }}
                    className="rounded-lg bg-zinc-800/50 border border-white/5 p-4"
                  >
                    <div className="text-xs text-zinc-500">{stat.label}</div>
                    <div className="mt-1 text-xl font-bold">{stat.value}</div>
                    <div className={`mt-1 text-xs ${stat.color}`}>{stat.change}</div>
                  </motion.div>
                ))}
              </div>
              {/* Chart placeholder */}
              <div className="px-6 pb-6">
                <div className="h-40 rounded-lg bg-zinc-800/30 border border-white/5 flex items-end justify-around p-4 gap-2">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                    <motion.div key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 1.5 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                      className="flex-1 rounded-t bg-gradient-to-t from-blue-500/60 to-violet-500/60"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FEATURES ─── */
const features = [
  { icon: RefreshCw, title: 'Real-Time Sync', desc: 'Inventory, products, and orders sync across all stores instantly. Zero lag, zero conflicts.', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: Bot, title: 'AI Automation', desc: 'AI predicts demand, categorizes products, detects fraud, and optimizes order routing.', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { icon: ShoppingCart, title: 'Smart Order Routing', desc: 'Orders auto-route to the best vendor based on proximity, stock, and cost.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Users, title: 'Vendor Portal', desc: 'Full self-service portal for vendors to manage products, orders, and earnings.', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Revenue charts, geo heatmaps, vendor performance, and AI forecasting.', color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { icon: Shield, title: 'Enterprise Security', desc: 'JWT auth, role-based access, audit logs, rate limiting, and encrypted data.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

function Features() {
  return (
    <section id="features" className="py-32 relative">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-16">
          <motion.span variants={fadeUp} className="text-sm font-medium text-blue-400 tracking-wide uppercase">Features</motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
            Everything you need to <span className="gradient-brand-text">scale</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-zinc-400 max-w-xl mx-auto text-lg">
            From inventory sync to AI insights — one platform, zero complexity.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className="group p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
              <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon size={22} className={f.color} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── INTEGRATIONS ─── */
function Integrations() {
  const integrations = ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento', 'OpenAI', 'Stripe', 'FedEx', 'DHL'];
  return (
    <section id="integrations" className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.span variants={fadeUp} className="text-sm font-medium text-violet-400 tracking-wide uppercase">Integrations</motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 text-4xl font-bold">
            Connects with your <span className="gradient-ai-text">entire stack</span>
          </motion.h2>
          <motion.div variants={fadeUp} className="mt-12 flex flex-wrap justify-center gap-4">
            {integrations.map((name, i) => (
              <motion.div key={name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className="px-6 py-3 rounded-xl border border-white/[0.06] bg-zinc-900/50 text-sm font-medium text-zinc-300 hover:border-white/[0.12] hover:bg-zinc-800/50 transition-all cursor-default"
              >
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-zinc-500" />
                  {name}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── PRICING ─── */
const plans = [
  {
    name: 'Starter', price: 49, desc: 'For small marketplaces getting started.',
    features: ['5 Vendors', '500 Products', 'Basic inventory sync', 'Email support', 'Standard analytics'],
    cta: 'Start Free Trial', popular: false,
  },
  {
    name: 'Growth', price: 149, desc: 'For growing marketplaces that need AI.',
    features: ['25 Vendors', '5,000 Products', 'AI-powered insights', 'Priority support', 'Multi-store sync', 'Advanced analytics', 'Real-time chat'],
    cta: 'Start Free Trial', popular: true,
  },
  {
    name: 'Enterprise', price: 499, desc: 'For large-scale operations.',
    features: ['Unlimited vendors', 'Unlimited products', 'Full AI suite', 'Dedicated CSM', 'Custom integrations', 'SLA guarantee', 'Audit logs', 'White-label'],
    cta: 'Contact Sales', popular: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-32 relative">
      <div className="absolute inset-0 gradient-mesh" />
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
          <motion.span variants={fadeUp} className="text-sm font-medium text-emerald-400 tracking-wide uppercase">Pricing</motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 text-4xl sm:text-5xl font-bold">
            Simple, transparent <span className="gradient-brand-text">pricing</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-zinc-400 max-w-xl mx-auto text-lg">
            Start free, upgrade when you're ready. No hidden fees.
          </motion.p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-b from-zinc-800/80 to-zinc-900/80 border border-blue-500/30 shadow-xl shadow-blue-500/5 scale-[1.02]'
                  : 'bg-zinc-900/50 border border-white/[0.06] hover:border-white/[0.12]'
              }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-blue-500 to-violet-500">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="mt-2 text-sm text-zinc-400">{plan.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-zinc-500">/mo</span>
              </div>
              <Link to="/signup"
                className={`mt-8 block w-full py-3 text-center text-sm font-semibold rounded-xl transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
                    : 'bg-zinc-800 text-zinc-200 border border-white/[0.08] hover:bg-zinc-700'
                }`}>
                {plan.cta}
              </Link>
              <ul className="mt-8 space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-zinc-300">
                    <Check size={16} className={plan.popular ? 'text-blue-400' : 'text-zinc-500'} />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ─── */
const testimonials = [
  { name: 'Sarah Chen', role: 'CEO, MarketHub', text: 'SyncFlow AI cut our manual work by 80%. The AI-powered order routing alone saved us 15 hours a week.', avatar: 'SC' },
  { name: 'James Rodriguez', role: 'Founder, StyleDrop', text: "The dashboard is beautiful — it's like having Stripe analytics for your marketplace. Our vendors love the portal.", avatar: 'JR' },
  { name: 'Priya Patel', role: 'COO, GreenMart', text: 'We migrated from Shipturtle and never looked back. The inventory forecasting is incredibly accurate.', avatar: 'PP' },
];

function Testimonials() {
  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
          <motion.span variants={fadeUp} className="text-sm font-medium text-amber-400 tracking-wide uppercase">Testimonials</motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 text-4xl font-bold">
            Loved by marketplace <span className="gradient-brand-text">builders</span>
          </motion.h2>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className="p-6 rounded-2xl bg-zinc-900/50 border border-white/[0.06]">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-zinc-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
const faqs = [
  { q: 'How does SyncFlow AI integrate with Shopify?', a: 'We use Shopify\'s official OAuth and GraphQL Admin API. Just click "Connect Store", authorize, and your products, orders, and inventory sync automatically in real-time.' },
  { q: 'Is there a free trial?', a: 'Yes! Every plan starts with a 14-day free trial. No credit card required. You can explore all features before committing.' },
  { q: 'How does the AI order routing work?', a: 'Our AI analyzes vendor proximity, inventory levels, shipping costs, and fulfillment history to automatically route each order to the optimal vendor — or split multi-vendor orders intelligently.' },
  { q: 'Can I migrate from Shipturtle?', a: 'Absolutely. We provide a one-click migration tool that imports your vendors, products, and historical data. Most migrations complete within 24 hours.' },
  { q: 'What kind of support do you offer?', a: 'Starter gets email support, Growth gets priority support with 4-hour response times, and Enterprise gets a dedicated Customer Success Manager plus Slack channel.' },
];

function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
          <motion.span variants={fadeUp} className="text-sm font-medium text-blue-400 tracking-wide uppercase">FAQ</motion.span>
          <motion.h2 variants={fadeUp} className="mt-3 text-4xl font-bold">
            Common <span className="gradient-brand-text">questions</span>
          </motion.h2>
        </motion.div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-white/[0.06] bg-zinc-900/30 overflow-hidden"
            >
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-medium text-zinc-200 hover:text-white transition-colors"
              >
                {faq.q}
                <ChevronDown size={18} className={`text-zinc-500 transition-transform duration-300 ${openIdx === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openIdx === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-4 text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.04] to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/[0.06] blur-[120px]" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-bold tracking-tight">
            Ready to <span className="gradient-brand-text">automate</span> your marketplace?
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-6 text-lg text-zinc-400">
            Join 2,400+ marketplace owners using SyncFlow AI to save time, reduce errors, and grow faster.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup"
              className="group px-8 py-3.5 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2">
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="px-8 py-3.5 text-base font-medium text-zinc-400 hover:text-white transition-colors">
              Sign in →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  const links = {
    Product: ['Features', 'Pricing', 'Integrations', 'Changelog', 'Roadmap'],
    Company: ['About', 'Blog', 'Careers', 'Press'],
    Resources: ['Documentation', 'API Reference', 'Guides', 'Community'],
    Legal: ['Privacy', 'Terms', 'Security'],
  };

  return (
    <footer className="border-t border-white/5 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo size="small" />
            <p className="mt-4 text-sm text-zinc-500 max-w-xs">
              AI-powered marketplace automation for modern Shopify merchants.
            </p>
          </div>
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-sm font-semibold text-zinc-300 mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-zinc-600">© 2026 SyncFlow AI. All rights reserved.</p>
          <div className="flex gap-6">
            {['Twitter', 'GitHub', 'Discord'].map(s => (
              <a key={s} href="#" className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors">{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── LANDING PAGE ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <Hero />
      <Features />
      <Integrations />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
