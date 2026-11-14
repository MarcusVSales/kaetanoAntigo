import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import AuthLayout from '@/components/admin/AuthLayout';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | sent
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Digite um e-mail válido.'); return; }
    setState('loading');
    try { await authAPI.forgotPassword(email.trim()); setState('sent'); }
    catch (err) {
      setState('idle');
      setError(err.response?.data?.error || 'Não foi possível conectar ao servidor.');
    }
  };

  return (
    <AuthLayout title="Recuperar senha" footer={<p><Link href="/admin/login" className="hover:text-white underline underline-offset-4">Voltar ao login</Link></p>}>
      {state === 'sent' ? (
        <div role="status" className="text-center">
          <h1 className="font-display text-xl font-light text-black mb-4 tracking-wider">Verifique seu e-mail</h1>
          <p className="text-sm text-site-text2 font-light leading-relaxed">
            Se esse e-mail for o do administrador, enviamos um link para criar uma nova senha.
            O link vale por <strong>30 minutos</strong> e só pode ser usado uma vez.
          </p>
          <p className="text-xs text-site-text3 mt-4">Não chegou? Veja a caixa de spam.</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate>
          <h1 className="font-display text-xl font-light text-black mb-3 text-center tracking-wider">Recuperar senha</h1>
          <p className="text-xs text-site-text2 font-light text-center mb-6 leading-relaxed">Informe o e-mail cadastrado do administrador. Enviaremos um link para criar uma nova senha.</p>
          {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-medium mb-5">{error}</div>}
          <div className="mb-6">
            <label htmlFor="email" className="label-field">E-mail</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" autoComplete="email" autoFocus required/>
          </div>
          <button type="submit" disabled={state === 'loading'} className="btn-primary w-full disabled:opacity-50">{state === 'loading' ? 'Enviando...' : 'Enviar link'}</button>
        </form>
      )}
    </AuthLayout>
  );
}
