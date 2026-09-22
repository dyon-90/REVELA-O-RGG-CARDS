import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data and uploads directories exist in the project root
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
const DB_FILE = path.join(DATA_DIR, 'cards_database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initial cards seeds
const DEFAULT_CARDS = [
  {
    id: 'card-1',
    rank: 'A',
    suit: 'spades',
    title: 'Ás de Espadas',
    subtitle: 'Chamas da Noite',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    videoType: 'direct',
    isLit: false,
    accentColor: '#f59e0b',
    createdAt: 1,
  },
  {
    id: 'card-2',
    rank: 'K',
    suit: 'hearts',
    title: 'Rei de Copas',
    subtitle: 'Oceano e Vento',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoType: 'direct',
    isLit: false,
    accentColor: '#ef4444',
    createdAt: 2,
  },
  {
    id: 'card-3',
    rank: 'Q',
    suit: 'diamonds',
    title: 'Dama de Ouros',
    subtitle: 'Viagem Cinematográfica',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    videoType: 'direct',
    isLit: false,
    accentColor: '#eab308',
    createdAt: 3,
  },
  {
    id: 'card-4',
    rank: 'J',
    suit: 'clubs',
    title: 'Valete de Paus',
    subtitle: 'Horizonte Aberto',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    videoType: 'direct',
    isLit: false,
    accentColor: '#10b981',
    createdAt: 4,
  },
  {
    id: 'card-5',
    rank: '10',
    suit: 'hearts',
    title: 'Dez de Copas',
    subtitle: 'Lareira Aconchegante',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    videoType: 'direct',
    isLit: false,
    accentColor: '#f97316',
    createdAt: 5,
  },
  {
    id: 'card-6',
    rank: '★',
    suit: 'special',
    title: 'Coringa do Baralho',
    subtitle: 'Celeridade & Destino',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    videoType: 'direct',
    isLit: false,
    accentColor: '#8b5cf6',
    createdAt: 6,
  },
];

// Helper to read and write database
function getCards(): any[] {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_CARDS, null, 2), 'utf-8');
      return DEFAULT_CARDS;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CARDS;
  } catch (err) {
    console.error('Error reading cards database file:', err);
    return DEFAULT_CARDS;
  }
}

function saveCards(cards: any[]): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(cards, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving cards database file:', err);
    return false;
  }
}

// Ensure database file is initialized on start
getCards();

// Express configuration
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving with proper video MIME types, CORS, and byte-range support
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (filePath.endsWith('.webm')) {
        res.setHeader('Content-Type', 'video/webm');
      } else if (filePath.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/quicktime');
      } else if (filePath.endsWith('.ogg') || filePath.endsWith('.ogv')) {
        res.setHeader('Content-Type', 'video/ogg');
      }
    },
  })
);

// Setup multer storage for persistent video uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    cb(null, `video-${uniqueSuffix}-${cleanName}${ext.startsWith('.') ? '' : '.' + ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300MB max per video file
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-matroska'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.mp4', '.webm', '.mov', '.ogg', '.ogv', '.mkv'];

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de vídeo (.mp4, .webm, .mov, .ogg) são permitidos.'));
    }
  },
});

// API Routes

// 1. Get all cards from server database
app.get('/api/cards', (_req: Request, res: Response) => {
  const cards = getCards();
  res.json({ success: true, cards });
});

// 2. Save / Sync entire cards list
app.put('/api/cards', (req: Request, res: Response) => {
  const { cards } = req.body;
  if (!Array.isArray(cards)) {
    return res.status(400).json({ error: 'Payload must contain a "cards" array.' });
  }
  const saved = saveCards(cards);
  if (saved) {
    res.json({ success: true, count: cards.length });
  } else {
    res.status(500).json({ error: 'Erro ao salvar no banco de dados do servidor.' });
  }
});

// 3. Upload video to local server storage
app.post('/api/upload-video', (req: Request, res: Response) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'Erro durante o upload do vídeo.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo de vídeo foi enviado.' });
    }

    // The public URL accessible by clients
    const videoUrl = `/uploads/${req.file.filename}`;

    // If cardId is provided in form-data, link it immediately in cards_database.json
    const cardId = req.body.cardId;
    if (cardId) {
      const cards = getCards();
      const cardIndex = cards.findIndex((c: any) => c.id === cardId);
      if (cardIndex !== -1) {
        cards[cardIndex].videoUrl = videoUrl;
        cards[cardIndex].videoType = 'direct';
        cards[cardIndex].videoBlobKey = undefined;
        saveCards(cards);
      }
    }

    return res.json({
      success: true,
      videoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      message: 'Vídeo gravado com sucesso no servidor.',
    });
  });
});

// 4. List all stored videos on server
app.get('/api/uploads', (_req: Request, res: Response) => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return res.json({ success: true, files: [] });
    }
    const files = fs.readdirSync(UPLOADS_DIR);
    const details = files
      .filter((f) => !f.startsWith('.'))
      .map((fileName) => {
        const fullPath = path.join(UPLOADS_DIR, fileName);
        const stats = fs.statSync(fullPath);
        return {
          filename: fileName,
          url: `/uploads/${fileName}`,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

    return res.json({ success: true, files: details, count: details.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete a stored video
app.delete('/api/uploads/:filename', (req: Request, res: Response) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true, message: `Vídeo ${filename} removido do servidor.` });
    }
    return res.status(404).json({ success: false, error: 'Arquivo não encontrado no servidor.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Server health & storage info
app.get('/api/health', (_req: Request, res: Response) => {
  const uploadsCount = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR).length : 0;
  res.json({
    status: 'online',
    server: 'Hostinger Node.js / Express Storage',
    storagePath: UPLOADS_DIR,
    databaseFile: DB_FILE,
    totalVideosStored: uploadsCount,
    timestamp: new Date().toISOString(),
  });
});

// Mount Vite in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (Node.js persistent backend for Hostinger)`);
  });
}

startServer();
