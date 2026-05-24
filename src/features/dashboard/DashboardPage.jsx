import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useOrderAnalytics, useVendors, useMonthlyAnalytics, useFulfillmentAnalytics, useRecentOrders } from '../../hooks/useApi';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp,
  Truck, Bot, ArrowUpRight, ArrowDownRight, Clock,
  Sparkles, AlertCircle, CheckCircle2, RefreshCw, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

/* ─── STATIC DATA (no backend yet) ─── */
const activities = [
  { icon: CheckCircle2, color: 'text-emerald-400', text: 'Order #SF-4821 fulfilled by TechVault', time: '12m ago' },
  { icon: Users, color: 'text-blue-400', text: 'New vendor "EcoStyle" applied for approval', time: '34m ago' },
  { icon: RefreshCw, color: 'text-violet-400', text: '247 products synced from Shopify store', time: '1h ago' },
  { icon: AlertCircle, color: 'text-amber-400', text: 'Low stock alert: iPhone 15 Case (3 left)', time: '2h ago' },
  { icon: Bot, color: 'text-violet-400', text: 'AI detected potential duplicate product SKU', time: '3h ago' },
  { icon: TrendingUp, color: 'text-emerald-400', text: 'Revenue up 12.5% compared to last week', time: '5h ago' },
];

const aiInsights = [
  { title: 'Restock Alert', desc: '12 products predicted to run out within 7 days. AI recommends placing orders now.', type: 'warning', icon: Package },
  { title: 'Revenue Forecast', desc: 'Projected 18% revenue increase next month based on seasonal trends and current growth.', type: 'success', icon: TrendingUp },
  { title: 'Vendor Performance', desc: 'TechVault has a 99.2% fulfillment rate — consider increasing their product allocation.', type: 'info', icon: Sparkles },
];

