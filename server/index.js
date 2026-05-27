import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import vendorRoutes from './routes/vendors.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import shopifyRoutes from './routes/shopify.js';
import shopifyAuthRoutes from './routes/shopifyAuth.js';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ───
app.use(helmet());
// Clean up trailing slash and whitespace helper
const cleanOrigin = (origin) => origin.trim().replace(/\/$/, '');

// Parse allowed origins from env or default to localhost
const getCorsOrigins = () => {
  const configured = process.env.CORS_ORIGIN;
  if (!configured) {
    return ['http://localhost:5173', 'http://localhost:5174'];
  }
  return configured.split(',').map(cleanOrigin);
};

const allowedOrigins = getCorsOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // If no origin (e.g. server-to-server or REST tools), allow it
    if (!origin) return callback(null, true);

    const normalizedOrigin = cleanOrigin(origin);

    // Check if the origin matches any allowed origin or if wildcard '*' is in allowed origins
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      return allowed === normalizedOrigin;
    });

    if (isAllowed) {
      return callback(null, true);
    }

    // Also support local development fallback
    if (process.env.NODE_ENV === 'development' && (normalizedOrigin.startsWith('http://localhost:') || normalizedOrigin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }

    console.warn(`CORS blocked for origin: ${origin}. Allowed origins:`, allowedOrigins);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── ROUTES ───
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/shopify-auth', shopifyAuthRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SyncFlow AI API' });
});

// ─── ERROR HANDLING ───
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── START SERVER ───
const start = async () => {
  await connectDB();

  // Drop stale unique index on orderNumber (removed from schema — not meaningful across multiple stores)
  try {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.collection('orders').dropIndex('orderNumber_1');
    console.log('[Startup] Dropped stale orderNumber_1 unique index');
  } catch (e) {
    // Index already gone or collection doesn't exist yet — that's fine
    if (!e.message?.includes('not found')) {
      console.log('[Startup] orderNumber index note:', e.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`\n⚡ SyncFlow AI API running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

start().catch(console.error);

export default app; // Reload triggered by Antigravity
