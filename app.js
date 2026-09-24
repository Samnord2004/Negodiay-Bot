// Entry point for Beget Virtual Hosting (Phusion Passenger / Node.js)
// Automatically imports and starts the production server bundle
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

import('./dist/server.cjs').catch((err) => {
  console.error('[Beget Startup Error]:', err);
  process.exit(1);
});
