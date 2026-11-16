const express = require('express');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const db = require('../database/db');
const requireAuth = require('../middleware/auth');
const router = express.Router();
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|curl|wget|python|httpclient|monitor|facebookexternalhit/i;
const UUID = /^[a-f0-9-]{36}$/i;
const PATH_OK = /^\/[A-Za-z0-9\-_/.%[\]]{0,150}$/;
const deviceOf = ua => /tablet|ipad/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'celular' : 'computador';
const hostOf = ref => { try { return new URL(ref).hostname.replace(/^www\./, '').slice(0, 80); } catch { return ''; } };
router.post('/collect', express.text({ type: '*/*', limit: '2kb' }), async (req, res) => {
  const ua = (req.headers['user-agent'] || '').slice(0, 300);
  if (!ua || BOT.test(ua)) return res.status(204).end();
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { return res.status(400).end(); } }
  if (!b || typeof b !== 'object' || !UUID.test(b.sid || '')) return res.status(400).end();
  try {
    if (b.t === 'view') {
      const path = String(b.path || '');
      if (!PATH_OK.test(path) || path.startsWith('/admin')) return res.status(204).end();
      const n = (await db.get('SELECT COUNT(*) AS c FROM page_views WHERE session_id=?', [b.sid])).c;
      if (n >= 300) return res.status(204).end();
      const id = uuidv4();
      await db.run('INSERT INTO page_views (id,session_id,path,referrer,device) VALUES (?,?,?,?,?)', [id,b.sid,path,hostOf(String(b.ref||'')),deviceOf(ua)]);
      return res.json({ id });
    }
    if (b.t === 'ping') {
      if (!UUID.test(b.id || '')) return res.status(400).end();
      const sec = Math.max(0,Math.min(1800,parseInt(b.sec,10)||0));
      await db.run('UPDATE page_views SET duration_sec=GREATEST(duration_sec,?),last_seen=UTC_TIMESTAMP() WHERE id=? AND session_id=?',[sec,b.id,b.sid]);
      return res.status(204).end();
    }
  } catch(e) { console.error('[ANALYTICS]',e.message); return res.status(500).end(); }
  res.status(400).end();
});
const LABELS = {'/':'Início','/acervo-colecao':'Acervo','/vendidos':'Vendidos','/restauro':'Restauro','/nossa-historia':'Nossa História','/contato':'Contato','/politicas':'Políticas & LGPD'};
router.get('/summary', requireAuth, async (req,res,next) => {
 try {
  const days = [1,7,30,90,365].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
  const off = Number(config.tzOffsetHours)*60;
  const local = 'DATE_ADD(created_at, INTERVAL ? MINUTE)';
  const W = `${local} >= DATE_SUB(DATE(DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? MINUTE)),INTERVAL ? DAY)`;
  const params = [off,off,days-1];
  const t = await db.get(`SELECT COUNT(*) AS views,COUNT(DISTINCT session_id) AS sessions,COALESCE(SUM(duration_sec),0) AS sec FROM page_views WHERE ${W}`,params);
  const online = (await db.get('SELECT COUNT(DISTINCT session_id) AS c FROM page_views WHERE last_seen>=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 5 MINUTE)')).c;
  const bucket = days>90 ? `DATE_FORMAT(${local},'%Y-%m')` : `DATE_FORMAT(${local},'%Y-%m-%d')`;
  const daily = await db.all(`SELECT ${bucket} AS day,COUNT(*) AS views,COUNT(DISTINCT session_id) AS sessions FROM page_views WHERE ${W} GROUP BY day ORDER BY day`,[off,...params]);
  const names = Object.fromEntries((await db.all('SELECT id,name FROM products')).map(p=>[p.id,p.name]));
  const labelOf = p=>LABELS[p] || (p.startsWith('/produto/') ? `Peça: ${names[p.slice(9)]||'(removida)'}` : p);
  const pages = (await db.all(`SELECT path,COUNT(*) AS views,COUNT(DISTINCT session_id) AS sessions,ROUND(AVG(duration_sec)) AS avgSec FROM page_views WHERE ${W} GROUP BY path ORDER BY views DESC LIMIT 20`,params)).map(r=>({...r,label:labelOf(r.path)}));
  const first = `SELECT p.referrer,p.device FROM page_views p WHERE p.id=(SELECT p2.id FROM page_views p2 WHERE p2.session_id=p.session_id ORDER BY p2.created_at,p2.id LIMIT 1) AND ${W.replaceAll('created_at','p.created_at')}`;
  const referrers = await db.all(`SELECT CASE WHEN referrer='' THEN 'Direto / sem origem' ELSE referrer END AS name,COUNT(*) AS sessions FROM (${first}) v GROUP BY name ORDER BY sessions DESC LIMIT 8`,params);
  const devices = await db.all(`SELECT device AS name,COUNT(*) AS sessions FROM (${first}) v GROUP BY device ORDER BY sessions DESC`,params);
  const sess = await db.all(`SELECT session_id,MIN(created_at) AS start,SUM(duration_sec) AS sec,COUNT(*) AS pages FROM page_views WHERE ${W} GROUP BY session_id ORDER BY start DESC LIMIT 15`,params);
  let journeys=[];
  if(sess.length){
    const ids=sess.map(s=>s.session_id);
    const steps=await db.all(`SELECT session_id,path,duration_sec FROM page_views WHERE session_id IN (${ids.map(()=>'?').join(',')}) ORDER BY created_at`,ids);
    journeys=sess.map(s=>({start:new Date(s.start).toISOString(),seconds:s.sec,pages:s.pages,steps:steps.filter(x=>x.session_id===s.session_id).map(x=>({label:labelOf(x.path),seconds:x.duration_sec}))}));
  }
  res.json({days,online,totals:{views:t.views,sessions:t.sessions,avgSessionSec:t.sessions?Math.round(t.sec/t.sessions):0,pagesPerSession:t.sessions?+(t.views/t.sessions).toFixed(1):0},daily,pages,referrers,devices,journeys});
 } catch(e) { next(e); }
});
async function purgeOld(){await db.run('DELETE FROM page_views WHERE created_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 400 DAY)');}
module.exports=router;
module.exports.purgeOld=purgeOld;
