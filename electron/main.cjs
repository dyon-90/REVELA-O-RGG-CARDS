const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const express = require('express');
const fs = require('fs');

let mainWindow = null;
let serverInstance = null;
const PORT = 3456; // Local port for the embedded desktop server

// Determine userData directory for persistent videos and cards database in Windows
const userDataPath = app ? app.getPath('userData') : path.join(__dirname, '..', 'data_storage');
const uploadsDir = path.join(userDataPath, 'uploads');
const dataDir = path.join(userDataPath, 'data');
const dbFile = path.join(dataDir, 'cards_database.json');

// Ensure directories exist
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function startInternalServer() {
  const serverApp = express();
  const multer = require('multer');

  serverApp.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  serverApp.use(express.json({ limit: '500mb' }));
  serverApp.use(express.urlencoded({ extended: true, limit: '500mb' }));

  // Static uploads directory in Windows user folder
  serverApp.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      if (filePath.endsWith('.mp4')) res.setHeader('Content-Type', 'video/mp4');
      else if (filePath.endsWith('.webm')) res.setHeader('Content-Type', 'video/webm');
      else if (filePath.endsWith('.mov')) res.setHeader('Content-Type', 'video/quicktime');
      else if (filePath.endsWith('.ogg')) res.setHeader('Content-Type', 'video/ogg');
    }
  }));

  // Serve the frontend build
  const distDir = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distDir)) {
    serverApp.use(express.static(distDir));
  }

  // Multer disk storage for videos
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.mp4';
      const clean = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
      cb(null, `video-${unique}-${clean}${ext}`);
    }
  });
  const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

  // Database helper
  function readCards() {
    try {
      if (fs.existsSync(dbFile)) {
        return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  function writeCards(cards) {
    fs.writeFileSync(dbFile, JSON.stringify(cards, null, 2), 'utf8');
  }

  serverApp.get('/api/cards', (_req, res) => {
    res.json({ success: true, cards: readCards() });
  });

  serverApp.put('/api/cards', (req, res) => {
    const { cards } = req.body;
    if (Array.isArray(cards)) {
      writeCards(cards);
      return res.json({ success: true, count: cards.length });
    }
    res.status(400).json({ success: false, error: 'Cards inválidos' });
  });

  serverApp.post('/api/upload-video', upload.single('video'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum vídeo enviado' });
    }
    const videoUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      videoUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  });

  serverApp.get('/api/uploads', (_req, res) => {
    try {
      const files = fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.')).map(f => {
        const stat = fs.statSync(path.join(uploadsDir, f));
        return {
          filename: f,
          url: `/uploads/${f}`,
          size: stat.size,
          createdAt: stat.birthtime
        };
      });
      res.json({ success: true, files });
    } catch {
      res.json({ success: true, files: [] });
    }
  });

  serverApp.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      server: 'Electron Windows Desktop',
      storagePath: uploadsDir,
      dbPath: dbFile,
      totalVideosStored: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).length : 0
    });
  });

  // Fallback to index.html for SPA routing
  serverApp.get('*', (_req, res) => {
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send('Aguardando compilação do aplicativo (dist/index.html)...');
    }
  });

  return new Promise((resolve) => {
    serverInstance = serverApp.listen(PORT, '127.0.0.1', () => {
      console.log(`Desktop backend running at http://127.0.0.1:${PORT}`);
      resolve(PORT);
    });
  });
}

async function createWindow() {
  await startInternalServer();

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Revelação RGG Cards - Baralho Interativo',
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows local video blob & streaming
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (serverInstance) {
    serverInstance.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
