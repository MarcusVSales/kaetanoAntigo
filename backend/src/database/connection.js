const path = require('path');
const fs   = require('fs');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH  = path.join(DATA_DIR, 'kaetano.db');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let _db = null;
let dirty = false;
let timer = null;

async function initDb() {
  if (_db) return _db;
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  _db = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();
  _db.run('PRAGMA foreign_keys = ON;');
  return _db;
}

// Grava em arquivo temporário e renomeia: se o processo cair no meio, o banco
// antigo continua íntegro (antes, um corte durante a escrita corrompia o arquivo).
function flush() {
  if (!_db || !dirty) return;
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, Buffer.from(_db.export()));
  fs.renameSync(tmp, DB_PATH);
  dirty = false;
}

// Debounce: várias escritas seguidas viram uma gravação só (visitas, uploads...)
function scheduleSave() {
  dirty = true;
  if (timer) return;
  timer = setTimeout(() => { timer = null; try { flush(); } catch (e) { console.error('[DB] falha ao gravar:', e.message); } }, 800);
}

// Garante a gravação ao encerrar (Ctrl+C, deploy, reinício do nodemon)
const finish = () => { try { flush(); } catch {} };
process.on('exit', finish);
['SIGINT', 'SIGTERM'].forEach(s => process.on(s, () => { finish(); process.exit(0); }));
process.once('SIGUSR2', () => { finish(); process.kill(process.pid, 'SIGUSR2'); });

function getDb() {
  if (!_db) throw new Error('Banco não inicializado.');
  const raw = _db;
  return {
    exec(sql) { raw.run(sql); scheduleSave(); },
    prepare(sql) {
      return {
        all(...args) {
          const s = raw.prepare(sql); s.bind(norm(args));
          const rows = []; while (s.step()) rows.push(s.getAsObject()); s.free(); return rows;
        },
        get(...args) {
          const s = raw.prepare(sql); s.bind(norm(args));
          const r = s.step() ? s.getAsObject() : undefined; s.free(); return r;
        },
        run(...args) { raw.run(sql, norm(args)); scheduleSave(); return { changes: raw.getRowsModified() }; },
      };
    },
  };
}

function norm(args) {
  if (!args || !args.length) return [];
  if (args.length === 1 && args[0] !== null && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    const o = {}; for (const [k, v] of Object.entries(args[0])) o[`@${k}`] = v; return o;
  }
  return args;
}

module.exports = { initDb, getDb, flush, DB_PATH };
