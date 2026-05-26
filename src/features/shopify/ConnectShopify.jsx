/**
 * src/features/shopify/ConnectShopify.jsx
 *
 * Shown inside Settings → Shopify when the user hasn't connected a store yet.
 * Flow:
 *   1. User enters their .myshopify.com domain
 *   2. We call POST /api/shopify-auth/connect-store
 *      → If the store was already installed via OAuth, we link it to the user
 *      → If not, we redirect to /api/shopify-auth/install?shop=... which kicks
 *        off the full Shopify OAuth flow
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, ExternalLink, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../../lib/api';

export default function ConnectShopify({ onConnected }) {
    const [shop, setShop] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const normalise = (raw) =>
        raw
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//i, '')
            .replace(/\/+$/, '');

    const handleConnect = async () => {
        const normShop = normalise(shop);
        if (!normShop) {
            setError('Please enter your store domain.');
            return;
        }
        // Add .myshopify.com if user omitted it
        const fullShop = normShop.endsWith('.myshopify.com')
            ? normShop
            : `${normShop}.myshopify.com`;

        setError('');
        setLoading(true);

        try {
            // First try to claim an already-installed store
            const { data } = await api.post('/shopify-auth/connect-store', { shop: fullShop });
            if (data.store) {
                onConnected?.(data.store);
                return;
            }
        } catch (err) {
            const serverError = err.response?.data;
            if (serverError?.installUrl) {
                // Store not installed yet — redirect to OAuth install flow
                window.location.href = serverError.installUrl;
                return;
            }
            setError(serverError?.error || err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const handleInstallDirect = () => {
        const normShop = normalise(shop);
        if (!normShop) {
            setError('Please enter your store domain first.');
            return;
        }
        const fullShop = normShop.endsWith('.myshopify.com')
            ? normShop
            : `${normShop}.myshopify.com`;

        const backendUrl =
            import.meta.env.VITE_API_URL?.replace('/api', '') ||
            'http://localhost:5000';
        window.location.href = `${backendUrl}/api/shopify-auth/install?shop=${encodeURIComponent(fullShop)}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold mb-1">Connect Your Shopify Store</h3>
                <p className="text-sm text-zinc-500">
                    Connect once — SyncFlow will sync products, orders, and inventory automatically.
                </p>
            </div>

            {/* Step diagram */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { step: '1', title: 'Enter store URL', desc: 'Type your .myshopify.com domain below' },
                    { step: '2', title: 'Approve in Shopify', desc: "You'll be redirected to grant permissions" },
                    { step: '3', title: "You're connected", desc: 'SyncFlow can now read & write your store' },
                ].map((s) => (
                    <div key={s.step} className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
                        <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center mb-2">
                            {s.step}
                        </div>
                        <div className="text-sm font-medium text-zinc-200 mb-0.5">{s.title}</div>
                        <div className="text-xs text-zinc-500">{s.desc}</div>
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-zinc-300">
                    Your Shopify store domain
                </label>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={shop}
                            onChange={(e) => {
                                setShop(e.target.value);
                                setError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                            placeholder="your-store.myshopify.com"
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
                        />
                    </div>
                    <button
                        onClick={handleConnect}
                        disabled={loading || !shop.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 whitespace-nowrap"
                    >
                        {loading ? (
                            <Loader2 size={15} className="animate-spin" />
                        ) : (
                            <ArrowRight size={15} />
                        )}
                        Connect Store
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-400">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}

                <p className="text-xs text-zinc-600">
                    You can find your domain in your Shopify admin URL:{' '}
                    <span className="text-zinc-400">https://admin.shopify.com/store/your-store-name</span>
                </p>
            </div>

            {/* Manual install fallback */}
            <div className="pt-2 border-t border-white/[0.04]">
                <p className="text-xs text-zinc-500 mb-2">
                    Installing the app for the first time?{' '}
                </p>
                <button
                    onClick={handleInstallDirect}
                    disabled={!shop.trim()}
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-40"
                >
                    <ExternalLink size={12} />
                    Install app on Shopify (opens Shopify permission screen)
                </button>
            </div>
        </motion.div>
    );
}
