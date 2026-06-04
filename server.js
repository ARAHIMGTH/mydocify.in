/**
 * Production Static Server for Cloud Run / Node.js Hostings
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve compiled static files from dist/
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback all routes to SPA index.html for React router
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on http://0.0.0.0:${PORT}`);
});
