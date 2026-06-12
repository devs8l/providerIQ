// ProviderIQ — API Core Server Entry
// Express + tRPC headless service
// Powered by Inquantic.Ai

import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load .env from monorepo root
config({ path: resolve(import.meta.dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createContext } from './trpc/context.js';
import { appRouter } from './trpc/router.js';

import type { Express } from 'express';

const app: Express = express();
const port = process.env['API_PORT'] ?? 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Inquantic.Ai Branding header middleware
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Inquantic.Ai ProviderIQ');
  next();
});

// tRPC express gateway
app.use(
  ['/trpc', '/api/trpc'],
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Simple healthcheck endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    engine: 'Inquantic.Ai Provider Intelligence Platform API',
    timestamp: new Date(),
  });
});

// In production (e.g. the Docker single-container deployment) the same server
// also serves the compiled dashboard static assets and falls back to the SPA
// entry for client-side routes. The Vite build is emitted to apps/dashboard/dist.
if (process.env['NODE_ENV'] === 'production') {
  const distDir =
    process.env['DASHBOARD_DIST'] ??
    resolve(import.meta.dirname, '../../dashboard/dist');

  app.use(express.static(distDir));

  // SPA fallback — everything that isn't an API/tRPC/health route returns index.html
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/trpc') ||
      req.path === '/health'
    ) {
      return next();
    }
    res.sendFile(resolve(distDir, 'index.html'));
  });
}

// Listen everywhere except on Vercel's serverless runtime (where the exported
// app is invoked directly and must not bind a port).
if (!process.env['VERCEL']) {
  app.listen(port, () => {
    console.log(`[ProviderIQ Server] Live & listening on http://localhost:${port}`);
    console.log(`[ProviderIQ Server] tRPC endpoints exposed at http://localhost:${port}/trpc`);
  });
}

export default app;
