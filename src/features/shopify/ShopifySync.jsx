import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Package, ShoppingCart, Store, CheckCircle2, AlertCircle, Loader2, Zap, ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

function useShopifyStatus() {
  return useQuery({
    queryKey: ['shopify-status'],
    queryFn: async () => {
      const { data } = await api.get('/shopify/status');
      return data;
    },
  });
}

function useShopifyStoreInfo() {
  return useQuery({
    queryKey: ['shopify-store'],
    queryFn: async () => {
      const { data } = await api.get('/shopify/store-info');
      return data.shop;
    },
  });
}

export default function ShopifySync() {
  const qc = useQueryClient();
  const { data: status, isLoading: statusLoading } = useShopifyStatus();
  const { data: store } = useShopifyStoreInfo();
  const [log, setLog] = useState([]);

  const addLog = (msg, type = 'info') => {
    setLog(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  const syncProducts = useMutation({
    mutationFn: () => api.post('/shopify/sync-products').then(r => r.data),
    onMutate: () => addLog('⬇ Pulling products from Shopify...', 'info'),
    onSuccess: (data) => {
      addLog(`✅ ${data.synced} products synced, ${data.errors} errors`, 'success');
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['shopify-status'] });
    },
    onError: (err) => addLog(`❌ ${err.response?.data?.error || err.message}`, 'error'),
  });

  const syncOrders = useMutation({
    mutationFn: () => api.post('/shopify/sync-orders').then(r => r.data),
    onMutate: () => addLog('⬇ Pulling orders from Shopify...', 'info'),
    onSuccess: (data) => {
      addLog(`✅ ${data.synced} orders synced, ${data.errors} errors`, 'success');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['shopify-status'] });
    },
    onError: (err) => addLog(`❌ ${err.response?.data?.error || err.message}`, 'error'),
  });

  const syncAll = async () => {
    addLog('Starting full sync...', 'info');
    await syncProducts.mutateAsync();
    await syncOrders.mutateAsync();
    addLog('Full sync complete!', 'success');
  };

  const isSyncing = syncProducts.isPending || syncOrders.isPending;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Shopify Sync</h1>
        <p className="text-sm text-zinc-400 mt-1">Two-way sync — pull from Shopify and push changes back.</p>
      </motion.div>

      {/* Store info card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-[#96bf48]/10 to-[#5e8e3e]/10 border border-[#96bf48]/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#96bf48]/20 flex items-center justify-center">
            <Store size={24} className="text-[#96bf48]" />
          </div>
          <div>
            <div className="font-semibold text-zinc-200">{store?.name || 'SamarthKanchi35'}</div>
            <div className="text-sm text-zinc-400">{store?.domain || 'samarthkanchi35.myshopify.com'}</div>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 size={14} />
            Connected
          </div>
        </div>
      </motion.div>

      {/* Two-way sync direction indicator */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="p-5 rounded-2xl bg-gradient-to-r from-violet-500/[0.06] via-blue-500/[0.04] to-emerald-500/[0.06] border border-violet-500/[0.12]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <ArrowLeftRight size={18} className="text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-200">Two-Way Sync Active</div>
              <div className="text-xs text-zinc-500">Changes in your dashboard push back to Shopify</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-blue-400">
                <ArrowDownLeft size={14} />
                <span className="font-medium">Pull</span>
              </div>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">Shopify → SyncFlow</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ArrowUpRight size={14} />
                <span className="font-medium">Push</span>
              </div>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">SyncFlow → Shopify</span>
            </div>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
          <strong className="text-zinc-400">How it works:</strong> Use the buttons below to pull data from Shopify.
          When you edit products, update inventory, or fulfill orders in your dashboard, changes automatically push back to Shopify.
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Synced Products', value: statusLoading ? '…' : status?.syncedProducts ?? 0, icon: Package, color: 'text-blue-400' },
          { label: 'Synced Orders', value: statusLoading ? '…' : status?.syncedOrders ?? 0, icon: ShoppingCart, color: 'text-violet-400' },
          { label: 'Last Synced', value: status?.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleTimeString() : 'Never', icon: RefreshCw, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-zinc-500">{stat.label}</div>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Sync buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => syncProducts.mutate()} disabled={isSyncing}
          className="flex items-center justify-center gap-3 p-5 rounded-xl border border-white/[0.06] bg-zinc-900/50 hover:bg-zinc-900 hover:border-blue-500/30 transition-all disabled:opacity-50 group">
          {syncProducts.isPending
            ? <Loader2 size={20} className="animate-spin text-blue-400" />
            : <Package size={20} className="text-blue-400" />}
          <div className="text-left">
            <div className="font-medium text-zinc-200">Pull Products</div>
            <div className="text-xs text-zinc-500">Shopify → SyncFlow</div>
          </div>
        </button>

        <button onClick={() => syncOrders.mutate()} disabled={isSyncing}
          className="flex items-center justify-center gap-3 p-5 rounded-xl border border-white/[0.06] bg-zinc-900/50 hover:bg-zinc-900 hover:border-violet-500/30 transition-all disabled:opacity-50 group">
          {syncOrders.isPending
            ? <Loader2 size={20} className="animate-spin text-violet-400" />
            : <ShoppingCart size={20} className="text-violet-400" />}
          <div className="text-left">
            <div className="font-medium text-zinc-200">Pull Orders</div>
            <div className="text-xs text-zinc-500">Shopify → SyncFlow</div>
          </div>
        </button>

        <button onClick={syncAll} disabled={isSyncing}
          className="flex items-center justify-center gap-3 p-5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20">
          {isSyncing
            ? <Loader2 size={20} className="animate-spin text-white" />
            : <Zap size={20} className="text-white" />}
          <div className="text-left">
            <div className="font-medium text-white">Sync Everything</div>
            <div className="text-xs text-blue-200">Products + Orders</div>
          </div>
        </button>
      </div>

      {/* Push-back info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="p-4 rounded-xl bg-zinc-900/30 border border-white/[0.04]">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">↗ Push to Shopify (Automatic)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Product Edits', desc: 'Edit title, price, description, or status → auto-pushes to Shopify', color: 'text-blue-400' },
            { label: 'Inventory Updates', desc: 'Change stock quantity → updates Shopify inventory levels', color: 'text-emerald-400' },
            { label: 'Order Fulfillment', desc: 'Fulfill an order → creates fulfillment in Shopify with tracking', color: 'text-violet-400' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-zinc-800/30 border border-white/[0.04]">
              <div className={`text-sm font-medium mb-1 ${item.color}`}>{item.label}</div>
              <div className="text-[11px] text-zinc-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Activity log */}
      {log.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl border border-white/[0.06] bg-zinc-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Sync Log
          </div>
          <div className="p-4 space-y-2 max-h-48 overflow-y-auto font-mono text-xs">
            {log.map((entry, i) => (
              <div key={i} className={`flex items-start gap-3 ${
                entry.type === 'error' ? 'text-red-400' :
                entry.type === 'success' ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                <span className="text-zinc-600 shrink-0">{entry.time}</span>
                <span>{entry.msg}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
