// Cria tabelas e aplica migrações. É idempotente e roda sozinho ao iniciar o
// servidor — não é mais preciso lembrar de rodar "npm run db:init" após atualizar.
const fs = require('fs');
const { getDb, flush, DB_PATH } = require('./connection');
const { LEGACY } = require('../constants/categories');

function columns(db, table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
}
function addColumn(db, table, col, ddl) {
  if (!columns(db, table).includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`);
}

function ensureSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT, category TEXT NOT NULL,
      price REAL, quantity INTEGER DEFAULT 1, sold INTEGER DEFAULT 0, visible INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0, decade TEXT, sold_date TEXT, sold_price REAL,
      buyer_name TEXT, buyer_doc TEXT, payment_method TEXT,
      created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL, filename TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0, order_index INTEGER DEFAULT 0, crop_data TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS page_views (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL, path TEXT NOT NULL,
      referrer TEXT, device TEXT, duration_sec INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')), last_seen TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migrações de bancos antigos
  addColumn(db, 'products', 'sold_date', 'TEXT');
  addColumn(db, 'products', 'sold_price', 'REAL');
  addColumn(db, 'products', 'buyer_name', 'TEXT');
  addColumn(db, 'products', 'buyer_doc', 'TEXT');
  addColumn(db, 'products', 'payment_method', 'TEXT');
  addColumn(db, 'product_images', 'crop_data', 'TEXT');

  // Segurança do admin
  addColumn(db, 'admin_users', 'email', 'TEXT');
  addColumn(db, 'admin_users', 'failed_attempts', 'INTEGER DEFAULT 0');
  addColumn(db, 'admin_users', 'locked_until', 'TEXT');
  addColumn(db, 'admin_users', 'token_version', 'INTEGER DEFAULT 1');
  addColumn(db, 'admin_users', 'reset_token_hash', 'TEXT');
  addColumn(db, 'admin_users', 'reset_expires', 'TEXT');

  // Índices (acelera listagens e relatórios)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_list   ON products(visible, sold, featured, created_at);
    CREATE INDEX IF NOT EXISTS idx_images_product  ON product_images(product_id, is_primary);
    CREATE INDEX IF NOT EXISTS idx_pv_created      ON page_views(created_at);
    CREATE INDEX IF NOT EXISTS idx_pv_session      ON page_views(session_id, created_at);
  `);
}

// Renomeia as categorias antigas para as novas. Roda a cada início, mas só age se ainda
// houver produtos com nome antigo; antes de mexer, guarda uma cópia do banco.
function migrateCategories() {
  const db = getDb();
  const old = Object.keys(LEGACY);
  const marks = old.map(() => '?').join(',');
  const pending = db.prepare(`SELECT COUNT(*) AS c FROM products WHERE category IN (${marks})`).get(...old).c;
  if (!pending) return;
  try {
    flush();
    if (fs.existsSync(DB_PATH)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const bak = `${DB_PATH}.bak-categorias-${stamp}`;
      fs.copyFileSync(DB_PATH, bak);
      console.log(`💾 Cópia de segurança do banco antes de renomear categorias: ${bak}`);
    }
  } catch (e) { console.warn('[DB] não foi possível criar a cópia de segurança:', e.message); }
  for (const [from, to] of Object.entries(LEGACY)) {
    db.prepare('UPDATE products SET category = ? WHERE category = ?').run(to, from);
  }
  console.log(`🏷️  ${pending} produto(s) passaram para os novos nomes de categoria.`);
}

module.exports = { ensureSchema, migrateCategories };
