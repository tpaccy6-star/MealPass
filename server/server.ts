/**
 * Production-ready Express Server for NEXA MealPass Backend API
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { apiRouter } from './routes';
import { initDatabase } from './db';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'NEXA MealPass Backend',
    timestamp: new Date().toISOString(),
  });
});

// In production, serve the built frontend assets if dist folder exists
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(404).send('NEXA MealPass API Server running. Frontend build not yet generated.');
    }
  });
});

// Boot backend
export async function startServer() {
  console.log('🚀 Initializing NEXA MealPass Backend...');

  // Initialize Neon database if DATABASE_URL is set
  const dbInit = await initDatabase();
  console.log(`Database status: ${dbInit.message}`);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ NEXA MealPass Backend listening on http://0.0.0.0:${PORT}`);
  });

  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('Fatal error starting server:', err);
  });
}

export default app;
