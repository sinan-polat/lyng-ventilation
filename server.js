// =========================================================
// Air Plus ApS – lille webserver uden eksterne pakker
//  - Viser hjemmesiden fra mappen /docs
//  - POST /api/chat     -> chatbot (sender videre til Claude)
//  - POST /api/kontakt  -> gemmer tilbudsforespørgsler i data/henvendelser.jsonl
//
// Start:  npm start   (kræver Node.js 20.6 eller nyere)
// =========================================================

import http from 'node:http';
import { readFile, appendFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYSTEM_PROMPT } from './prompt.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'docs');
const DATA_DIR = path.join(__dirname, 'data');

const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-5-5';
const MAX_TOKENS = Number(process.env.CLAUDE_MAX_TOKENS) || 1024;

// Simpel beskyttelse mod misbrug: maks. antal chat-beskeder pr. IP pr. tidsrum
const RATE_LIMIT = Number(process.env.CHAT_RATE_LIMIT) || 30;     // beskeder
const RATE_WINDOW_MS = 10 * 60 * 1000;                             // 10 minutter
const MAX_MESSAGE_CHARS = 2000;
const MAX_TURNS = 20;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

// ---------- Hjælpefunktioner ----------
function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readBody(req, limitBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limitBytes) { reject(Object.assign(new Error('Body too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (typeof fwd === 'string' && fwd.split(',')[0].trim()) || req.socket.remoteAddress || 'ukendt';
}

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_LIMIT) { hits.set(ip, list); return true; }
  list.push(now);
  hits.set(ip, list);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) if (!list.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(ip);
}, RATE_WINDOW_MS).unref();

// Renser og validerer samtalen fra browseren
function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  let msgs = raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_CHARS) }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_TURNS);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  // Slå beskeder fra samme afsender sammen (API'et vil have skiftevis bruger/assistent)
  const merged = [];
  for (const m of msgs) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += '\n\n' + m.content;
    else merged.push({ ...m });
  }
  if (!merged.length || merged[merged.length - 1].role !== 'user') return null;
  return merged;
}

// ---------- /api/chat ----------
async function handleChat(req, res) {
  if (!API_KEY) return sendJson(res, 503, { error: 'Chatten er ikke sat op (mangler ANTHROPIC_API_KEY).' });
  if (rateLimited(clientIp(req))) return sendJson(res, 429, { error: 'For mange beskeder. Prøv igen om lidt.' });

  let body;
  try { body = await readBody(req); } catch (e) { return sendJson(res, e.status || 400, { error: 'Ugyldig forespørgsel.' }); }
  const messages = cleanMessages(body.messages);
  if (!messages) return sendJson(res, 400, { error: 'Ugyldig samtale.' });

  const abort = new AbortController();
  res.on('close', () => { if (!res.writableEnded) abort.abort(); });

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages,
        stream: true
      }),
      signal: abort.signal
    });
  } catch (err) {
    if (abort.signal.aborted) return;
    console.error('[chat] Kunne ikke kontakte Claude:', err.message);
    return sendJson(res, 502, { error: 'Kunne ikke kontakte assistenten.' });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    console.error(`[chat] Fejl fra Claude (${upstream.status}):`, detail.slice(0, 500));
    return sendJson(res, 502, { error: 'Assistenten svarede ikke korrekt.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Accel-Buffering': 'no'
  });

  // Læs server-sent events fra Claude og send kun teksten videre
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        for (const line of event.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          let data;
          try { data = JSON.parse(json); } catch { continue; }
          if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
            res.write(data.delta.text);
          } else if (data.type === 'error') {
            console.error('[chat] Stream-fejl:', data.error);
          }
        }
      }
    }
  } catch (err) {
    if (!abort.signal.aborted) console.error('[chat] Stream afbrudt:', err.message);
  }
  res.end();
}

// ---------- /api/kontakt ----------
async function handleContact(req, res) {
  let body;
  try { body = await readBody(req, 16 * 1024); } catch (e) { return sendJson(res, e.status || 400, { error: 'Ugyldig forespørgsel.' }); }

  // Honeypot: bots udfylder det skjulte felt – lad som om alt gik godt
  if (body.website) return sendJson(res, 200, { ok: true });

  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const entry = {
    modtaget: new Date().toISOString(),
    ydelse: str(body.service, 100),
    bygning: str(body.building, 100),
    besked: str(body.message, 1500),
    navn: str(body.name, 100),
    telefon: str(body.phone, 30),
    email: str(body.email, 150),
    postnr: str(body.zip, 10)
  };
  if (!entry.navn || entry.telefon.replace(/\D/g, '').length < 8) {
    return sendJson(res, 400, { error: 'Navn og telefonnummer mangler.' });
  }

  try {
    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(path.join(DATA_DIR, 'henvendelser.jsonl'), JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    console.error('[kontakt] Kunne ikke gemme:', err.message);
    return sendJson(res, 500, { error: 'Kunne ikke gemme forespørgslen.' });
  }
  console.log(`[kontakt] Ny forespørgsel: ${entry.navn}, ${entry.telefon}, ${entry.ydelse}`);
  // TODO: send også en e-mail til firmaet her (fx via nodemailer eller en e-mailtjeneste)
  sendJson(res, 200, { ok: true });
}

// ---------- Statiske filer ----------
async function serveStatic(req, res) {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    res.writeHead(403); return res.end('Forbidden');
  }
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('not file');
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Siden findes ikke');
  }
}

// ---------- Server ----------
const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://x');
    if (pathname === '/api/chat') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Brug POST.' });
      return await handleChat(req, res);
    }
    if (pathname === '/api/kontakt') {
      if (req.method !== 'POST') return sendJson(res, 405, { error: 'Brug POST.' });
      return await handleContact(req, res);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    return await serveStatic(req, res);
  } catch (err) {
    console.error('Uventet fejl:', err);
    if (!res.headersSent) sendJson(res, 500, { error: 'Serverfejl.' });
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`\n  Air Plus kører på  http://localhost:${PORT}`);
  console.log(API_KEY
    ? `  Chatbot: aktiv (model: ${MODEL})\n`
    : '  Chatbot: IKKE aktiv – tilføj ANTHROPIC_API_KEY i .env-filen\n');
});
