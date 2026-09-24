import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function devApiPlugin() {
  return {
    name: 'dev-api-middleware',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url === '/api/uploads') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ files: [] }));
          return;
        }
        if (req.url === '/api/cards') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ cards: null }));
          return;
        }
        if (req.url === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', server: 'vite-dev', totalVideosStored: 0 }));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
