#!/usr/bin/env node
/*
  Local static server with CORS headers for testing the offline AI site and 2GB knowledge packs.
  Usage from the project folder:
    node tools/server.js 8080
  Then open:
    http://localhost:8080
*/
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2] || 8080);
const root = path.resolve(process.cwd());
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jsonl': 'application/x-ndjson; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const clean = decoded === '/' ? '/index.html' : decoded;
  const out = path.resolve(root, '.' + clean);
  if (!out.startsWith(root)) return null;
  return out;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Accept-Ranges', 'bytes');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end('Method not allowed');
    return;
  }

  const filePath = safePath(req.url || '/');
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const stat = fs.statSync(filePath);
  const contentType = mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : stat.size - 1;
      if (start <= end && end < stat.size) {
        res.writeHead(206, {
          'Content-Type': contentType,
          'Content-Length': end - start + 1,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`
        });
        if (req.method === 'HEAD') return res.end();
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
    }
  }

  res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': stat.size });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`Offline AI local server: http://localhost:${port}`);
  console.log(`Root: ${root}`);
});
