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

// Storage path for uploads and database
const uploadsDir = path.resolve(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch {}
}

const cardsDbPath = path.resolve(__dirname, 'data', 'cards.json');
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch {}
}

// Cards API
app.get('/api/cards', (req, res) => {
  try {
    if (fs.existsSync(cardsDbPath)) {
      const data = JSON.parse(fs.readFileSync(cardsDbPath, 'utf8'));
      return res.json({ cards: data });
    }
    return res.json({ cards: null });
  } catch {
    return res.json({ cards: null });
  }
});

app.put('/api/cards', (req, res) => {
  try {
    const { cards } = req.body || {};
    if (Array.isArray(cards)) {
      fs.writeFileSync(cardsDbPath, JSON.stringify(cards, null, 2), 'utf8');
      return res.json({ success: true, count: cards.length });
    }
    return res.status(400).json({ success: false, error: 'Invalid cards array' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Uploads listing API
app.get('/api/uploads', (req, res) => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ files: [] });
    }
    const files = fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.'));
    const details = files.map(file => {
      const stat = fs.statSync(path.join(uploadsDir, file));
      return {
        filename: file,
        url: `/uploads/${file}`,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        modifiedAt: stat.mtime.toISOString(),
      };
    });
    return res.json({ files: details });
  } catch {
    return res.json({ files: [] });
  }
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
