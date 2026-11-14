const express = require('express');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { getDb } = require('../database/connection');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// ── Coleta (pública, anônima) ─────────────────────────────────────────────────
// Privacidade/LGPD: não grava IP, não usa cookie, não identifica a pessoa.
// Guarda só: página, de qual site veio (apenas o domínio), tipo de aparelho e tempo.
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|curl|wget|python|httpclient|monitor|facebookexternalhit/i;
const UUID = /^[a-f0-9-]{36}$/i;
const PATH_OK = /^\/[A-Za-z0-9\-_/.%[\]]{0,150}$/;

const deviceOf = ua => /tablet|ipad/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'celular' : 'computador';
const hostOf = ref => { try { return new URL(ref).hostname.replace(/^www\./, '').slice(0, 80); } catch { return ''; } };

router.post('/collect', express.text({ type: '*/*', limit: '2kb' }), (req, res) => {
  const ua = (req.headers['user-agent'] || '').slice(0, 300);
  if (!ua || BOT.test(ua)) return res.status(204).end();

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { return res.status(400).end(); } }
  if (!b || typeof b !== 'object' || !UUID.test(b.sid || '')) return res.status(400).end();

  const db = getDb();
  try {
    if (b.t === 'view') {
      const path = String(b.path || '');
      if (!PATH_OK.test(path) || path.startsWith('/admin')) return res.status(204).end();
      const n = db.prepare('SELECT COUNT(*) AS c FROM page_views WHERE session_id = ?').get(b.sid).c;
      if (n >= 300) return res.status(204).end(); // proteção contra spam numa sessão
      const ref = hostOf(String(b.ref || ''));
      const id = uuidv4();
      db.prepare('INSERT INTO page_views (id, session_id, path, referrer, device) VALUES (?,?,?,?,?)')
        .run(id, b.sid, path, ref, deviceOf(ua));
      return res.json({ id });
    }
    if (b.t === 'ping') {
      if (!UUID.test(b.id || '')) return res.status(400).end();
      const sec = Math.max(0, Math.min(1800, parseInt(b.sec, 10) || 0));
      db.prepare(`UPDATE page_views SET duration_sec = MAX(duration_sec, ?), last_seen = datetime('now')
                  WHERE id = ? AND session_id = ?`).run(sec, b.id, b.sid);
      return res.status(204).end();
    }
  } catch (e) { console.error('[ANALYTICS]', e.message); }
  res.status(400).end();
});

// ── Relatório (só admin) ──────────────────────────────────────────────────────
const LABELS = {
  '/': 'Início', '/acervo-colecao': 'Acervo', '/vendidos': 'Vendidos', '/restauro': 'Restauro',
  '/nossa-historia': 'Nossa História', '/contato': 'Contato', '/politicas': 'Políticas & LGPD',
};

router.get('/summary', requireAuth, (req, res) => {
  const days = [1, 7, 30, 90, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
  const db = getDb();
  const off = `${config.tzOffsetHours >= 0 ? '+' : '-'}${Math.abs(config.tzOffsetHours)} hours`;
  const W = `date(created_at, '${off}') >= date('now', '${off}', '-${days - 1} days')`; // valores fixos/validados: sem injeção

  const t = db.prepare(`SELECT COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions, COALESCE(SUM(duration_sec),0) AS sec
                        FROM page_views WHERE ${W}`).get();
  const online = db.prepare(`SELECT COUNT(DISTINCT session_id) AS c FROM page_views WHERE last_seen >= datetime('now','-5 minutes')`).get().c;

  const bucket = days > 90 ? `strftime('%Y-%m', created_at, '${off}')` : `date(created_at, '${off}')`;
  const daily = db.prepare(`SELECT ${bucket} AS day, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions
                            FROM page_views WHERE ${W} GROUP BY day ORDER BY day`).all();

  const names = Object.fromEntries(db.prepare('SELECT id, name FROM products').all().map(p => [p.id, p.name]));
  const labelOf = p => LABELS[p] || (p.startsWith('/produto/') ? `Peça: ${names[p.slice(9)] || '(removida)'}` : p);
  const pages = db.prepare(`SELECT path, COUNT(*) AS views, COUNT(DISTINCT session_id) AS sessions, ROUND(AVG(duration_sec)) AS avgSec
                            FROM page_views WHERE ${W} GROUP BY path ORDER BY views DESC LIMIT 20`).all()
                  .map(r => ({ ...r, label: labelOf(r.path) }));

  const firstViews = `SELECT referrer, device FROM (SELECT session_id, referrer, device, MIN(created_at) FROM page_views WHERE ${W} GROUP BY session_id)`;
  const referrers = db.prepare(`SELECT CASE WHEN referrer = '' THEN 'Direto / sem origem' ELSE referrer END AS name, COUNT(*) AS sessions
                                FROM (${firstViews}) GROUP BY name ORDER BY sessions DESC LIMIT 8`).all();
  const devices = db.prepare(`SELECT device AS name, COUNT(*) AS sessions FROM (${firstViews}) GROUP BY device ORDER BY sessions DESC`).all();

  const sess = db.prepare(`SELECT session_id, MIN(created_at) AS start, SUM(duration_sec) AS sec, COUNT(*) AS pages
                           FROM page_views WHERE ${W} GROUP BY session_id ORDER BY start DESC LIMIT 15`).all();
  let journeys = [];
  if (sess.length) {
    const ids = sess.map(s => s.session_id);
    const steps = db.prepare(`SELECT session_id, path, duration_sec FROM page_views
                              WHERE session_id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at`).all(...ids);
    journeys = sess.map(s => ({
      start: s.start.replace(' ', 'T') + 'Z', seconds: s.sec, pages: s.pages,
      steps: steps.filter(x => x.session_id === s.session_id).map(x => ({ label: labelOf(x.path), seconds: x.duration_sec })),
    }));
  }

  res.json({
    days, online,
    totals: {
      views: t.views, sessions: t.sessions,
      avgSessionSec: t.sessions ? Math.round(t.sec / t.sessions) : 0,
      pagesPerSession: t.sessions ? +(t.views / t.sessions).toFixed(1) : 0,
    },
    daily, pages, referrers, devices, journeys,
  });
});

// Privacidade: apaga registros com mais de ~13 meses
function purgeOld() {
  try { getDb().prepare("DELETE FROM page_views WHERE created_at < datetime('now','-400 days')").run(); } catch {}
}
module.exports = router;
module.exports.purgeOld = purgeOld;
