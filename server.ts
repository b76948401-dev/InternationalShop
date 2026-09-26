import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { loadDatabase } from './server/db';
import { authMiddleware } from './server/middleware/authMiddleware';
import authRoutes from './server/routes/authRoutes';
import productRoutes, { getLiveProducts } from './server/routes/productRoutes';
import orderRoutes from './server/routes/orderRoutes';
import notificationRoutes from './server/routes/notificationRoutes';
import adminRoutes from './server/routes/adminRoutes';
import paymentMethodRoutes from './server/routes/paymentMethodRoutes';
import supportRoutes from './server/routes/supportRoutes';
import { testSupabaseConnection, SUPABASE_SCHEMA_SQL } from './server/supabase';

async function startServer() {
  // 1. Initialize persistent storage
  loadDatabase();
  getLiveProducts().catch((err) => console.warn('[Startup] Initial product sync error:', err));

  const app = express();
  const PORT = 3000;

  // CORS middleware for AI Studio iframe preview environment and cross-origin requests
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, apikey');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Middleware
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(authMiddleware);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Supabase connection status check & schema guide
  app.get('/api/supabase/status', async (req, res) => {
    const result = await testSupabaseConnection();
    res.json({
      ...result,
      sqlSchemaGuide: SUPABASE_SCHEMA_SQL,
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api', orderRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payment-methods', paymentMethodRoutes);
  app.use('/api/support', supportRoutes);

  // Global API 404 handler
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[International Shop] Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
