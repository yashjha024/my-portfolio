// Vercel serverless entry point: the whole Express API runs as one function.
// vercel.json rewrites /api/*, /sitemap.xml and /rss.xml here; Vercel keeps the original
// request path in req.url, so Express routes match exactly as they do under `node server.js`.
import app from '../server/src/app.js';

export default app;
