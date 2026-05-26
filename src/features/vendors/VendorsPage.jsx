import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MoreHorizontal, Star, CheckCircle2,
  Clock, XCircle, Loader2, AlertCircle, X
} from 'lucide-react';
import { useVendors, useUpdateVendorStatus, useCreateVendor } from '../../hooks/useApi';

function StatusBadge({ status }) {
  const s = {
    approved:  { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    pending:   { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock },
    suspended: { cls: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
    rejected:  { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: XCircle },
  }[status] || { cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border ${s.cls}`}>
      <s.icon size={12} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AddVendorModal({ onClose }) {
  const createVendor = useCreateVendor();
  const [form, setForm] = useState({
    businessName: '',
    businessEmail: '',
    businessType: 'individual',
    description: '',
    phone: '',
    website: '',
  });
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createVendor.mutateAsync(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create vendor');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-md bg-zinc-900 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold">Add New Vendor</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Business Name *</label>
            <input value={form.businessName} onChange={e => set('businessName', e.target.value)}
              placeholder="e.g. TechVault Pro" required className="input-field text-sm w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Business Email</label>
            <input type="email" value={form.businessEmail} onChange={e => set('businessEmail', e.target.value)}
              placeholder="hello@business.com" className="input-field text-sm w-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Business Type</label>
              <select value={form.businessType} onChange={e => set('businessType', e.target.value)}
                className="input-field text-sm w-full">
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+1 555 0100" className="input-field text-sm w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Website</label>
            <input value={form.website} onChange={e => set('website', e.target.value)}
              placeholder="https://business.com" className="input-field text-sm w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief description of the vendor..." rows={3}
              className="input-field text-sm w-full resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-zinc-400 rounded-xl border border-white/[0.08] hover:bg-white/[0.03] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={createVendor.isPending}
              className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {createVendor.isPending ? <><Loader2 size={14} className="animate-spin" /> Adding…</> : 'Add Vendor'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function VendorsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { data, isLoading, isError } = useVendors({ search, status: statusFilter || undefined });
  const updateStatus = useUpdateVendorStatus();

  const vendors = data?.vendors || [];
  const pagination = data?.pagination;

  const stats = [
    { label: 'Total Vendors',    value: pagination?.total ?? '—' },
    { label: 'Pending Approval', value: vendors.filter(v => v.status === 'pending').length },
    { label: 'Avg Rating',       value: vendors.length ? (vendors.reduce((a, v) => a + (v.performance?.rating || 0), 0) / vendors.length).toFixed(1) : '—' },
    { label: 'Active',           value: vendors.filter(v => v.status === 'approved').length },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Vendors</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage your marketplace vendors and their performance.</p>
          </div>
          <button onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all shadow-lg shadow-blue-500/20">
            <Plus size={16} /> Add Vendor
          </button>
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
            placeholder="Search vendors…" className="input-field pl-9 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="input-field text-sm max-w-[160px]">
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Revenue</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Fulfillment</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading && (
                <tr><td colSpan={6} className="py-16 text-center text-zinc-500">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />Loading vendors…
                </td></tr>
              )}
              {isError && (
                <tr><td colSpan={6} className="py-16 text-center text-red-400">
                  <AlertCircle size={20} className="mx-auto mb-2" />Failed to load vendors
                </td></tr>
              )}
              {!isLoading && !isError && vendors.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-zinc-500">No vendors found</td></tr>
              )}
              {vendors.map((v) => {
                const initials = v.businessName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
                return (
                  <motion.tr key={v._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center text-xs font-bold text-zinc-300">
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-200">{v.businessName}</div>
                          <div className="text-xs text-zinc-500">{v.businessEmail || v.userId?.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star size={13} className="fill-current" />
                        <span className="text-zinc-300">{v.performance?.rating?.toFixed(1) || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">₹{(v.performance?.totalRevenue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      {v.performance?.fulfillmentRate ? `${v.performance.fulfillmentRate}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {v.status === 'pending' && (
                          <button onClick={() => updateStatus.mutate({ id: v._id, status: 'approved' })}
                            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                            Approve
                          </button>
                        )}
                        {v.status === 'approved' && (
                          <button onClick={() => updateStatus.mutate({ id: v._id, status: 'suspended' })}
                            className="px-2.5 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                            Suspend
                          </button>
                        )}
                        <button className="p-1.5 rounded-lg hover:bg-white/[0.05] text-zinc-500 hover:text-zinc-300 transition-colors">
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pagination && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-white/[0.06] text-xs text-zinc-500">
            Showing {vendors.length} of {pagination.total} vendors
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && <AddVendorModal onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
