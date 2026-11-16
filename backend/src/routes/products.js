const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const auth           = require('../middleware/auth');
const { normalizeCategory } = require('../constants/categories');
const router   = express.Router();
for (const method of ['get','post','put','delete']) {
  const original = router[method].bind(router);
  router[method] = (path, ...handlers) => original(path, ...handlers.map(fn => (req,res,next) => {
    try { Promise.resolve(fn(req,res,next)).catch(next); } catch(e) { next(e); }
  }));
}


const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTS  = ['.jpg', '.jpeg', '.png', '.webp'];

const storage = multer.memoryStorage();
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
async function removeImageFiles(filename) {
  await db.run('DELETE FROM image_files WHERE filename IN (?, ?)', [filename, thumbOf(filename)]);
}
async function processUpload(file) {
  const base = uuidv4();
  if (!sharp) throw new Error('Processador de imagens indisponível');
  const open = () => sharp(file.buffer, { limitInputPixels: 50_000_000 }).rotate();
  const full = await open().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const small = await open().resize({ width: 640, height: 800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  await db.run('INSERT INTO image_files (filename,content_type,content) VALUES (?,?,?),(?,?,?)',
    [`${base}.webp`, 'image/webp', full, `${base}-sm.webp`, 'image/webp', small]);
  return `${base}.webp`;
}

// ── PÚBLICAS ──────────────────────────────────────────────────────────────────
// ATENÇÃO: estas rotas não exigem login. Só podem devolver colunas "de vitrine".
// Nunca use "SELECT *" aqui: a tabela guarda nome/CPF do comprador, forma de pagamento e valor da venda.
const PUBLIC_COLS = 'p.id, p.name, p.description, p.category, p.price, p.quantity, p.sold, p.visible, p.featured, p.decade, p.created_at, p.updated_at';

router.get('/', async (req, res) => {
  const { category, featured } = req.query;
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
  res.json(await db.all(sql, params));
});

router.get('/archive', async (req, res) => {
    // Página "Vendidos": só o que aparece na vitrine. Sem preço, data, comprador, CPF ou pagamento.
  res.json(await db.all(`
    SELECT p.id, p.name, p.category, p.decade,
      (SELECT filename FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_image
    FROM products p WHERE p.sold=1 AND p.visible=1 ORDER BY p.updated_at DESC
  `));
});

router.get('/categories', async (req, res) => {
    res.json(await db.all(`SELECT category, COUNT(*) AS count FROM products WHERE visible=1 AND sold=0 GROUP BY category ORDER BY category`));
});

router.get('/admin/all', auth, async (req, res) => {
    res.json(await db.all(`
    SELECT p.*,
      (SELECT filename FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_image,
      (SELECT crop_data FROM product_images WHERE product_id=p.id AND is_primary=1 LIMIT 1) AS primary_crop,
      (SELECT COUNT(*) FROM product_images WHERE product_id=p.id) AS image_count
    FROM products p ORDER BY p.created_at DESC
  `));
});

router.get('/:id', auth.optional, async (req, res) => {
    // Admin logado vê tudo (inclusive ocultos e dados de venda). Visitante vê só peças visíveis, só colunas de vitrine.
  const product = req.user
    ? await db.get('SELECT * FROM products WHERE id=?', [req.params.id])
    : await db.get(`SELECT ${PUBLIC_COLS} FROM products p WHERE p.id=? AND p.visible=1`, [req.params.id]);
  if (!product) return res.status(404).json({ error: 'Não encontrado' });
  const images  = await db.all('SELECT * FROM product_images WHERE product_id=? ORDER BY is_primary DESC, order_index ASC', [req.params.id]);
  res.json({ ...product, images });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

router.post('/', auth, async (req, res) => {
  const { name, description, category, price, quantity, visible, featured, decade, sold, sold_date, sold_price, buyer_name, buyer_doc, payment_method } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'Nome e categoria obrigatórios' });
  const cat = normalizeCategory(category);
  if (!cat) return res.status(400).json({ error: 'Categoria inválida' });
    const id     = uuidv4();
  const isSold = sold ? 1 : 0;
  await db.run(`INSERT INTO products (id,name,description,category,price,quantity,visible,featured,decade,sold,sold_date,sold_price,buyer_name,buyer_doc,payment_method) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id, name, description||'', cat, price||null, quantity||1, visible!==false?1:0, (featured&&!isSold)?1:0, decade||null, isSold, sold_date||null, sold_price||null, buyer_name||null, buyer_doc||null, payment_method||null]);
  res.status(201).json(await db.get('SELECT * FROM products WHERE id=?', [id]));
});

router.put('/:id', auth, async (req, res) => {
    const cur = await db.get('SELECT * FROM products WHERE id=?', [req.params.id]);
  if (!cur) return res.status(404).json({ error: 'Não encontrado' });
  const { name, description, category, price, quantity, visible, featured, sold, decade, sold_date, sold_price, buyer_name, buyer_doc, payment_method } = req.body;
  let newCategory = cur.category;
  if (category !== undefined) {
    newCategory = normalizeCategory(category);
    if (!newCategory) return res.status(400).json({ error: 'Categoria inválida' });
  }
  const isSold     = sold     !== undefined ? (sold     ? 1 : 0) : cur.sold;
  const isFeatured = isSold   ? 0 : (featured !== undefined ? (featured ? 1 : 0) : cur.featured);
  await db.run(`UPDATE products SET name=?,description=?,category=?,price=?,quantity=?,visible=?,featured=?,sold=?,decade=?,sold_date=?,sold_price=?,buyer_name=?,buyer_doc=?,payment_method=?,updated_at=UTC_TIMESTAMP() WHERE id=?`, [name        ?? cur.name,
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
      req.params.id]);
  res.json(await db.get('SELECT * FROM products WHERE id=?', [req.params.id]));
});

// PUT /api/products/:id/unmark-sold  ← NOVA: devolução / desfazer venda
router.put('/:id/unmark-sold', auth, async (req, res) => {
    const cur = await db.get('SELECT * FROM products WHERE id=?', [req.params.id]);
  if (!cur) return res.status(404).json({ error: 'Não encontrado' });
  await db.run(`UPDATE products SET sold=0, sold_date=NULL, sold_price=NULL, buyer_name=NULL, buyer_doc=NULL, payment_method=NULL, featured=0, updated_at=UTC_TIMESTAMP() WHERE id=?`, [req.params.id]);
  res.json(await db.get('SELECT * FROM products WHERE id=?', [req.params.id]));
});

router.delete('/:id', auth, async (req, res) => {
    const imgs = await db.all('SELECT filename FROM product_images WHERE product_id=?', [req.params.id]);
  await db.run('DELETE FROM products WHERE id=?', [req.params.id]);
  await Promise.all(imgs.map(img => removeImageFiles(img.filename)));
  res.json({ message: 'Removido' });
});

router.post('/:id/images', auth, upload.array('images', 10), async (req, res) => {
  const files = req.files || [];
  const discard = () => {};
    if (!await db.get('SELECT id FROM products WHERE id=?', [req.params.id])) {
    discard(files); return res.status(404).json({ error: 'Produto não encontrado' });
  }
  const count = (await db.get('SELECT COUNT(*) AS c FROM product_images WHERE product_id=?', [req.params.id])).c;
  if (count >= 7) {
    discard(files);
    return res.status(400).json({ error: 'Limite de 7 fotos por produto atingido. Remova uma foto antes de adicionar outra.' });
  }
  const accepted = files.slice(0, 7 - count);
  discard(files.slice(7 - count)); // o que passou do limite não será processado

  const inserted = []; let rejected = 0;
  for (const file of accepted) {
    try {
      const filename = await processUpload(file);
      const idx = ((await db.get('SELECT COALESCE(MAX(order_index),0) AS max_order FROM product_images WHERE product_id=?', [req.params.id])).max_order || 0) + 1;
      const imgId = uuidv4();
      await db.run('INSERT INTO product_images (id,product_id,filename,is_primary,order_index) VALUES (?,?,?,?,?)', [imgId, req.params.id, filename, count === 0 && inserted.length === 0 ? 1 : 0, idx]);
      inserted.push({ id: imgId, filename, is_primary: count === 0 && inserted.length === 0 ? 1 : 0 });
    } catch (e) {
      rejected++; console.error('[UPLOAD]', e.message);
    }
  }
  if (!inserted.length) return res.status(400).json({ error: 'O arquivo enviado não é uma imagem válida.' });
  res.status(201).json(inserted);
});

// PUT /api/products/:id/images/:imgId/crop  ← NOVA: salvar crop
router.put('/:id/images/:imgId/crop', auth, async (req, res) => {
  const c = req.body?.crop_data;
  const num = v => typeof v === 'number' && isFinite(v);
  // x/y podem ser negativos e largura/altura passar de 100 quando o zoom fica abaixo de 100% (foto menor que o quadro)
  const ok = c && num(c.x) && num(c.y) && num(c.width) && num(c.height)
    && c.width > 1 && c.width <= 1000 && c.height > 1 && c.height <= 1000
    && c.x >= -1000 && c.x <= 1000 && c.y >= -1000 && c.y <= 1000;
  if (!ok) return res.status(400).json({ error: 'Dados de recorte inválidos' });
  const clean = { x: c.x, y: c.y, width: c.width, height: c.height };
  await db.run('UPDATE product_images SET crop_data=? WHERE id=? AND product_id=?', [JSON.stringify(clean), req.params.imgId, req.params.id]);
  res.json({ message: 'Crop salvo' });
});

router.delete('/:id/images/:imgId', auth, async (req, res) => {
    const img = await db.get('SELECT * FROM product_images WHERE id=? AND product_id=?', [req.params.imgId, req.params.id]);
  if (!img) return res.status(404).json({ error: 'Imagem não encontrada' });
  await db.run('DELETE FROM product_images WHERE id=?', [req.params.imgId]);
  await removeImageFiles(img.filename);
  if (img.is_primary) {
    const replacement = await db.get('SELECT id FROM product_images WHERE product_id=? ORDER BY order_index,id LIMIT 1', [req.params.id]);
    if (replacement) await db.run('UPDATE product_images SET is_primary=1 WHERE id=?',[replacement.id]);
  }
  res.json({ message: 'Removida' });
});

router.put('/:id/images/:imgId/primary', auth, async (req, res) => {
  const found = await db.get('SELECT id FROM product_images WHERE id=? AND product_id=?', [req.params.imgId,req.params.id]);
  if (!found) return res.status(404).json({ error: 'Imagem não encontrada' });
  await db.run('UPDATE product_images SET is_primary=IF(id=?,1,0) WHERE product_id=?', [req.params.imgId,req.params.id]);
  res.json({ message: 'Imagem principal atualizada' });
});


router.put('/:id/images/:imgId/order', auth, async (req, res) => {
    const position = Number(req.body.position);

  if (!Number.isInteger(position) || position < 1) {
    return res.status(400).json({ error: 'Posição inválida' });
  }

  try {
    const images = await db.all(`
      SELECT id FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, order_index ASC, id ASC
    `, [req.params.id]);

    const currentIndex = images.findIndex(
      img => img.id === req.params.imgId
    );

    if (currentIndex === -1) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    if (position > images.length) {
      return res.status(400).json({ error: 'Posição fora do limite' });
    }

    const [selected] = images.splice(currentIndex, 1);
    images.splice(position - 1, 0, selected);

    for (const [index, img] of images.entries()) {
      await db.run('UPDATE product_images SET order_index=? WHERE id=? AND product_id=?', [index + 1, img.id, req.params.id]);
    }

    res.json({ message: 'Ordem atualizada' });

  } catch (error) {
    console.error('Erro ao ordenar fotos:', error);
    res.status(500).json({ error: 'Erro ao atualizar ordem' });
  }
});


module.exports = router;
