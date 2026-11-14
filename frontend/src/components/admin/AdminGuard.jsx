import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { authAPI, removeToken } from '@/lib/api';

// Nada do painel é montado/exibido antes de o servidor confirmar o login.
// (os dados já eram protegidos no servidor; isto evita também "piscar" a tela do admin
//  para quem não está logado e tira o painel dos buscadores)
export default function AdminGuard({ children }) {
  const router = useRouter();
  const [state, setState] = useState('checking'); // checking | ok | offline

  const check = useCallback(() => {
    setState('checking');
    authAPI.verify()
      .then(() => setState('ok'))
      .catch(err => {
        if (err.response) { removeToken(); router.replace('/admin/login'); } // 401/403: sessão inválida
        else setState('offline');                                              // servidor fora do ar
      });
  }, [router]);

  useEffect(() => { check(); }, [check]);

  return (
    <>
      <Head><meta name="robots" content="noindex,nofollow"/><title>Admin — Kaetano Antigo</title></Head>
      {state === 'ok' ? children : (
        <div className="min-h-screen bg-black flex items-center justify-center px-6 text-center">
          {state === 'offline' ? (
            <div>
              <p className="text-white text-sm mb-2">Não foi possível conectar ao servidor.</p>
              <p className="text-white/50 text-xs mb-6">Confira se o backend está rodando e tente de novo.</p>
              <button onClick={check} className="border border-white text-white px-6 py-2 text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all">Tentar novamente</button>
            </div>
          ) : <p className="text-white/50 text-xs tracking-widest uppercase animate-pulse">Verificando acesso…</p>}
        </div>
      )}
    </>
  );
}
