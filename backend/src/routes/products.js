const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDb }      = require('../database/connection');
const auth           = require('../middleware/auth');
const { normalizeCategory } = require('../constants/categories');
const router   = express.Router();

const UPLOADS = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTS  = ['.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  // UUID como nome — impossível adivinhar o caminho e sem path traversal
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 }, // 8MB por arquivo, máx 10
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Valida AMBOS: mimetype E extensão — evita bypass com arquivo renomeado
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens JPG, PNG ou WEBP são permitidas'));
    }
  },
});

// ── Processamento de imagens ──────────────────────────────────────────────────
// sharp redimensiona/comprime (WebP) e TAMBÉM prova que o arquivo é uma imagem de
// verdade — extensão e mimetype podem ser falsificados, o conteúdo não.
let sharp = null;
try { sharp = require('sharp'); } catch { console.warn('[IMG] "sharp" indisponível: fotos serão salvas sem otimização.'); }

const thumbOf = filename => filename.replace(/\.[^.]+$/, '') + '-sm.webp';
function removeImageFiles(filename) {
  for (const f of [filename, thumbOf(filename)]) {
    const fp = path.join(UPLOADS, path.basename(f));
    try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
  }
}
async function processUpload(file) {
  if (!sharp) return file.filename;
  const base = file.filename.replace(/\.[^.]+$/, '');
  const open = () => sharp(file.path, { limitInputPixels: 50_000_000 }).rotate(); // .rotate() respeita a orientação do celular
  await open().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(UPLOADS, `${base}.webp`));
  await open().resize({ width: 640, height: 800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(UPLOADS, `${base}-sm.webp`));
  fs.unlinkSync(file.path); // descarta o original pesado
  return `${base}.webp`;
}

// ── PÚBLICAS ──────────────────────────────────────────────────────────────────
// ATENÇÃO: estas rotas não exigem login. Só podem devolver colunas "de vitrine".
// Nunca use "SELECT *" aqui: a tabela guarda nome/CPF do comprador, forma de pagamento e valor da venda.
const PUBLIC_COLS = 'p.id, p.name, p.description, p.category, p.price, p.quantity, p.sold, p.visible, p.featured, p.decade, p.created_at, p.updated_at';

