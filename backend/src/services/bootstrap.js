const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { validatePassword } = require('./password');
const { getDb } = require('../database/connection');

// Cria o admin só no startup (nunca durante um login) e sem senha padrão.
async function ensureAdmin() {
  const db = getDb();
  let admin = db.prepare('SELECT * FROM admin_users ORDER BY created_at LIMIT 1').get();

  if (!admin) {
    if (!config.adminPassword) {
      console.error('\n❌ Nenhum administrador cadastrado. Defina ADMIN_PASSWORD (e ADMIN_EMAIL) em backend/.env e reinicie.\n');
      process.exit(1);
    }
    const weak = validatePassword(config.adminPassword, config.adminUsername);
    if (weak) { console.error(`\n❌ ADMIN_PASSWORD recusada: ${weak} Corrija em backend/.env.\n`); process.exit(1); }
    const hash = await bcrypt.hash(config.adminPassword, 12);
    db.prepare('INSERT INTO admin_users (id, username, password_hash, email) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), config.adminUsername, hash, config.adminEmail || null);
    console.log(`👤 Administrador "${config.adminUsername}" criado. Depois do 1º acesso, pode remover ADMIN_PASSWORD do .env.`);
    return;
  }

  if (config.adminPassword) {
    console.log('ℹ️  O admin já existe: ADMIN_PASSWORD do .env é ignorada (pode apagar essa linha). Para trocar a senha: npm run admin:set');
  }

  if (config.adminEmail && (admin.email || '').toLowerCase() !== config.adminEmail) {
    db.prepare('UPDATE admin_users SET email = ? WHERE id = ?').run(config.adminEmail, admin.id);
    console.log(`📧 E-mail de recuperação do admin atualizado para ${config.adminEmail}`);
  } else if (!admin.email) {
    console.warn('⚠️  O admin não tem e-mail cadastrado: a recuperação de senha não vai funcionar. Defina ADMIN_EMAIL no .env.');
  }

  // A senha antiga "kaetano2024" ficou pública no GitHub/README. Detecta e avisa.
  const known = ['kaetano2024', 'admin'];
  for (const pw of known) {
    if (await bcrypt.compare(pw, admin.password_hash)) {
      const msg = `A senha do admin ainda é uma senha CONHECIDA/PÚBLICA ("${pw}"). Troque agora: npm run admin:set  (ou "Esqueci minha senha" no login).`;
      if (config.isProd) { console.error(`\n❌ ${msg}\n`); process.exit(1); }
      console.warn(`\n⚠️  ${msg}\n`);
      break;
    }
  }
}
module.exports = { ensureAdmin };
