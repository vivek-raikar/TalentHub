// TalentHub - campus placement management system.
// Layers: routers (HTTP) -> services (business rules) -> repositories (SQL) -> db (SQLite).
const express = require('express');
const path = require('path');
const db = require('./src/db');
const schema = require('./src/schema');
const seed = require('./src/seed');
const { authenticate } = require('./src/auth');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '127.0.0.1'; // only reachable from this computer

async function main() {
  const fresh = await db.init();
  if (fresh) {
    db.exec(schema);
    seed();
    console.log('Created a new database with demo data.');
  }

  const app = express();
  app.disable('x-powered-by');

  app.use((_req, res, next) => {
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  app.use(express.json({ limit: '50kb' }));
  app.use('/api', authenticate);
  app.use('/api', require('./src/routers/authRouter'));
  app.use('/api/student', require('./src/routers/studentRouter'));
  app.use('/api/company', require('./src/routers/companyRouter'));
  app.use('/api/coordinator', require('./src/routers/coordinatorRouter'));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

  app.use(express.static(path.join(__dirname, 'public')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
    console.error(err);
    if (/constraint/i.test(err.message || '')) return res.status(400).json({ error: 'That change violates a data rule.' });
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  app.listen(PORT, HOST, () => {
    console.log(`\nTalentHub is running:  http://localhost:${PORT}\n`);
    console.log('Demo logins (password for all: ' + seed.DEMO_PASSWORD + ')');
    console.log('  Coordinator: coordinator@talenthub.test');
    console.log('  Student:     rahul@talenthub.test  (or priya@, arjun@, sneha@, kiran@)');
    console.log('  Company:     abc@talenthub.test    (or xyz@)\n');
    console.log('Press Ctrl+C to stop.');
  });
}

main().catch(err => { console.error('Failed to start:', err); process.exit(1); });
