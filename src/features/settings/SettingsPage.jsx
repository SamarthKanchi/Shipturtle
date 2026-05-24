import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Building2, CreditCard, Key, Bell, Store, Shield,
  ChevronRight, Eye, EyeOff, Copy, Check, ExternalLink
} from 'lucide-react';

const tabs = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'shopify', label: 'Shopify', icon: Store },
  { id: 'security', label: 'Security', icon: Shield },
];

function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Marketplace Settings</h3>
        <p className="text-sm text-zinc-500">Configure your marketplace profile and preferences.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Marketplace Name</label>
          <input defaultValue="TechMarket Hub" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Support Email</label>
          <input defaultValue="support@techmarket.com" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Default Commission (%)</label>
          <input type="number" defaultValue="15" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Currency</label>
          <select className="input-field">
            <option>USD — US Dollar</option>
            <option>EUR — Euro</option>
            <option>GBP — British Pound</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description</label>
          <textarea rows={3} defaultValue="A premium multi-vendor marketplace for tech products and accessories." className="input-field resize-none" />
        </div>
      </div>
      <div className="flex justify-end">
        <button className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 transition-all shadow-lg shadow-blue-500/20">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function BillingSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Billing & Subscription</h3>
        <p className="text-sm text-zinc-500">Manage your plan and payment methods.</p>
      </div>
      {/* Current Plan */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-blue-500/[0.06] to-violet-500/[0.04] border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-400">Current Plan</div>
            <div className="text-2xl font-bold mt-1">Growth</div>
            <div className="text-sm text-zinc-500 mt-1">$149/month · Renews Jun 23, 2026</div>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-blue-400 rounded-xl border border-blue-500/20 hover:bg-blue-500/10 transition-colors">
            Upgrade Plan
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {[
            { label: 'Vendors', value: '14 / 25' },
            { label: 'Products', value: '2,847 / 5,000' },
            { label: 'AI Credits', value: '8,420 / 10,000' },
          ].map((u, i) => (
            <div key={i}>
              <div className="text-xs text-zinc-500">{u.label}</div>
              <div className="text-sm font-medium mt-0.5">{u.value}</div>
              <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${56 + i * 12}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Payment Method */}
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-[9px] font-bold text-white">VISA</div>
            <div>
              <div className="text-sm font-medium">•••• •••• •••• 4242</div>
              <div className="text-xs text-zinc-500">Expires 08/2028</div>
            </div>
          </div>
          <button className="text-sm text-blue-400 hover:text-blue-300">Update</button>
        </div>
      </div>
    </div>
  );
}

function APISettings() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiKey = 'sf_live_k8x2mP9qRt4wZ1nL7vBcYhJ3dF6gA0sE';
  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">API Keys</h3>
        <p className="text-sm text-zinc-500">Manage API keys for external integrations.</p>
      </div>
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Live API Key</div>
          <span className="px-2 py-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 rounded-lg bg-zinc-800/50 border border-white/[0.06] text-sm font-mono text-zinc-300">
            {showKey ? apiKey : '•'.repeat(36)}
          </code>
          <button onClick={() => setShowKey(!showKey)} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]">
            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button onClick={handleCopy} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]">
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Created May 1, 2026 · Last used 2 hours ago</p>
      </div>
      <button className="px-4 py-2.5 text-sm font-medium text-zinc-300 rounded-xl border border-white/[0.08] hover:bg-white/[0.03] transition-colors">
        + Generate New Key
      </button>
    </div>
  );
}

function ShopifySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Shopify Integration</h3>
        <p className="text-sm text-zinc-500">Manage connected Shopify stores.</p>
      </div>
      <div className="p-5 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#95BF47]/10 flex items-center justify-center">
              <Store size={20} className="text-[#95BF47]" />
            </div>
            <div>
              <div className="text-sm font-medium">techmarket-hub.myshopify.com</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
              </div>
            </div>
          </div>
          <button className="text-sm text-red-400 hover:text-red-300">Disconnect</button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
          <div><div className="text-xs text-zinc-500">Products Synced</div><div className="text-sm font-medium mt-0.5">2,847</div></div>
          <div><div className="text-xs text-zinc-500">Last Sync</div><div className="text-sm font-medium mt-0.5">2 min ago</div></div>
          <div><div className="text-xs text-zinc-500">Webhooks</div><div className="text-sm font-medium mt-0.5">12 active</div></div>
        </div>
      </div>
      <button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-300 rounded-xl border border-white/[0.08] hover:bg-white/[0.03] transition-colors">
        <Store size={16} /> Connect Another Store
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return <GeneralSettings />;
      case 'billing': return <BillingSettings />;
      case 'api': return <APISettings />;
      case 'shopify': return <ShopifySettings />;
      default: return (
        <div className="py-12 text-center text-zinc-500">
          <p className="text-sm">{tabs.find(t => t.id === activeTab)?.label} settings coming soon.</p>
        </div>
      );
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your marketplace configuration.</p>
      </motion.div>

      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <nav className="lg:w-52 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}>
                <tab.icon size={17} />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
          className="flex-1 rounded-2xl bg-zinc-900/50 border border-white/[0.06] p-6">
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
}
