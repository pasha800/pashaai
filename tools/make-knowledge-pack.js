#!/usr/bin/env node
/*
  Usage:
    node tools/make-knowledge-pack.js input.jsonl knowledge-pack "My 2GB Pack" 104857600

  input.jsonl must contain one JSON object per line:
    {"id":"...","title":"...","category":"...","question":"...","aliases":[...],"answer":"...","content":"...","tags":[...]}
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const input = process.argv[2];
const outDir = process.argv[3] || 'knowledge-pack';
const name = process.argv[4] || 'General Knowledge Pack';
const maxBytes = Number(process.argv[5] || 100 * 1024 * 1024);

if (!input) {
  console.error('Usage: node tools/make-knowledge-pack.js input.jsonl knowledge-pack "Pack Name" 104857600');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
let chunkIndex = 1;
let currentBytes = 0;
let currentPath = '';
let currentStream = null;
let currentHash = null;
const chunks = [];

function openChunk() {
  currentPath = path.join(outDir, `chunk-${String(chunkIndex).padStart(4, '0')}.jsonl`);
  currentStream = fs.createWriteStream(currentPath);
  currentHash = crypto.createHash('sha256');
  currentBytes = 0;
}

function closeChunk() {
  return new Promise((resolve) => {
    if (!currentStream) return resolve();
    currentStream.end(() => {
      chunks.push({
        url: path.basename(currentPath),
        bytes: currentBytes,
        sha256: currentHash.digest('hex')
      });
      chunkIndex += 1;
      currentStream = null;
      resolve();
    });
  });
}

(async () => {
  openChunk();
  const rl = readline.createInterface({ input: fs.createReadStream(input, { encoding: 'utf8' }), crlfDelay: Infinity });
  let docs = 0;
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    JSON.parse(trimmed); // validate
    const data = Buffer.from(trimmed + '\n', 'utf8');
    if (currentBytes > 0 && currentBytes + data.length > maxBytes) {
      await closeChunk();
      openChunk();
    }
    currentStream.write(data);
    currentHash.update(data);
    currentBytes += data.length;
    docs += 1;
  }
  if (currentBytes > 0) await closeChunk();
  const manifest = {
    name,
    version: new Date().toISOString().slice(0, 10),
    format: 'jsonl-offline-ai-v1',
    totalDocs: docs,
    totalBytes: chunks.reduce((sum, c) => sum + c.bytes, 0),
    chunks
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Created ${chunks.length} chunk(s), ${docs} docs, ${manifest.totalBytes} bytes`);
})();
