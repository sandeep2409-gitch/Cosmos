import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import healthRoutes from './routes/healthRoutes.js';
import objectRoutes from './routes/objectRoutes.js';
import wikiRoutes from './routes/wikiRoutes.js';

/**
 * COSMOS Node.js + Express API Backend Server (Segment 6 Wikipedia Integration)
 */
const app = express();

// 1. Configure Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(requestLogger);

// 2. Register API v1 Versioned Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1', objectRoutes);
app.use('/api/v1', wikiRoutes);

// 3. Fallback Route & Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// 4. Start Server on Configurable Port
const server = app.listen(ENV.PORT, () => {
  console.log(`================================================`);
  console.log(`🚀 COSMOS Backend API running on port ${ENV.PORT}`);
  console.log(`📡 Health Check: http://localhost:${ENV.PORT}/api/v1/health`);
  console.log(`🌌 Objects API:  http://localhost:${ENV.PORT}/api/v1/objects`);
  console.log(`📚 Wikipedia:    http://localhost:${ENV.PORT}/api/v1/wikipedia/earth`);
  console.log(`================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`ℹ COSMOS Express API is active on port ${ENV.PORT}: http://localhost:${ENV.PORT}/api/v1/health`);
  } else {
    console.error('Express Server error:', err);
  }
});
