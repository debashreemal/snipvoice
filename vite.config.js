import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Local dev plugin that executes /api serverless functions directly in Vite.
 * Gives instant dev reload without Vercel CLI symlink or port conflicts on Windows.
 */
function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev-plugin',
    configureServer(server) {
      // Load environment variables into process.env so /api endpoints can access GROQ_API_KEY, SUPABASE_URL, etc.
      const env = loadEnv('', process.cwd(), '');
      Object.assign(process.env, env);

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next();
        }

        const urlPath = req.url.split('?')[0];
        const cleanName = urlPath.replace(/^\/api\/?/, '').replace(/\.js$/, '');
        const filePath = path.resolve(process.cwd(), 'api', `${cleanName}.js`);

        if (!fs.existsSync(filePath)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Not found: ${urlPath}` }));
          return;
        }

        // Parse JSON body for application/json POST/PUT requests (leave multipart streams untouched)
        const contentType = req.headers['content-type'] || '';
        let body = {};
        if (req.method !== 'GET' && req.method !== 'HEAD' && contentType.includes('application/json')) {
          try {
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const raw = Buffer.concat(chunks).toString('utf-8');
            if (raw && raw.trim()) {
              body = JSON.parse(raw);
            }
          } catch {
            body = {};
          }
        }

        req.body = body;
        req.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);

        // Vercel serverless compatible res.status().json() helpers
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };

        try {
          const mod = await server.ssrLoadModule(filePath);
          const handler = mod.default || mod;
          if (typeof handler === 'function') {
            const result = await handler(req, res);
            if (result instanceof Response && !res.writableEnded) {
              res.statusCode = result.status;
              result.headers.forEach((val, key) => res.setHeader(key, val));
              const text = await result.text();
              res.end(text);
            }
          } else {
            res.status(500).json({ error: `Module ${cleanName} does not export a default handler` });
          }
        } catch (err) {
          console.error(`[API Dev Error] in ${urlPath}:`, err);
          res.status(500).json({ error: err.message || 'Internal Server Error' });
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), vercelApiDevPlugin()],
  server: {
    port: 5173
  }
});