router.get('/', (req, res) => {
  const { category, featured } = req.query;
  const db = getDb();
  let sql = `
    SELECT ${PUBLIC_COLS},
      (SELECT filename FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_image,
      (SELECT crop_data FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_crop,
      (SELECT COUNT(*) FROM product_images WHERE product_id=p.id) AS image_count
    FROM products p WHERE p.visible=1 AND p.sold=0`;
  const params = [];
  if (category)           { sql += ' AND p.category=?'; params.push(normalizeCategory(category) || String(category)); } // aceita links antigos (?categoria=Buffet)
  if (featured === 'true') sql += ' AND p.featured=1';
  sql += ' ORDER BY p.featured DESC, p.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/archive', (req, res) => {
  const db = getDb();
  // Página "Vendidos": só o que aparece na vitrine. Sem preço, data, comprador, CPF ou pagamento.
  res.json(db.prepare(`
    SELECT p.id, p.name, p.category, p.decade,
      (SELECT filename FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_image
    FROM products p WHERE p.sold=1 AND p.visible=1 ORDER BY p.updated_at DESC
  `).all());
});

router.get('/categories', (req, res) => {
  const db = getDb();
  res.json(db.prepare(`SELECT category, COUNT(*) AS count FROM products WHERE visible=1 AND sold=0 GROUP BY category ORDER BY category`).all());
});

router.get('/admin/all', auth, (req, res) => {
  const db = getDb();
  res.json(db.prepare(`
    SELECT p.*,
      (SELECT filename FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_image,
      (SELECT crop_data FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_crop,
      (SELECT COUNT(*) FROM product_images WHERE product_id=p.id) AS image_count
    FROM products p ORDER BY p.created_at DESC
  `).all());
});

router.get('/:id', auth.optional, (req, res) => {
  const db = getDb();
  // Admin logado vê tudo (inclusive ocultos e dados de venda). Visitante vê só peças visíveis, só colunas de vitrine.
  const product = req.user
    ? db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id)
    : db.prepare(`SELECT ${PUBLIC_COLS} FROM products p WHERE p.id=? AND p.visible=1`).get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Não encontrado' });
  const images  = db.prepare('SELECT * FROM product_images WHERE product_id=? ORDER BY is_primary DESC, order_index ASC').all(req.params.id);
  res.json({ ...product, images });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

router.post('/', auth, (req, res) => {
  const { name, description, category, price, quantity, visible, featured, decade, sold, sold_date, sold_price, buyer_name, buyer_doc, payment_method } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'Nome e categoria obrigatórios' });
  const cat = normalizeCategory(category);
  if (!cat) return res.status(400).json({ error: 'Categoria inválida' });
  const db     = getDb();
  const id     = uuidv4();
  const isSold = sold ? 1 : 0;
  db.prepare(`INSERT INTO products (id,name,description,category,price,quantity,visible,featured,decade,sold,sold_date,sold_price,buyer_name,buyer_doc,payment_method) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, name, description||'', cat, price||null, quantity||1, visible!==false?1:0, (featured&&!isSold)?1:0, decade||null, isSold, sold_date||null, sold_price||null, buyer_name||null, buyer_doc||null, payment_method||null);
  res.status(201).json(db.prepare('SELECT * FROM products WHERE id=?').get(id));
});

router.put('/:id', auth, (req, res) => {
  const db  = getDb();
  const cur = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Não encontrado' });
  const { name, description, category, price, quantity, visible, featured, sold, decade, sold_date, sold_price, buyer_name, buyer_doc, payment_method } = req.body;
  let newCategory = cur.category;
  if (category !== undefined) {
    newCategory = normalizeCategory(category);
    if (!newCategory) return res.status(400).json({ error: 'Categoria inválida' });
  }
  const isSold     = sold     !== undefined ? (sold     ? 1 : 0) : cur.sold;
  const isFeatured = isSold   ? 0 : (featured !== undefined ? (featured ? 1 : 0) : cur.featured);
  db.prepare(`UPDATE products SET name=?,description=?,category=?,price=?,quantity=?,visible=?,featured=?,sold=?,decade=?,sold_date=?,sold_price=?,buyer_name=?,buyer_doc=?,payment_method=?,updated_at=datetime('now') WHERE id=?`)
    .run(
      name        ?? cur.name,
      description ?? cur.description,
      newCategory,
      price           !== undefined ? price           : cur.price,
      quantity        ?? cur.quantity,
      visible         !== undefined ? (visible?1:0)   : cur.visible,
      isFeatured, isSold,
      decade          ?? cur.decade,
      sold_date       !== undefined ? sold_date       : cur.sold_date,
      sold_price      !== undefined ? sold_price      : cur.sold_price,
      buyer_name      !== undefined ? buyer_name      : cur.buyer_name,
      buyer_doc       !== undefined ? buyer_doc       : cur.buyer_doc,
      payment_method  !== undefined ? payment_method  : cur.payment_method,
      req.params.id
    );
  res.json(db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id));
});

// PUT /api/products/:id/unmark-sold  ← NOVA: devolução / desfazer venda
router.put('/:id/unmark-sold', auth, (req, res) => {
  const db  = getDb();
  const cur = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Não encontrado' });
  db.prepare(`UPDATE products SET sold=0, sold_date=NULL, sold_price=NULL, buyer_name=NULL, buyer_doc=NULL, payment_method=NULL, featured=0, updated_at=datetime('now') WHERE id=?`).run(req.params.id);
  res.json(db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id));
});

router.delete('/:id', auth, (req, res) => {
  const db   = getDb();
  const imgs = db.prepare('SELECT filename FROM product_images WHERE product_id=?').all(req.params.id);
  imgs.forEach(img => removeImageFiles(img.filename));
  db.prepare('DELETE FROM product_images WHERE product_id=?').run(req.params.id);
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ message: 'Removido' });
});

router.post('/:id/images', auth, upload.array('images', 10), async (req, res) => {
  const files = req.files || [];
  const discard = list => list.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
  const db = getDb();
  if (!db.prepare('SELECT id FROM products WHERE id=?').get(req.params.id)) {
    discard(files); return res.status(404).json({ error: 'Produto não encontrado' });
  }
  const count = db.prepare('SELECT COUNT(*) AS c FROM product_images WHERE product_id=?').get(req.params.id).c;
  if (count >= 7) {
    discard(files);
    return res.status(400).json({ error: 'Limite de 7 fotos por produto atingido. Remova uma foto antes de adicionar outra.' });
  }
  const accepted = files.slice(0, 7 - count);
  discard(files.slice(7 - count)); // o que passou do limite não fica órfão em disco

  const inserted = []; let rejected = 0;
  for (const file of accepted) {
    try {
      const filename = await processUpload(file);
      const idx = count + inserted.length;
      const imgId = uuidv4();
      db.prepare('INSERT INTO product_images (id,product_id,filename,is_primary,order_index) VALUES (?,?,?,?,?)')
        .run(imgId, req.params.id, filename, idx === 0 ? 1 : 0, idx);
      inserted.push({ id: imgId, filename, is_primary: idx === 0 ? 1 : 0 });
    } catch (e) {
      rejected++; discard([file]);
    }
  }
  if (!inserted.length) return res.status(400).json({ error: 'O arquivo enviado não é uma imagem válida.' });
  res.status(201).json(inserted);
});

// PUT /api/products/:id/images/:imgId/crop  ← NOVA: salvar crop
router.put('/:id/images/:imgId/crop', auth, (req, res) => {
  const c = req.body?.crop_data;
  const num = v => typeof v === 'number' && isFinite(v);
  // x/y podem ser negativos e largura/altura passar de 100 quando o zoom fica abaixo de 100% (foto menor que o quadro)
  const ok = c && num(c.x) && num(c.y) && num(c.width) && num(c.height)
    && c.width > 1 && c.width <= 1000 && c.height > 1 && c.height <= 1000
    && c.x >= -1000 && c.x <= 1000 && c.y >= -1000 && c.y <= 1000;
  if (!ok) return res.status(400).json({ error: 'Dados de recorte inválidos' });
  const clean = { x: c.x, y: c.y, width: c.width, height: c.height };
  getDb().prepare('UPDATE product_images SET crop_data=? WHERE id=? AND product_id=?').run(JSON.stringify(clean), req.params.imgId, req.params.id);
  res.json({ message: 'Crop salvo' });
});

router.delete('/:id/images/:imgId', auth, (req, res) => {
  const db  = getDb();
  const img = db.prepare('SELECT * FROM product_images WHERE id=? AND product_id=?').get(req.params.imgId, req.params.id);
  if (!img) return res.status(404).json({ error: 'Imagem não encontrada' });
  removeImageFiles(img.filename);
  db.prepare('DELETE FROM product_images WHERE id=?').run(req.params.imgId);
  res.json({ message: 'Removida' });
});

router.put('/:id/images/:imgId/primary', auth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE product_images SET is_primary=0 WHERE product_id=?').run(req.params.id);
  db.prepare('UPDATE product_images SET is_primary=1 WHERE id=? AND product_id=?').run(req.params.imgId, req.params.id);
  res.json({ message: 'Imagem principal atualizada' });
});

module.exports = router;
