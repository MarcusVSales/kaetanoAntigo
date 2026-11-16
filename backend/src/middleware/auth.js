const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database/db');

// Valida o token e confere no banco se o admin ainda existe e se a "versão" da sessão
// não foi invalidada (acontece ao redefinir a senha). Retorna o admin ou null.
async function verifyToken(header) {
  if (!header || !header.startsWith('Bearer ')) return { error: 'Token não fornecido' };
  const token = header.slice(7).trim();
  if (token.length < 20) return { error: 'Token inválido' };
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: 'kaetano-antigo' });
  } catch (err) {
    return { error: err.name === 'TokenExpiredError' ? 'Sessão expirada. Faça login novamente.' : 'Token inválido' };
  }
  const admin = await db.get('SELECT id, username, token_version FROM admin_users WHERE id = ?', [payload.id]);
  if (!admin || admin.token_version !== payload.tv) return { error: 'Sessão encerrada. Faça login novamente.' };
  return { user: { id: admin.id, username: admin.username } };
}

// Rotas do admin: sem login válido → 401
async function requireAuth(req, res, next) {
  let r; try { r = await verifyToken(req.headers['authorization']); } catch (e) { return next(e); }
  if (r.error) return res.status(401).json({ error: r.error });
  req.user = r.user;
  next();
}

// Rotas públicas que mostram MAIS dados para o admin: não bloqueia, só identifica quem é admin
async function optionalAuth(req, res, next) {
  let r; try { r = await verifyToken(req.headers['authorization']); } catch (e) { return next(e); }
  req.user = r.user || null;
  next();
}

module.exports = requireAuth;
module.exports.optional = optionalAuth;
