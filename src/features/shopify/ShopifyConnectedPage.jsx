/**
 * src/features/shopify/ShopifyConnectedPage.jsx
 *
 * Shopify redirects here after the OAuth callback:
 *   /shopify-connected?shop=xxx.myshopify.com
 *
 * This page auto-links the store to the logged-in user (if any),
 * then sends them to the dashboard.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

export default function ShopifyConnectedPage() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const shop = params.get('shop') || '';
    const [status, setStatus] = useState('linking'); // 'linking' | 'done' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!shop) {
            navigate('/dashboard');
            return;
        }

        // Try to link the store to the currently logged-in user
        api
            .post('/shopify-auth/connect-store', { shop })
            .then(() => {
                setStatus('done');
                setTimeout(() => navigate('/dashboard/shopify'), 2000);
            })
            .catch((err) => {
                // If not logged in, just redirect to login
                if (err.response?.status === 401) {
                    navigate('/login?redirect=/shopify-connected&shop=' + encodeURIComponent(shop));
                    return;
                }
                // Store already linked or other non-fatal error — still go to dashboard
                setStatus('done');
                setTimeout(() => navigate('/dashboard/shopify'), 2000);
            });
    }, [shop, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4 p-8"
            >
                {status === 'linking' && (
                    <>
                        <Loader2 size={48} className="animate-spin text-violet-400 mx-auto" />
                        <h2 className="text-xl font-semibold text-zinc-200">Connecting your store…</h2>
                        <p className="text-sm text-zinc-500">{shop}</p>
                    </>
                )}
                {status === 'done' && (
                    <>
                        <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
                        <h2 className="text-xl font-semibold text-zinc-200">Store connected!</h2>
                        <p className="text-sm text-zinc-500">
                            <span className="text-zinc-300 font-medium">{shop}</span> is now linked to SyncFlow.
                        </p>
                        <p className="text-xs text-zinc-600">Redirecting to your dashboard…</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <AlertCircle size={48} className="text-red-400 mx-auto" />
                        <h2 className="text-xl font-semibold text-zinc-200">Something went wrong</h2>
                        <p className="text-sm text-red-400">{errorMsg}</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mt-4 px-5 py-2 rounded-xl bg-zinc-800 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
