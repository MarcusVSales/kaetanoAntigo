const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const config  = require('../config');
const db = require('../database/db');
const requireAuth = require('../middleware/auth');
const { sendResetEmail } = require('../services/mailer');
const { validatePassword } = require('../services/password');

const router = express.Router();
const clean = (v, max = 200) => (v ?? '').toString().trim().slice(0, max);
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
// Hash falso: quando o usuário não existe, ainda gastamos o mesmo tempo do bcrypt
// (impede descobrir pelo tempo de resposta se o usuário existe)
const DUMMY_HASH = bcrypt.hashSync('nao-existe-' + crypto.randomBytes(8).toString('hex'), 12);

const minutesLeft = iso => Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 60000));

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const username = clean(req.body?.username, 60);
    const password = clean(req.body?.password, 128);
    if (!username || !password) return res.status(400).json({ error: 'Informe usuário e senha.' });

    const admin = await db.get('SELECT * FROM admin_users WHERE username = ?', [username]);

    if (admin?.locked_until && new Date(admin.locked_until) > new Date()) {
      const m = minutesLeft(admin.locked_until);
      return res.status(429).json({ error: `Muitas tentativas incorretas. Conta bloqueada por mais ${m} minuto${m > 1 ? 's' : ''}. Use "Esqueci minha senha" para liberar agora.` });
    }

    const ok = await bcrypt.compare(password, admin?.password_hash || DUMMY_HASH);
    if (!admin || !ok) {
      if (admin) {
        const attempts = (admin.failed_attempts || 0) + 1;
        if (attempts >= config.maxFailedLogins) {
          const until = new Date(Date.now() + config.lockMinutes * 60000).toISOString();
          await db.run('UPDATE admin_users SET failed_attempts = 0, locked_until = ? WHERE id = ?', [until, admin.id]);
          console.warn(`[SEGURANÇA] Conta "${admin.username}" bloqueada até ${until} (IP ${req.ip})`);
          return res.status(429).json({ error: `Muitas tentativas incorretas. Conta bloqueada por ${config.lockMinutes} minutos.` });
        }
        await db.run('UPDATE admin_users SET failed_attempts = ? WHERE id = ?', [attempts, admin.id]);
      }
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    await db.run('UPDATE admin_users SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [admin.id]);
    const token = jwt.sign(
      { id: admin.id, tv: admin.token_version },
      config.jwtSecret,
      { expiresIn: '8h', algorithm: 'HS256', issuer: 'kaetano-antigo' }
    );
    res.json({ token, username: admin.username });
  } catch (e) {
    console.error('[AUTH]', e.message);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// ── Verificar sessão ──────────────────────────────────────────────────────────
router.get('/verify', requireAuth, (req, res) => res.json({ valid: true, username: req.user.username }));

// ── Esqueci a senha: envia link por e-mail ────────────────────────────────────
// Resposta SEMPRE igual (existindo ou não o e-mail) e envio sem "await",
// para ninguém descobrir qual e-mail é o do admin.
router.post('/forgot-password', async (req, res) => {
  const generic = { ok: true, message: 'Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.' };
  try {
    const email = clean(req.body?.email, 150).toLowerCase();
    const admin = email ? await db.get('SELECT * FROM admin_users WHERE lower(email) = ?', [email]) : null;
    if (admin) {
      const ttlMs = config.resetTtlMinutes * 60000;
      const lastRequestAt = admin.reset_expires ? new Date(admin.reset_expires).getTime() - ttlMs : 0;
      if (Date.now() - lastRequestAt > 60000) { // no máx. 1 e-mail por minuto
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + ttlMs).toISOString();
        // Só o HASH do token fica no banco: um vazamento do banco não entrega links válidos
        await db.run('UPDATE admin_users SET reset_token_hash = ?, reset_expires = ? WHERE id = ?', [sha256(token), expires, admin.id]);
        const link = `${config.frontendUrls[0]}/admin/redefinir-senha?token=${token}`;
        sendResetEmail(admin.email, link).catch(e => console.error('[MAIL]', e.message));
      }
    }
  } catch (e) { console.error('[AUTH forgot]', e.message); }
  res.json(generic);
});

// ── Redefinir a senha com o token do e-mail ───────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const token = clean(req.body?.token, 100);
    const password = clean(req.body?.password, 128);
    if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ error: 'Link inválido ou expirado.' });

    const admin = await db.get('SELECT * FROM admin_users WHERE reset_token_hash = ?', [sha256(token)]);
    if (!admin || !admin.reset_expires || new Date(admin.reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo.' });
    }
    const problem = validatePassword(password, admin.username);
    if (problem) return res.status(400).json({ error: problem });

    const hash = await bcrypt.hash(password, 12);
    await db.run(`UPDATE admin_users SET password_hash = ?, reset_token_hash = NULL, reset_expires = NULL,
                failed_attempts = 0, locked_until = NULL, token_version = token_version + 1 WHERE id = ?`, [hash, admin.id]);
    console.log(`[SEGURANÇA] Senha do admin "${admin.username}" redefinida; sessões antigas encerradas.`);
    res.json({ ok: true, message: 'Senha alterada. Faça login com a nova senha.' });
  } catch (e) {
    console.error('[AUTH reset]', e.message);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

module.exports = router;
