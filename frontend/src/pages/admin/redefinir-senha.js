import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { authAPI } from '@/lib/api';
import AuthLayout from '@/components/admin/AuthLayout';

export default function RedefinirSenha() {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';
  const [pw, setPw]   = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [done, setDone]   = useState(false);
  const [busy, setBusy]   = useState(false);

  const checks = [
    ['Mínimo de 10 caracteres', pw.length >= 10],
    ['Letras e números',        /[A-Za-z]/.test(pw) && /\d/.test(pw)],
    ['As duas senhas iguais',   pw.length > 0 && pw === pw2],
  ];

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (!checks.every(c => c[1])) { setError('A senha ainda não atende aos requisitos abaixo.'); return; }
    setBusy(true);
    try { await authAPI.resetPassword(token, pw); setDone(true); }
    catch (err) { setError(err.response?.data?.error || 'Não foi possível conectar ao servidor.'); }
    finally { setBusy(false); }
  };

  if (!router.isReady) return <AuthLayout title="Nova senha"><p className="text-xs text-center text-site-text3">Carregando…</p></AuthLayout>;

  return (
    <AuthLayout title="Nova senha" footer={<p><Link href="/admin/login" className="hover:text-white underline underline-offset-4">Ir para o login</Link></p>}>
      {done ? (
        <div role="status" className="text-center">
          <h1 className="font-display text-xl font-light text-black mb-4 tracking-wider">Senha alterada</h1>
          <p className="text-sm text-site-text2 font-light mb-6">Por segurança, todos os acessos anteriores foram encerrados.</p>
          <Link href="/admin/login" className="btn-primary w-full">Fazer login</Link>
        </div>
      ) : !token ? (
        <div className="text-center">
          <h1 className="font-display text-xl font-light text-black mb-4 tracking-wider">Link inválido</h1>
          <p className="text-sm text-site-text2 font-light mb-6">Este link está incompleto. Peça um novo.</p>
          <Link href="/admin/esqueci-senha" className="btn-primary w-full">Pedir novo link</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <h1 className="font-display text-xl font-light text-black mb-6 text-center tracking-wider">Criar nova senha</h1>
          {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-medium mb-5">{error}{/expirado|inválido/i.test(error) && <> <Link href="/admin/esqueci-senha" className="underline">Pedir novo link</Link></>}</div>}
          <div className="mb-4">
            <label htmlFor="pw" className="label-field">Nova senha</label>
            <input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} className="input-field" autoComplete="new-password" autoFocus required/>
          </div>
          <div className="mb-4">
            <label htmlFor="pw2" className="label-field">Repita a senha</label>
            <input id="pw2" type="password" value={pw2} onChange={e => setPw2(e.target.value)} className="input-field" autoComplete="new-password" required/>
          </div>
          <ul className="text-xs mb-6 space-y-1" aria-label="Requisitos da senha">
            {checks.map(([label, ok]) => <li key={label} className={ok ? 'text-green-700' : 'text-site-text3'}>{ok ? '✓' : '○'} {label}</li>)}
          </ul>
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? 'Salvando...' : 'Salvar nova senha'}</button>
        </form>
      )}
    </AuthLayout>
  );
}
