import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Package, ShoppingCart, BarChart3,
  Settings, Search, Bell, ChevronLeft,
  Sparkles, Command, Store, Menu
} from 'lucide-react';
import Logo from '../../components/Logo';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Vendors', icon: Users, path: '/dashboard/vendors' },
  { label: 'Products', icon: Package, path: '/dashboard/products' },
  { label: 'Orders', icon: ShoppingCart, path: '/dashboard/orders' },
  { label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
  { label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  { label: 'Shopify', icon: Store, path: '/dashboard/shopify' },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* ─── SIDEBAR ─── */}
      <aside className={`hidden md:flex flex-col border-r border-white/[0.06] bg-zinc-950 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-60'
      }`}>
        {/* Logo */}
        <div className={`h-16 flex items-center border-b border-white/[0.06] ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
          {collapsed
            ? <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                <Store size={18} className="text-white" />
              </div>
            : <Logo size="small" />}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} className={active ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* AI Assistant card */}
        {!collapsed && (
          <div className="mx-3 mb-3 p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-violet-400" />
              <span className="text-sm font-semibold text-zinc-200">AI Assistant</span>
            </div>
            <p className="text-xs text-zinc-400 mb-3">Get AI-powered insights and recommendations.</p>
            <button className="w-full py-2 text-xs font-medium text-white rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-400 hover:to-blue-400 transition-all">
              Ask SyncFlow AI
            </button>
          </div>
        )}

        {/* Collapse button */}
        <div className="border-t border-white/[0.06] p-3">
          <button onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all w-full ${collapsed ? 'justify-center' : ''}`}>
            <ChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* ─── MAIN AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-zinc-400">
              <Menu size={20} />
            </button>
            <button onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg border border-white/[0.06] bg-zinc-900/50 text-sm text-zinc-500 hover:border-white/[0.1] transition-colors">
              <Search size={15} />
              <span className="hidden sm:inline">Search everything...</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] text-zinc-600 bg-zinc-800 rounded border border-white/[0.06]">⌘K</kbd>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-white/[0.06]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-zinc-200">{user?.name || 'User'}</div>
                <div className="text-[11px] text-zinc-500">{user?.role?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Member'}</div>
              </div>
              <button onClick={logout} className="ml-2 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs">Sign out</button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* ─── MOBILE SIDEBAR OVERLAY ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-60 bg-zinc-950 border-r border-white/[0.06] md:hidden flex flex-col"
            >
              <div className="h-16 flex items-center px-5 border-b border-white/[0.06]">
                <Logo size="small" />
              </div>
              <nav className="flex-1 py-4 px-3 space-y-1">
                {navItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-400 hover:text-zinc-200'
                      }`}>
                      <item.icon size={20} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── COMMAND PALETTE ─── */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed z-50 top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg"
            >
              <div className="mx-4 rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                  <Search size={18} className="text-zinc-500" />
                  <input autoFocus placeholder="Search vendors, orders, products..."
                    className="flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600" />
                  <kbd className="px-1.5 py-0.5 text-[10px] text-zinc-600 bg-zinc-800 rounded border border-white/[0.06]">ESC</kbd>
                </div>
                <div className="p-2 max-h-80 overflow-y-auto">
                  {['Dashboard', 'View Vendors', 'Recent Orders', 'Product Sync', 'Analytics', 'Settings'].map((item, i) => (
                    <button key={i} onClick={() => setSearchOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 transition-colors text-left">
                      <Command size={14} className="text-zinc-600" />
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
