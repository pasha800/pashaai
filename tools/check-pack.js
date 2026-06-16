#!/usr/bin/env node
/*
  Validates knowledge-pack/manifest.json and its JSONL chunks.
  Usage:
    node tools/check-pack.js knowledge-pack/manifest.json
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const manifestPath = process.argv[2] || 'knowledge-pack/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const base = path.dirname(path.resolve(manifestPath));
let docs = 0;
let bytes = 0;
for (const chunk of manifest.chunks || []) {
  const file = path.resolve(base, chunk.url || chunk.href || chunk.path);
  const data = fs.readFileSync(file);
  bytes += data.length;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  if (chunk.sha256 && hash !== chunk.sha256) throw new Error(`SHA mismatch: ${chunk.url}`);
  const lines = data.toString('utf8').split(/\r?\n/).filter(Boolean);
  for (const line of lines) JSON.parse(line);
  docs += lines.length;
}
console.log(`OK: ${docs} docs, ${bytes} bytes, ${(manifest.chunks || []).length} chunks`);
