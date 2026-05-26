import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, RefreshCw, Package, CheckCircle2, AlertCircle, Clock, MoreHorizontal, Loader2, Trash2, X, Edit3, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { useProducts, useProductSyncStatus, useDeleteProduct, useCreateProduct, useUpdateProduct, useVendors, useUpdateProductOnShopify, useUpdateInventoryOnShopify, useCreateProductOnShopify, useDeleteProductOnShopify } from '../../hooks/useApi';

function SyncBadge({ status, isShopify }) {
  const map = {
    synced:   { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Synced', icon: CheckCircle2 },
    pending:  { cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Pending', icon: Clock },
    error:    { cls: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Error', icon: AlertCircle },
    conflict: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Conflict', icon: AlertCircle },
  }[status] || { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', label: status, icon: Clock };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border ${map.cls}`}>
        <map.icon size={12} /> {map.label}
      </span>
      {isShopify && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md border bg-violet-500/10 text-violet-400 border-violet-500/20">
          <ArrowLeftRight size={10} /> 2-Way
        </span>
      )}
    </div>
  );
}

const CATEGORIES = ['Electronics', 'Apparel', 'Kitchen', 'Home Decor', 'Beauty', 'Accessories', 'Footwear', 'Uncategorized'];

function AddProductModal({ onClose }) {
  const createProduct = useCreateProduct();
  const createOnShopify = useCreateProductOnShopify();
  const { data: vendorData } = useVendors({ status: 'approved', limit: 100 });
  const vendors = vendorData?.vendors || [];

  const [syncToShopify, setSyncToShopify] = useState(true);
  const [form, setForm] = useState({
    title: '',
    sku: '',
    price: '',
    inventoryQuantity: '',
    category: 'Uncategorized',
    vendorId: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState(''); // '', 'syncing', 'synced', 'warning'
  const [syncWarning, setSyncWarning] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isBusy = createProduct.isPending || createOnShopify.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSyncStatus('');
    setSyncWarning('');
    if (!form.vendorId) { setError('Please select a vendor'); return; }
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        inventoryQuantity: parseInt(form.inventoryQuantity) || 0,
      };

      if (syncToShopify) {
        setSyncStatus('syncing');
        const result = await createOnShopify.mutateAsync(payload);
        if (result.shopifySynced) {
          setSyncStatus('synced');
          setTimeout(() => onClose(), 800);
        } else {
          setSyncStatus('warning');
          setSyncWarning(result.shopifyWarning || 'Shopify sync failed — product saved locally.');
        }
      } else {
        await createProduct.mutateAsync(payload);
        onClose();
      }
    } catch (err) {
      setSyncStatus('');
      setError(err.response?.data?.error || 'Failed to create product');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-base font-semibold">Add New Product</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Sync status banners */}
        <AnimatePresence>
          {syncStatus === 'syncing' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2 text-sm text-blue-400">
              <Loader2 size={14} className="animate-spin" />
              <span>Creating on Shopify…</span>
              <ArrowUpRight size={14} />
            </motion.div>
          )}
          {syncStatus === 'synced' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={14} />
              <span>Product created & synced to Shopify!</span>
            </motion.div>
          )}
          {syncStatus === 'warning' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-sm text-amber-400">
              <AlertCircle size={14} />
              <span>{syncWarning}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Product Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Premium Wireless Headphones" required className="input-field text-sm w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Vendor *</label>
            <select value={form.vendorId} onChange={e => set('vendorId', e.target.value)}
              className="input-field text-sm w-full">
              <option value="">Select a vendor…</option>
              {vendors.map(v => (
                <option key={v._id} value={v._id}>{v.businessName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Price (₹) *</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
                placeholder="29.99" required className="input-field text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Stock Quantity</label>
              <input type="number" min="0" value={form.inventoryQuantity} onChange={e => set('inventoryQuantity', e.target.value)}
                placeholder="100" className="input-field text-sm w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">SKU</label>
              <input value={form.sku} onChange={e => set('sku', e.target.value)}
                placeholder="PRD-001" className="input-field text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="input-field text-sm w-full">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Product description…" rows={3}
              className="input-field text-sm w-full resize-none" />
          </div>

          {/* Sync to Shopify toggle */}
          <div className="flex items-center justify-between px-3 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <ArrowLeftRight size={14} className={syncToShopify ? 'text-violet-400' : 'text-zinc-500'} />
              <div>
                <div className="text-sm font-medium text-zinc-200">Sync to Shopify</div>
                <div className="text-[11px] text-zinc-500">Also create this product on your Shopify store</div>
              </div>
            </div>
            <button type="button" onClick={() => setSyncToShopify(v => !v)}
              className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${
                syncToShopify ? 'bg-violet-500' : 'bg-zinc-700'
              }`}>
              <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                syncToShopify ? 'left-[22px]' : 'left-[3px]'
              }`} />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-zinc-400 rounded-xl border border-white/[0.08] hover:bg-white/[0.03] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isBusy}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {isBusy ? (
                <><Loader2 size={14} className="animate-spin" /> {syncToShopify ? 'Creating & Syncing…' : 'Adding…'}</>
              ) : (
                <>{syncToShopify ? '↗ Add & Sync to Shopify' : 'Add Product'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── EDIT PRODUCT MODAL (with Shopify two-way sync) ─── */
function EditProductModal({ product, onClose }) {
  const updateProduct = useUpdateProduct();
  const updateShopify = useUpdateProductOnShopify();
  const updateInventory = useUpdateInventoryOnShopify();

  const isShopify = !!product.shopifyProductId;

  const [form, setForm] = useState({
    title: product.title || '',
    price: product.price?.toString() || '',
    inventoryQuantity: product.inventoryQuantity?.toString() || '0',
    category: product.category || 'Uncategorized',
    description: product.description || '',
    status: product.status || 'active',
  });
  const [error, setError] = useState('');
  const [syncStatus, setSyncStatus] = useState(''); // '', 'syncing', 'synced', 'error'
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const isBusy = updateProduct.isPending || updateShopify.isPending || updateInventory.isPending;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSyncStatus('');

    try {
      // Check what changed
      const priceChanged = parseFloat(form.price) !== product.price;
      const inventoryChanged = parseInt(form.inventoryQuantity) !== product.inventoryQuantity;
      const fieldsChanged = form.title !== product.title ||
        form.description !== product.description ||
        form.category !== product.category ||
        form.status !== product.status ||
        priceChanged;

      if (isShopify) {
        setSyncStatus('syncing');

        // Push product field changes to Shopify
        if (fieldsChanged) {
          await updateShopify.mutateAsync({
            id: product._id,
            title: form.title,
            description: form.description,
            price: parseFloat(form.price),
            category: form.category,
            status: form.status,
          });
        }

        // Push inventory change to Shopify separately
        if (inventoryChanged) {
          await updateInventory.mutateAsync({
            id: product._id,
            inventoryQuantity: parseInt(form.inventoryQuantity),
          });
        }

        // If nothing changed for Shopify fields but we still want to update locally
        if (!fieldsChanged && !inventoryChanged) {
          await updateProduct.mutateAsync({
            id: product._id,
            ...form,
            price: parseFloat(form.price),
            inventoryQuantity: parseInt(form.inventoryQuantity),
          });
        }

        setSyncStatus('synced');
        setTimeout(() => onClose(), 800);
      } else {
        // Non-Shopify product — just update MongoDB
        await updateProduct.mutateAsync({
          id: product._id,
          ...form,
          price: parseFloat(form.price),
          inventoryQuantity: parseInt(form.inventoryQuantity),
        });
        onClose();
      }
    } catch (err) {
      setSyncStatus('error');
      setError(err.response?.data?.error || err.message || 'Failed to update product');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">Edit Product</h2>
            {isShopify && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-violet-500/20 to-blue-500/20 border border-violet-500/25 text-violet-300">
                <ArrowLeftRight size={10} /> Shopify Sync
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Sync status banner */}
        <AnimatePresence>
          {syncStatus === 'syncing' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2 text-sm text-blue-400">
              <Loader2 size={14} className="animate-spin" />
              <span>Syncing to Shopify…</span>
              <ArrowUpRight size={14} />
            </motion.div>
          )}
          {syncStatus === 'synced' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={14} />
              <span>Synced to Shopify successfully!</span>
            </motion.div>
          )}
          {syncStatus === 'error' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={14} />
              <span>Shopify sync failed — local copy updated</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {isShopify && (
            <div className="px-3 py-2.5 rounded-lg bg-violet-500/5 border border-violet-500/15 text-xs text-violet-300/80">
              <strong>Two-way sync enabled</strong> — changes will push to your Shopify store.
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Product Title</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              required className="input-field text-sm w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Price (₹)</label>
              <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
                required className="input-field text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Stock Quantity</label>
              <input type="number" min="0" value={form.inventoryQuantity} onChange={e => set('inventoryQuantity', e.target.value)}
                className="input-field text-sm w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="input-field text-sm w-full">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="input-field text-sm w-full">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} className="input-field text-sm w-full resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-zinc-400 rounded-xl border border-white/[0.08] hover:bg-white/[0.03] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isBusy}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {isBusy ? (
                <><Loader2 size={14} className="animate-spin" /> {isShopify ? 'Syncing…' : 'Saving…'}</>
              ) : (
                <>{isShopify ? '↗ Save & Sync to Shopify' : 'Save Changes'}</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [syncFilter, setSyncFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const { data, isLoading, isError, refetch } = useProducts({ search: search || undefined, syncStatus: syncFilter || undefined });
  const { data: syncCounts } = useProductSyncStatus();
  const deleteProduct = useDeleteProduct();
  const deleteShopifyProduct = useDeleteProductOnShopify();

  const products = data?.products || [];
  const pagination = data?.pagination;

  const stats = [
    { label: 'Total Products', value: pagination?.total ?? '—' },
    { label: 'Synced',         value: syncCounts?.synced ?? '—' },
    { label: 'Pending',        value: syncCounts?.pending ?? '—' },
    { label: 'Errors',         value: syncCounts?.error ?? '—' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage synced products across all vendors and stores.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-300 rounded-xl border border-white/[0.08] hover:bg-white/[0.03] transition-colors">
              <RefreshCw size={15} /> Sync Now
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all shadow-lg shadow-blue-500/20">
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
            <div className="text-xs text-zinc-500">{stat.label}</div>
            <div className="mt-1 text-2xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products, SKUs…" className="input-field pl-9 text-sm" />
        </div>
        <select value={syncFilter} onChange={e => setSyncFilter(e.target.value)}
          className="input-field text-sm max-w-[180px]">
          <option value="">All sync statuses</option>
          <option value="synced">Synced</option>
          <option value="pending">Pending</option>
          <option value="error">Error</option>
          <option value="conflict">Conflict</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Sync</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading && (
                <tr><td colSpan={7} className="py-16 text-center text-zinc-500">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />Loading products…
                </td></tr>
              )}
              {isError && (
                <tr><td colSpan={7} className="py-16 text-center text-red-400">
                  <AlertCircle size={20} className="mx-auto mb-2" />Failed to load products
                </td></tr>
              )}
              {!isLoading && !isError && products.length === 0 && (
                <tr><td colSpan={7} className="py-16 text-center text-zinc-500">No products found</td></tr>
              )}
              {products.map((p) => (
                <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/[0.06] flex items-center justify-center">
                        <Package size={14} className="text-zinc-500" />
                      </div>
                      <div>
                        <div className="font-medium text-zinc-200 max-w-[200px] truncate">{p.title}</div>
                        <div className="text-xs text-zinc-500">{p.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{p.sku || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{p.vendorId?.businessName || '—'}</td>
                  <td className="px-4 py-3 font-medium text-zinc-200">₹{p.price?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={p.inventoryQuantity === 0 ? 'text-red-400' : p.inventoryQuantity <= 5 ? 'text-amber-400' : 'text-zinc-300'}>
                      {p.inventoryQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3"><SyncBadge status={p.syncStatus} isShopify={!!p.shopifyProductId} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditProduct(p)}
                        className="p-1.5 rounded-lg hover:bg-blue-500/10 text-zinc-500 hover:text-blue-400 transition-colors"
                        title="Edit product">
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          const isShopify = !!p.shopifyProductId;
                          const msg = isShopify
                            ? 'This product is synced to Shopify. Delete from both Shopify and your store?'
                            : 'Delete this product?';
                          if (window.confirm(msg)) {
                            if (isShopify) {
                              deleteShopifyProduct.mutate(p._id);
                            } else {
                              deleteProduct.mutate(p._id);
                            }
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
                        title={p.shopifyProductId ? 'Delete from store & Shopify' : 'Delete product'}>
                        <Trash2 size={14} />
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
            Showing {products.length} of {pagination.total} products
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}
        {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} />}
      </AnimatePresence>
    </div>
  );
}
