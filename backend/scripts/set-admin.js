// Define/troca a senha (e opcionalmente o e-mail) do admin direto pelo terminal:
//   npm run admin:set
// Útil no primeiro uso e se você perder o acesso ao e-mail de recuperação.
const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../src/database/db');
const { validatePassword } = require('../src/services/password');

function ask(question, { hidden = false } = {}) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = s => { if (s.includes(question)) rl.output.write(s); else rl.output.write(''); };
    }
    rl.question(question, answer => { rl.close(); if (hidden) console.log(''); resolve(answer); });
  });
}

(async () => {
  const admin = await db.get('SELECT * FROM admin_users ORDER BY created_at LIMIT 1');
  if (!admin) { console.error('Nenhum admin no banco. Defina ADMIN_PASSWORD no .env e inicie o servidor uma vez.'); process.exit(1); }

  console.log(`\nAdmin atual: ${admin.username}${admin.email ? ' <' + admin.email + '>' : ' (sem e-mail)'}`);
  const email = (await ask('Novo e-mail de recuperação (Enter para manter): ')).trim().toLowerCase();
  const pw1 = await ask('Nova senha (mín. 10, letras e números): ', { hidden: true });
  const problem = validatePassword(pw1, admin.username);
  if (problem) { console.error('❌ ' + problem); process.exit(1); }
  const pw2 = await ask('Repita a nova senha: ', { hidden: true });
  if (pw1 !== pw2) { console.error('❌ As senhas não conferem.'); process.exit(1); }

  const hash = await bcrypt.hash(pw1, 12);
  await db.run(`UPDATE admin_users SET password_hash = ?, email = COALESCE(NULLIF(?, ''), email),
              failed_attempts = 0, locked_until = NULL, reset_token_hash = NULL, reset_expires = NULL,
              token_version = token_version + 1 WHERE id = ?`, [hash, email, admin.id]);
  console.log('✅ Senha atualizada. Sessões antigas foram encerradas.');
  process.exit(0);
})();