/* ─── ANIMATED COUNTER ─── */
function AnimatedCounter({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
    const duration = 1200;
    const steps = 40;
    const increment = num / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) {
        setDisplay(num);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{display.toLocaleString()}{suffix}</span>;
}

/* ─── CUSTOM TOOLTIP ─── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-zinc-800 border border-white/[0.08] px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name === 'revenue' ? `$${(p.value / 1000).toFixed(1)}K` : p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── STATUS BADGE ─── */
function StatusBadge({ status }) {
  const styles = {
    fulfilled: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    partially_fulfilled: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    refunded: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
  return (
    <span className={`px-2 py-0.5 text-[11px] font-medium rounded-md border ${styles[status] || styles.pending}`}>
      {label}
    </span>
  );
}

/* ─── LOADING SKELETON ─── */
function ChartSkeleton({ height = 260 }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <Loader2 size={24} className="animate-spin text-zinc-600" />
    </div>
  );
}

/* ─── MAIN DASHBOARD ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: 'easeOut' }
  }),
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: analytics } = useOrderAnalytics();
  const { data: vendorData } = useVendors({ limit: 1 });
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyAnalytics();
  const { data: fulfillmentData, isLoading: fulfillmentLoading } = useFulfillmentAnalytics();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders(5);

  const totalRevenue = analytics?.revenue?.total || 0;
  const totalOrders = analytics?.revenue?.count || 0;
  const totalVendors = vendorData?.pagination?.total || 0;
  const statusCounts = {};
  analytics?.statusBreakdown?.forEach(s => { statusCounts[s._id] = s.count; });

  const stats = [
    { label: 'Total Revenue', value: totalRevenue, prefix: '$', change: '+12.5%', up: true, icon: DollarSign, color: 'from-emerald-500/20' },
    { label: 'Total Orders', value: totalOrders, change: '+8.3%', up: true, icon: ShoppingCart, color: 'from-blue-500/20' },
    { label: 'Active Vendors', value: totalVendors, change: '+3', up: true, icon: Users, color: 'from-violet-500/20' },
    { label: 'Pending', value: statusCounts['pending'] || 0, change: '', up: false, icon: Truck, color: 'from-amber-500/20' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Welcome back, {user?.name?.split(' ')[0] || 'there'}. Here's what's happening today.</p>
      </motion.div>

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" animate="visible" custom={i}
            className="stat-card group hover:border-white/[0.1] transition-all duration-300"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} to-transparent blur-2xl opacity-60`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-400">{stat.label}</span>
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
                  <stat.icon size={18} className="text-zinc-400" />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight">
                <AnimatedCounter value={stat.value} prefix={stat.prefix || ''} />
              </div>
              <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${stat.up ? 'text-emerald-400' : 'text-amber-400'}`}>
                {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.change} from last period
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── CHARTS ROW ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart — REAL DATA */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
          className="lg:col-span-2 rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold">Revenue Overview</h3>
              <p className="text-sm text-zinc-500 mt-0.5">Monthly revenue for {new Date().getFullYear()}</p>
            </div>
            <div className="flex gap-2">
              {['1M', '3M', '6M', '1Y'].map((p, i) => (
                <button key={p} className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  i === 3 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'
                }`}>{p}</button>
              ))}
            </div>
          </div>
          {monthlyLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v / 1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2}
                  fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Fulfillment Donut — REAL DATA */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}
          className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
          <h3 className="text-base font-semibold mb-1">Fulfillment Rate</h3>
          <p className="text-sm text-zinc-500 mb-4">Current order status breakdown</p>
          {fulfillmentLoading ? <ChartSkeleton height={180} /> : !fulfillmentData?.length ? (
            <div className="flex items-center justify-center h-[180px] text-sm text-zinc-500">No order data yet</div>
          ) : (
            <>
              <div className="flex justify-center">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={fulfillmentData} innerRadius={55} outerRadius={80} paddingAngle={3}
                      dataKey="value" stroke="none">
                      {fulfillmentData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {fulfillmentData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-zinc-400">{d.name}</span>
                    </div>
                    <span className="font-medium">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ─── AI INSIGHTS ─── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}
        className="rounded-2xl bg-gradient-to-br from-violet-500/[0.06] to-blue-500/[0.04] border border-violet-500/[0.12] p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Bot size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold">AI Insights</h3>
            <p className="text-xs text-zinc-500">Powered by SyncFlow AI</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((insight, i) => (
            <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-2">
                <insight.icon size={16} className={
                  insight.type === 'warning' ? 'text-amber-400' :
                  insight.type === 'success' ? 'text-emerald-400' : 'text-blue-400'
                } />
                <span className="text-sm font-medium">{insight.title}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{insight.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── ORDERS + ACTIVITY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent Orders — REAL DATA */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7}
          className="lg:col-span-3 rounded-2xl bg-zinc-900/50 border border-white/[0.06] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-base font-semibold">Recent Orders</h3>
            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">View all</button>
          </div>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-zinc-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-zinc-500 border-b border-white/[0.04]">
                    <th className="px-6 py-3 font-medium">Order</th>
                    <th className="px-6 py-3 font-medium">Customer</th>
                    <th className="px-6 py-3 font-medium hidden sm:table-cell">Items</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders?.map((order, i) => (
                    <tr key={order._id || i} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-3 text-sm font-mono text-blue-400">{order.orderNumber}</td>
                      <td className="px-6 py-3 text-sm text-zinc-300">{order.customer?.name || 'Guest'}</td>
                      <td className="px-6 py-3 text-sm text-zinc-400 hidden sm:table-cell">{order.lineItems?.length || 0}</td>
                      <td className="px-6 py-3 text-sm font-medium">${order.financials?.total?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                  {(!recentOrders || recentOrders.length === 0) && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-zinc-500">No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Activity Feed (still static) */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={8}
          className="lg:col-span-2 rounded-2xl bg-zinc-900/50 border border-white/[0.06]">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h3 className="text-base font-semibold">Activity Feed</h3>
          </div>
          <div className="p-4 space-y-1">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="mt-0.5">
                  <a.icon size={16} className={a.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 leading-relaxed">{a.text}</p>
                  <p className="text-[11px] text-zinc-600 mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {a.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
