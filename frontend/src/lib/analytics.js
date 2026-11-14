// Monitor de visitas — anônimo e leve.
// • sem cookies e sem IP; o "visitante" é um código aleatório que vive só enquanto a aba está aberta
// • conta apenas o tempo em que a página está VISÍVEL (aba esquecida em segundo plano não conta)
// • respeita "Não rastrear" do navegador e o botão "não contar minhas visitas" do admin
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const ENDPOINT = `${API}/api/analytics/collect`;
export const NOTRACK_KEY = 'kaetano_notrack';

let cur = null; // visita atual: { path, idPromise, accMs, since }
let timer = null;
let wired = false;

const uuid = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });

function sid() {
  try {
    let s = sessionStorage.getItem('kaetano_sid');
    if (!s) { s = uuid(); sessionStorage.setItem('kaetano_sid', s); }
    return s;
  } catch { return uuid(); }
}

function disabled() {
  if (typeof window === 'undefined') return true;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return true;
  try { return localStorage.getItem(NOTRACK_KEY) === '1'; } catch { return false; }
}

const clean = url => {
  const p = (url || '/').split('#')[0].split('?')[0].replace(/\/+$/, '');
  return p === '' ? '/' : p;
};

function seconds() {
  if (!cur) return 0;
  return Math.round((cur.accMs + (cur.since ? Date.now() - cur.since : 0)) / 1000);
}

function send(payload, beacon = false) {
  const body = JSON.stringify({ sid: sid(), ...payload });
  if (beacon && navigator.sendBeacon) {
    // text/plain evita a verificação prévia (preflight) do CORS
    if (navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return;
  }
  return fetch(ENDPOINT, { method: 'POST', body, headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, keepalive: true, credentials: 'omit' });
}

function ping(beacon = false) {
  if (!cur) return;
  const sec = seconds();
  if (sec < 1) return;
  const v = cur;
  // Se o servidor já respondeu, o envio é SÍNCRONO (necessário ao fechar/trocar de página,
  // quando promessas pendentes podem nem chegar a rodar). Senão, espera a resposta.
  if (v.id) send({ t: 'ping', id: v.id, sec }, beacon);
  else v.idPromise.then(id => { if (id) send({ t: 'ping', id, sec }, beacon); });
}

function onVisibility() {
  if (!cur) return;
  if (document.visibilityState === 'hidden') {
    if (cur.since) { cur.accMs += Date.now() - cur.since; cur.since = null; }
    ping(true);
  } else if (!cur.since) cur.since = Date.now();
}

export function endView() { ping(true); cur = null; clearInterval(timer); timer = null; }

export function trackView(url) {
  if (disabled()) return;
  const path = clean(url);
  if (path.startsWith('/admin')) return endView();
  if (cur && cur.path === path) return; // evita contar duas vezes (re-render/StrictMode)
  endView();

  const visible = document.visibilityState === 'visible';
  const idPromise = send({ t: 'view', path, ref: document.referrer || '' })
    .then(r => (r && r.ok ? r.json() : null)).then(j => j?.id || null).catch(() => null);
  cur = { path, idPromise, id: null, accMs: 0, since: visible ? Date.now() : null };
  const started = cur;
  idPromise.then(id => { started.id = id; });

  if (!wired) {
    wired = true;
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', () => ping(true));
  }
  // 1º sinal aos 5 s (se a pessoa fechar o navegador de repente, o tempo não se perde) e depois a cada 15 s
  const mine = cur;
  setTimeout(() => { if (cur === mine && document.visibilityState === 'visible') ping(); }, 5000);
  timer = setInterval(() => { if (document.visibilityState === 'visible') ping(); }, 15000);
}
