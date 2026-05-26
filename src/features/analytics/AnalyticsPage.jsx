import { motion } from 'framer-motion';
import { TrendingUp, Users, Package, Truck, Bot, Globe, Download, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';

// ─── React Query hooks ───────────────────────────────────────────────────────
function useMonthlyAnalytics() {
  return useQuery({
    queryKey: ['analytics-monthly'],
    queryFn: async () => {
      const { data } = await api.get('/orders/analytics/monthly');
      return data.monthly;
    },
  });
}

function useVendorAnalytics() {
  return useQuery({
    queryKey: ['analytics-vendors'],
    queryFn: async () => {
      const { data } = await api.get('/orders/analytics/vendors');
      return data.vendors;
    },
  });
}

function useFulfillmentAnalytics() {
  return useQuery({
    queryKey: ['analytics-fulfillment'],
    queryFn: async () => {
      const { data } = await api.get('/orders/analytics/fulfillment');
      return data.fulfillment;
    },
  });
}

// ─── Static data (no backend equivalent yet) ─────────────────────────────────
const shippingData = [
  { name: 'Mon', onTime: 45, delayed: 3 },
  { name: 'Tue', onTime: 52, delayed: 5 },
  { name: 'Wed', onTime: 48, delayed: 2 },
  { name: 'Thu', onTime: 61, delayed: 4 },
  { name: 'Fri', onTime: 55, delayed: 6 },
  { name: 'Sat', onTime: 38, delayed: 1 },
  { name: 'Sun', onTime: 22, delayed: 0 },
];

// ─── Shared tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-zinc-800 border border-white/[0.08] px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? `₹${(p.value / 1000).toFixed(1)}K` : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────
function ChartSkeleton({ height = 250 }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <Loader2 size={24} className="animate-spin text-zinc-600" />
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyAnalytics();
  const { data: vendorData, isLoading: vendorLoading } = useVendorAnalytics();
  const { data: fulfillmentData, isLoading: fulfillmentLoading } = useFulfillmentAnalytics();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-zinc-400 mt-1">Deep insights into your marketplace performance.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-300 rounded-xl border border-white/[0.08] hover:bg-white/[0.03] transition-colors">
            <Download size={15} /> Export Report
          </button>
        </div>
      </motion.div>

      {/* Revenue + AI Forecast */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Revenue vs AI Forecast</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full">
                <Bot size={10} /> AI Powered
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">Actual revenue compared to AI predictions</p>
          </div>
        </div>
        {monthlyLoading ? <ChartSkeleton height={300} /> : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Grid: Vendor Performance + Fulfillment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Vendor Performance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
          <h3 className="text-base font-semibold mb-1">Vendor Performance</h3>
          <p className="text-sm text-zinc-500 mb-6">Revenue by vendor this quarter</p>
          {vendorLoading ? <ChartSkeleton /> : vendorData?.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-sm text-zinc-500">No vendor data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={vendorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#71717A' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 1000}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#A1A1AA' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 6, 6, 0]} barSize={20} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Fulfillment Breakdown (replaced geographic) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
          <div className="flex items-center gap-2 mb-1">
            <Package size={18} className="text-zinc-400" />
            <h3 className="text-base font-semibold">Fulfillment Breakdown</h3>
          </div>
          <p className="text-sm text-zinc-500 mb-6">Order status distribution</p>
          {fulfillmentLoading ? <ChartSkeleton height={160} /> : fulfillmentData?.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-sm text-zinc-500">No order data yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={fulfillmentData} innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                    {fulfillmentData?.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {fulfillmentData?.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                      <span className="text-sm text-zinc-400">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">{r.count} orders</span>
                      <span className="text-sm font-medium">{r.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Shipping Analytics */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
        <div className="flex items-center gap-2 mb-1">
          <Truck size={18} className="text-zinc-400" />
          <h3 className="text-base font-semibold">Shipping Performance</h3>
        </div>
        <p className="text-sm text-zinc-500 mb-6">On-time vs delayed shipments this week</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={shippingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#71717A' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="onTime" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} name="On Time" />
            <Bar dataKey="delayed" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} name="Delayed" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
