import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/sw.js' || (req.url && req.url.startsWith('/sw.js?'))) {
          try {
            const fs = await import('fs');
            const swPath = path.resolve(import.meta.dirname, 'public/sw.js');
            if (fs.existsSync(swPath)) {
              const swContent = fs.readFileSync(swPath, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              res.setHeader('Service-Worker-Allowed', '/');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.end(swContent);
              return;
            }
          } catch (e) {
            console.error('Error serving sw.js:', e);
          }
        }

        if (req.url && req.url.startsWith('/api/')) {
          try {
            const { default: handler } = await import('./api/index.ts');

            // Polyfill response json helper if needed
            const customRes: any = res;
            if (!customRes.json) {
              customRes.json = function (obj: any) {
                this.setHeader('Content-Type', 'application/json; charset=utf-8');
                this.end(JSON.stringify(obj));
                return this;
              };
            }
            if (!customRes.status) {
              customRes.status = function (code: number) {
                this.statusCode = code;
                return this;
              };
            }

            if (req.method === 'POST' || req.method === 'PUT') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  (req as any).body = body ? JSON.parse(body) : {};
                } catch {
                  (req as any).body = {};
                }
                await handler(req as any, customRes);
              });
              return;
            }

            return await handler(req as any, customRes);
          } catch (error) {
            console.error('Middleware API Error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
