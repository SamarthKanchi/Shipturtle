import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, MoreHorizontal } from 'lucide-react';
import { useOrders, useOrderAnalytics, useUpdateOrderStatus } from '../../hooks/useApi';

function StatusBadge({ status }) {
  const map = {
    fulfilled:           { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    processing:          { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Package },
    pending:             { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    cancelled:           { cls: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
    partially_fulfilled: { cls: 'bg-violet-500/10 text-violet-400 border-violet-500/20', icon: Package },
    refunded:            { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: XCircle },
  }[status] || { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border ${map.cls}`}>
      <map.icon size={12} /> {status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

const TABS = ['all', 'pending', 'processing', 'fulfilled', 'cancelled'];

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const { data, isLoading, isError } = useOrders({ status: tab === 'all' ? undefined : tab, search: search || undefined });
  const { data: analytics } = useOrderAnalytics();
  const updateStatus = useUpdateOrderStatus();

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const statusCounts = {};
  analytics?.statusBreakdown?.forEach(s => { statusCounts[s._id] = s.count; });

  const stats = [
    { label: 'Total Orders', value: pagination?.total ?? '—', icon: Package },
    { label: 'Pending',      value: statusCounts['pending'] ?? '—', icon: Clock },
    { label: 'Processing',   value: statusCounts['processing'] ?? '—', icon: AlertCircle },
    { label: 'Total Revenue',value: analytics?.revenue ? `$${analytics.revenue.total?.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—', icon: CheckCircle2 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-zinc-400 mt-1">Track and manage all marketplace orders.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500">{stat.label}</div>
              <stat.icon size={16} className="text-zinc-600" />
            </div>
            <div className="mt-1 text-2xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/[0.06] rounded-xl">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${tab === t ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search orders…" className="input-field pl-9 text-sm max-w-xs" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading && (
                <tr><td colSpan={7} className="py-16 text-center text-zinc-500">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />Loading orders…
                </td></tr>
              )}
              {isError && (
                <tr><td colSpan={7} className="py-16 text-center text-red-400">
                  <AlertCircle size={20} className="mx-auto mb-2" />Failed to load orders
                </td></tr>
              )}
              {!isLoading && !isError && orders.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center text-zinc-500">No orders found</td></tr>
              )}
              {orders.map((o) => (
                <motion.tr key={o._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-zinc-300 text-xs">{o.orderNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-200">{o.customer?.name}</div>
                    <div className="text-xs text-zinc-500">{o.customer?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {o.lineItems?.[0]?.vendorId?.businessName || '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-200">
                    ${o.financials?.total?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {o.status === 'pending' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: o._id, status: 'processing' })}
                          className="px-2.5 py-1 text-xs rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                          Process
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors">
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-white/[0.06] text-xs text-zinc-500">
            Showing {orders.length} of {pagination.total} orders
          </div>
        )}
      </div>
    </div>
  );
}
