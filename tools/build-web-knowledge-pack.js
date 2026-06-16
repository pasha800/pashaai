#!/usr/bin/env node
/*
  Build a TEXT-ONLY 2GB offline knowledge pack from Wikipedia API extracts.
  No images, videos, HTML, CSS, scripts, or binary files are stored: only plaintext JSONL.

  Usage from project folder:
    node tools/build-web-knowledge-pack.js knowledge-pack 2 ckb,ar,en 104857600

  Args:
    1) output directory         default: knowledge-pack
    2) target GB of text        default: 2
    3) languages               default: ckb,ar,en
    4) chunk bytes             default: 104857600 (100MB)

  Requirements:
    Node.js 18+ for native fetch.
*/
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const outDir = process.argv[2] || 'knowledge-pack';
const targetGb = Math.max(0.01, Number(process.argv[3] || 2));
const languages = String(process.argv[4] || 'ckb,ar,en')
  .split(/[ ,،]+/)
  .map((x) => normalizeLang(x))
  .filter(Boolean);
const maxChunkBytes = Math.max(1024 * 1024, Number(process.argv[5] || 100 * 1024 * 1024));
const targetBytes = Math.floor(targetGb * 1024 * 1024 * 1024);
const minExtractChars = Number(process.env.MIN_EXTRACT_CHARS || 350);
const apiLimit = Math.max(1, Math.min(20, Number(process.env.WIKI_BATCH || 20)));
const pauseMs = Math.max(50, Number(process.env.PAUSE_MS || 350));

if (!globalThis.fetch) {
  console.error('Node.js 18+ is required because this script uses native fetch.');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

let chunkIndex = 1;
let currentPath = '';
let currentStream = null;
let currentHash = null;
let currentBytes = 0;
let totalBytes = 0;
let docs = 0;
let stopped = false;
const chunks = [];
const seen = new Set();

process.on('SIGINT', async () => {
  stopped = true;
  console.log('\nStopping after current request...');
});

function normalizeLang(lang) {
  const value = String(lang || '').trim().toLowerCase();
  if (!value) return '';
  if (value === 'ku' || value === 'kur') return 'ckb';
  return value.replace(/[^a-z0-9-]/g, '') || '';
}

function cleanText(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sentenceIntro(text, maxChars = 700) {
  const cleaned = cleanText(text).replace(/\s+/g, ' ');
  const parts = cleaned.split(/(?<=[.!؟。؛])\s+/).filter(Boolean);
  const intro = parts.slice(0, 3).join(' ');
  return (intro || cleaned).slice(0, maxChars).trim();
}

function openChunk() {
  currentPath = path.join(outDir, `chunk-${String(chunkIndex).padStart(4, '0')}.jsonl`);
  currentStream = fs.createWriteStream(currentPath, { encoding: 'utf8' });
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

async function writeDoc(doc) {
  const line = JSON.stringify(doc) + '\n';
  const bytes = Buffer.byteLength(line, 'utf8');
  if (!currentStream) openChunk();
  if (currentBytes > 0 && currentBytes + bytes > maxChunkBytes) {
    await closeChunk();
    openChunk();
  }
  currentStream.write(line);
  currentHash.update(line, 'utf8');
  currentBytes += bytes;
  totalBytes += bytes;
  docs += 1;
}

function makeDoc(page, lang) {
  const title = cleanText(page.title);
  const extract = cleanText(page.extract);
  if (!title || extract.length < minExtractChars) return null;
  const id = `wiki-${lang}-${page.pageid || crypto.createHash('sha1').update(title + extract).digest('hex').slice(0, 16)}`;
  if (seen.has(id)) return null;
  seen.add(id);
  return {
    id,
    title,
    category: `زانیاریی گشتی / Wikipedia ${lang}`,
    question: `${title} چییە؟`,
    aliases: [title, `${title} چیە`, `what is ${title}`, `ما هو ${title}`],
    answer: sentenceIntro(extract),
    content: extract.slice(0, 50000),
    tags: ['زانیاریی گشتی', 'Wikipedia', lang, title],
    priority: 1,
    sourcePack: 'text-only-web-pack',
    learnedFrom: 'wikipedia-plaintext-api',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function fetchRandomPages(lang) {
  const url = `https://${lang}.wikipedia.org/w/api.php?origin=*&action=query&format=json&generator=random&grnnamespace=0&grnlimit=${apiLimit}&prop=extracts|info&explaintext=1&exintro=0&inprop=url`;
  const res = await fetch(url, { headers: { 'User-Agent': 'OfflineTextKnowledgePackBuilder/1.0' } });
  if (!res.ok) throw new Error(`${lang} Wikipedia HTTP ${res.status}`);
  const data = await res.json();
  return Object.values((data.query && data.query.pages) || {})
    .map((page) => makeDoc(page, lang))
    .filter(Boolean);
}

function writeManifest(status = 'complete') {
  const manifest = {
    name: `Text-only General Knowledge Pack ${targetGb}GB`,
    version: new Date().toISOString().slice(0, 10),
    language: languages.join(','),
    format: 'jsonl-offline-ai-v1',
    textOnly: true,
    status,
    totalDocs: docs,
    totalBytes: chunks.reduce((sum, c) => sum + c.bytes, 0),
    chunks
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

(async () => {
  console.log(`Building text-only knowledge pack in: ${outDir}`);
  console.log(`Target: ${(targetBytes / 1024 / 1024 / 1024).toFixed(2)}GB | Languages: ${languages.join(', ')} | Chunk: ${(maxChunkBytes / 1024 / 1024).toFixed(1)}MB`);
  openChunk();
  let round = 0;
  while (!stopped && totalBytes < targetBytes) {
    round += 1;
    for (const lang of languages) {
      if (stopped || totalBytes >= targetBytes) break;
      try {
        const pages = await fetchRandomPages(lang);
        for (const doc of pages) {
          if (totalBytes >= targetBytes) break;
          await writeDoc(doc);
        }
        const pct = Math.min(100, (totalBytes / targetBytes) * 100).toFixed(2);
        process.stdout.write(`\r${pct}% | ${docs} docs | ${(totalBytes / 1024 / 1024).toFixed(1)}MB | round ${round}     `);
      } catch (err) {
        console.error(`\n${lang}: ${err.message}`);
      }
      await sleep(pauseMs);
    }
  }
  if (currentBytes > 0) await closeChunk();
  writeManifest(stopped ? 'partial' : 'complete');
  console.log(`\nDone. ${docs} docs, ${(totalBytes / 1024 / 1024 / 1024).toFixed(3)}GB, ${chunks.length} chunk(s).`);
  console.log(`Manifest: ${path.join(outDir, 'manifest.json')}`);
})();
