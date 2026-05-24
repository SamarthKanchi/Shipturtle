import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import Logo from '../../components/Logo';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-[100px]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative z-10 max-w-md px-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full border border-white/10 bg-white/5 text-sm text-zinc-400">
            <Sparkles size={14} className="text-violet-400" />
            AI-Powered Platform
          </div>
          <h2 className="text-4xl font-bold leading-tight">
            Automate your <span className="gradient-brand-text">marketplace</span> with intelligence
          </h2>
          <p className="mt-4 text-zinc-400 leading-relaxed">
            Join 2,400+ merchants using SyncFlow AI to sync vendors, route orders, and predict inventory.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-3">
            {[
              { label: 'Time Saved', value: '15h/week' },
              { label: 'Sync Accuracy', value: '99.7%' },
              { label: 'Vendors Active', value: '12,400+' },
              { label: 'Orders Routed', value: '2.4M' },
            ].map((stat, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]"
              >
                <div className="text-xs text-zinc-500">{stat.label}</div>
                <div className="mt-1 text-lg font-bold gradient-brand-text">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-zinc-950 lg:bg-zinc-900/30">
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <Link to="/" className="inline-block mb-8"><Logo /></Link>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="mt-2 text-sm text-zinc-400">Sign in to your SyncFlow AI account</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div className="space-y-3 mb-6">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-zinc-800/50 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-zinc-500">or continue with email</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required
                className="input-field w-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-zinc-300">Password</label>
                <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Forgot?</a>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="input-field w-full pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
