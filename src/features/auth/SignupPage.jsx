import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Building2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import Logo from '../../components/Logo';
import { useAuthStore } from '../../store/authStore';

export default function SignupPage() {
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('marketplace_owner');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { register, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await register(form.name, form.email, form.password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const roles = [
    { id: 'marketplace_owner', label: 'Marketplace Owner', desc: 'I run a Shopify store & want vendors', icon: Building2 },
    { id: 'vendor', label: 'Vendor', desc: "I want to sell on someone's marketplace", icon: User },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[100px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-md px-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-white/10 bg-white/5 text-sm text-zinc-400">
            <Sparkles size={14} className="text-blue-400" />
            Free 14-day trial
          </div>
          <h2 className="text-4xl font-bold leading-tight">
            Start building your <span className="gradient-ai-text">AI-powered</span> marketplace
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed">
            Set up in under 5 minutes. No credit card required. Full access to all features.
          </p>

          {/* Feature list */}
          <div className="mt-10 space-y-4 text-left">
            {[
              'Connect your Shopify store in one click',
              'AI-powered vendor & order management',
              'Real-time inventory synchronization',
              'Beautiful analytics dashboard',
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 text-sm text-zinc-300"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Signup form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-zinc-950 lg:bg-zinc-900/30">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <Link to="/" className="inline-block mb-8"><Logo /></Link>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="mt-2 text-sm text-zinc-400">Start your 14-day free trial</p>
          </div>

          {/* OAuth */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-zinc-800/50 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-zinc-800/50 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors">
              <svg className="w-4 h-4 text-[#95BF47]" viewBox="0 0 24 24" fill="currentColor"><path d="M15.34 3.03c-.12-.9-.84-1.35-.91-1.35s-1.69.36-1.69.36-.89-.87-1.12-1.08a.85.85 0 00-.6-.3h-.07L9.55 3.6s-2.37.06-2.46.06-.77.09-1.19 1.27L4 11.15s-.09.3.08.49.43.2.43.2l2.14.59 4.47 1.23-.02.11c0 .05-1.57 10.08-1.57 10.08a.64.64 0 00.33.68c.15.07.36.07.49-.04 0 0 6.39-4.25 6.39-4.25a.83.83 0 00.37-.51l2.13-15.29c.01-.07-.04-.18-.16-.26a3.42 3.42 0 00-1.28-.49l-2.03-.36z"/></svg>
              Shopify
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-zinc-500">or with email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {roles.map(r => (
              <button key={r.id} type="button" onClick={() => setRole(r.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                  role === r.id
                    ? 'border-blue-500/50 bg-blue-500/5 shadow-md shadow-blue-500/5'
                    : 'border-white/[0.06] bg-zinc-900/30 hover:border-white/[0.1]'
                }`}>
                <r.icon size={18} className={role === r.id ? 'text-blue-400' : 'text-zinc-500'} />
                <div className="mt-2 text-sm font-medium text-zinc-200">{r.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe" className="input-field pl-8" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com" className="input-field pl-8" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters" className="input-field pl-8 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input type="checkbox" id="terms" className="mt-1 rounded border-zinc-700 bg-zinc-800" />
              <label htmlFor="terms" className="text-xs text-zinc-400 leading-relaxed">
                I agree to the <a href="#" className="text-blue-400 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button type="submit"
              className="w-full py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
              Create Account
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
