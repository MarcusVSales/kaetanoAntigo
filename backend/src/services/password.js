const WEAK = ['kaetano2024', 'admin', 'password', 'senha', '12345678', 'mudeestasenha'];

// Retorna uma mensagem de erro, ou null se a senha é aceitável
function validatePassword(pw, username = '') {
  if (!pw || pw.length < 10) return 'A senha precisa ter no mínimo 10 caracteres.';
  if (pw.length > 128) return 'Senha longa demais.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use letras e números na senha.';
  const low = pw.toLowerCase();
  if (WEAK.some(w => low.includes(w)) || (username && low.includes(username.toLowerCase()))) {
    return 'Essa senha é fácil de adivinhar. Escolha outra.';
  }
  return null;
}
module.exports = { validatePassword, WEAK };
