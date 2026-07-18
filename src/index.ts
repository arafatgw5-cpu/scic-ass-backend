import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

// Only listen if we are not in a serverless environment (like Vercel).
// (DB connection itself is now guaranteed per-request via the middleware
// in app.ts, so this is just for local/dev `npm run dev` usage.)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to DB, server not started:', err);
    });
} else {
  // Serverless: kick off an early connection attempt so the first
  // request doesn't always pay the full connect cost, though the
  // app.ts middleware is what actually guarantees readiness.
  connectDB().catch(console.error);
}

// Export for Vercel serverless functions
export default app;