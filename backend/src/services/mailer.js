const nodemailer = require('nodemailer');
const config = require('../config');

const enabled = !!(config.smtp.host && config.smtp.user && config.smtp.pass);
const transporter = enabled
  ? nodemailer.createTransport({
      host: config.smtp.host, port: config.smtp.port,
      secure: config.smtp.port === 465, auth: { user: config.smtp.user, pass: config.smtp.pass },
    })
  : null;

async function sendResetEmail(to, link) {
  const minutes = config.resetTtlMinutes;
  if (!enabled) {
    // Sem SMTP: só em desenvolvimento mostramos o link no terminal. Em produção nunca.
    if (!config.isProd) console.log(`\n📧 [DEV] SMTP não configurado. Link de redefinição (válido por ${minutes} min):\n   ${link}\n`);
    else console.error('[MAIL] SMTP não configurado — e-mail de recuperação NÃO enviado.');
    return false;
  }
  await transporter.sendMail({
    from: config.smtp.from, to,
    subject: 'Kaetano Antigo — redefinição de senha do admin',
    text: `Recebemos um pedido para redefinir a senha do painel admin.\n\nAcesse o link (válido por ${minutes} minutos, uso único):\n${link}\n\nSe não foi você, ignore este e-mail — sua senha continua a mesma.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#111">
      <h2 style="letter-spacing:4px;text-transform:uppercase">Kaetano <i style="font-weight:300">Antigo</i></h2>
      <p>Recebemos um pedido para redefinir a senha do painel admin.</p>
      <p><a href="${link}" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;text-decoration:none;letter-spacing:2px;text-transform:uppercase;font-size:12px">Criar nova senha</a></p>
      <p style="font-size:13px;color:#555">O link vale por ${minutes} minutos e só pode ser usado uma vez.<br>Se não foi você, ignore este e-mail — sua senha continua a mesma.</p></div>`,
  });
  return true;
}

module.exports = { sendResetEmail, enabled };
