import { createServer } from 'node:http';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadEntries, validateEntries } from './lib/content.mjs';
import { login, diary } from './lib/views.mjs';
const digest = value => createHash('sha256').update(value).digest();
const ttl = 7 * 24 * 60 * 60 * 1000;
export async function createDiaryServer(options = {}) {
  const production = options.production ?? process.env.NODE_ENV === 'production';
  const password = options.password ?? process.env.DIARY_PASSWORD;
  const origin = options.origin ?? process.env.PUBLIC_ORIGIN;
  if (!password || password.length < 16 || password.length > 256) throw new Error('Set DIARY_PASSWORD privately (16–256 characters).');
  if (production && (!origin || new URL(origin).origin !== origin || !origin.startsWith('https://'))) throw new Error('Set PUBLIC_ORIGIN to the exact HTTPS website origin.');
  const entries = validateEntries(options.entries ?? await loadEntries());
  const css = await readFile(new URL('./public/style.css', import.meta.url));
  const sessions = new Map();
  // Global limiter deliberately does not trust client-provided forwarding headers.
  // Single-process deployment: 30 attempts per minute, plus 8 per network peer.
  let attempts = 0, windowStart = Date.now();
  const peers = new Map();
  const cookieName = production ? '__Host-anna_session' : 'anna_session';
  const cookie = (value, age) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${production ? '; Secure' : ''}`;
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Normal browser form POSTs can send Origin: null under no-referrer.
    // Keep same-origin form metadata, but disclose no referrer cross-origin.
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
    if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    const send = (code, body, type = 'text/html; charset=utf-8') => { res.writeHead(code, {'Content-Type': type}); res.end(body); };
    const redirect = () => { res.writeHead(303, {Location: '/'}); res.end(); };
    try {
      const url = new URL(req.url, 'http://local');
      const now = Date.now();
      for (const [key, session] of sessions) if (session.expires <= now) sessions.delete(key);
      const token = (req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
      const session = token && sessions.get(token);
      if (req.method === 'GET' && url.pathname === '/healthz') return send(200, 'ok', 'text/plain');
      if (req.method === 'GET' && url.pathname === '/style.css') return send(200, css, 'text/css; charset=utf-8');
      if (req.method === 'GET' && url.pathname === '/robots.txt') return send(200, 'User-agent: *\nDisallow: /\n', 'text/plain');
      if (req.method === 'GET' && url.pathname === '/') return send(200, session ? diary(entries, session.csrf) : login());
      if (req.method === 'POST' && ['/login', '/logout'].includes(url.pathname)) {
        const expectedOrigin = origin || `http://${req.headers.host}`;
        let sourceOrigin = req.headers.origin;
        // Only use Referer when Origin is absent, never to override null or a
        // mismatched Origin. Forwarded headers are deliberately not trusted.
        if (sourceOrigin === undefined && req.headers.referer) {
          try { sourceOrigin = new URL(req.headers.referer).origin; } catch { /* Reject below. */ }
        }
        if (sourceOrigin !== expectedOrigin) return send(403, 'Please reload the diary home page and try again from there.');
        if (!(req.headers['content-type'] || '').startsWith('application/x-www-form-urlencoded')) return send(415, 'Unsupported form format.');
        let body = '', size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > 4096) { send(413, 'The form is too large.'); return; } body += chunk.toString(); }
        const form = new URLSearchParams(body);
        if (url.pathname === '/logout') {
          if (!session || form.get('csrf') !== session.csrf) return send(403, 'Your request has expired. Please refresh the page.');
          sessions.delete(token); res.setHeader('Set-Cookie', cookie('', 0)); return redirect();
        }
        if (now - windowStart > 60000) { attempts = 0; peers.clear(); windowStart = now; }
        const peer = req.socket.remoteAddress;
        const count = (peers.get(peer) || 0) + 1;
        peers.set(peer, count); attempts++;
        if (attempts > 30 || count > 8) { res.setHeader('Retry-After','60'); return send(429, login('Too many tries. Please wait one minute and try again.')); }
        const candidate = form.get('password') || '';
        if (candidate.length > 256 || !timingSafeEqual(digest(candidate), digest(password))) return send(401, login('That password doesn’t look right. Give it another try.'));
        if (sessions.size >= 5000) return send(503, login('The diary is a little busy. Please try again shortly.'));
        if (token) sessions.delete(token);
        const newToken = randomBytes(32).toString('hex');
        sessions.set(newToken, {expires: now + ttl, csrf: randomBytes(24).toString('hex')});
        res.setHeader('Set-Cookie', cookie(newToken, ttl / 1000)); return redirect();
      }
      // No general static-file serving: source, drafts and JSON are never exposed.
      return send(404, 'There is no story on this page.');
    } catch { if (!res.headersSent) send(500, 'The diary is unavailable for a moment. Please try again shortly.'); else res.end(); }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const server = await createDiaryServer();
    const port = Number(process.env.PORT || 3000);
    server.listen(port, process.env.HOST || '0.0.0.0', () => console.log(`Anna diary listening on port ${port}`));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
