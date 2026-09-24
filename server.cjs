const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Paths to dist and public
const distPath = path.resolve(__dirname, 'dist');
const publicPath = path.resolve(__dirname, 'public');

// Serve static files from dist if it exists, otherwise public
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1d' }));
}
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Fallback for SPA (Single Page Application) routing
app.get('*', (req, res) => {
  const distIndex = path.join(distPath, 'index.html');
  const rootIndex = path.resolve(__dirname, 'index.html');

  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  } else if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  } else {
    res.status(404).send('Application build not found. Please run "npm run build" first.');
  }
});

let server = null;
// Only start listening if not being imported by another server script
if (require.main === module || !module.parent || process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hostinger / Node.js] Server listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Hostinger] Port ${PORT} already in use, app will proceed if bound by LiteSpeed.`);
    } else {
      console.error('[Hostinger] Server error:', err);
    }
  });
}

module.exports = { app, server };
