import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { authAPI, setToken } from '@/lib/api';
import { NOTRACK_KEY } from '@/lib/analytics';
import AuthLayout from '@/components/admin/AuthLayout';

export default function AdminLogin() {
  const router = useRouter();
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Já está logado? Vai direto para o painel.
  useEffect(() => { authAPI.verify().then(() => router.replace('/admin')).catch(() => {}); }, [router]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) { setError('Preencha usuário e senha.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.login(form.username.trim(), form.password);
      setToken(res.data.token);
      // Quem administra o site não deve inflar as estatísticas de visitas neste navegador
      try { localStorage.setItem(NOTRACK_KEY, '1'); } catch {}
      toast.success('Bem-vindo!');
      router.push('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível conectar ao servidor.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Admin" footer={
      <p><Link href="/admin/esqueci-senha" className="hover:text-white underline underline-offset-4">Esqueci minha senha</Link></p>
    }>
      <form onSubmit={handleSubmit} noValidate aria-label="Login do administrador">
        <h1 className="font-display text-xl font-light text-black mb-8 text-center tracking-wider">Acesso Restrito</h1>
        {error && <div role="alert" aria-live="assertive" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-medium mb-5">{error}</div>}
        <div className="mb-5">
          <label htmlFor="username" className="label-field">Usuário</label>
          <input id="username" type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="input-field" autoComplete="username" autoFocus required/>
        </div>
        <div className="mb-8">
          <label htmlFor="password" className="label-field">Senha</label>
          <input id="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="••••••••" autoComplete="current-password" required/>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </AuthLayout>
  );
}
