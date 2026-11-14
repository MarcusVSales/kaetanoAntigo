import Link from 'next/link';
import { useRouter } from 'next/router';
import { Package, BarChart2, Activity, LogOut } from 'lucide-react';
import { removeToken } from '@/lib/api';

const TABS = [
  { key: 'produtos', href: '/admin',         label: 'Produtos', Icon: Package },
  { key: 'vendas',   href: '/admin/vendas',  label: 'Vendas',   Icon: BarChart2 },
  { key: 'visitas',  href: '/admin/visitas', label: 'Visitas',  Icon: Activity },
];

export default function AdminHeader({ current, children }) {
  const router = useRouter();
  const logout = () => { removeToken(); router.push('/admin/login'); };
  return (
    <header className="bg-black text-white px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40 flex-wrap gap-3">
      <div className="flex items-center gap-6 flex-wrap">
        <Link href="/admin" className="leading-tight" aria-label="Kaetano Antigo — painel admin" title="Painel admin">
          <span className="block font-bold tracking-[0.3em] uppercase text-sm">Kaetano</span>
          <span className="block font-light italic text-white/40 text-[10px] tracking-[0.5em] uppercase">Antigo · Admin</span>
        </Link>
        <nav aria-label="Seções do admin" className="flex items-center gap-1">
          {TABS.map(({ key, href, label, Icon }) => (
            <Link key={key} href={href} aria-current={current === key ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wider font-medium transition-colors ${current === key ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}>
              <Icon size={13}/> {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {children}
        <Link href="/" target="_blank" rel="noopener noreferrer" className="text-xs tracking-wider text-white/50 hover:text-white">Ver site</Link>
        <button onClick={logout} className="flex items-center gap-1.5 text-xs tracking-wider text-white/50 hover:text-white font-medium"><LogOut size={13}/> Sair</button>
      </div>
    </header>
  );
}
