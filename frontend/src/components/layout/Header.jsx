import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, Search } from 'lucide-react';

import { CATEGORIES } from '@/lib/categories';
const NAV = [
  {href:'/',label:'Início'},{href:'/acervo-colecao',label:'Acervo'},
  {href:'/vendidos',label:'Vendidos'},{href:'/restauro',label:'Restauro'},
  {href:'/nossa-historia',label:'Nossa História'},{href:'/contato',label:'Contato'},
];
const CATS = CATEGORIES;

export default function Header() {
  const [menuOpen,setMenuOpen]=useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [hidden,setHidden]=useState(false);
  const [atTop,setAtTop]=useState(true);
  const lastY=useRef(0);
  const router=useRouter();

  useEffect(()=>{
    const onScroll=()=>{const y=window.scrollY;setAtTop(y<10);setHidden(y>lastY.current&&y>80);lastY.current=y;};
    window.addEventListener('scroll',onScroll,{passive:true});
    return()=>window.removeEventListener('scroll',onScroll);
  },[]);
  useEffect(()=>{setMenuOpen(false);setSearchOpen(false);},[router.asPath]);

  const handleSearch=e=>{
    e.preventDefault();
    if(query.trim()){router.push(`/acervo-colecao?busca=${encodeURIComponent(query.trim())}`);setSearchOpen(false);setQuery('');}
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${hidden?'-translate-y-full':'translate-y-0'} ${atTop?'bg-white':'bg-white/95 backdrop-blur-sm shadow-sm'}`}>
      <div className="bg-black text-white text-center py-2 text-xs tracking-[0.25em] uppercase font-light">
        Mobiliário do clássico ao modernista
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative flex items-center justify-between py-5 border-b border-site-border">
          <button onClick={()=>setMenuOpen(!menuOpen)} className="md:hidden p-1 text-black" aria-label="Menu">
            {menuOpen?<X size={22}/>:<Menu size={22}/>}
          </button>
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 z-10 px-4 py-1 text-center cursor-pointer" aria-label="Kaetano Antigo — ir para a página inicial" title="Página inicial">
            <span className="block font-bold text-2xl md:text-3xl tracking-[0.35em] text-black uppercase leading-none">Kaetano</span>
            <span className="block font-light italic text-[10px] md:text-xs tracking-[0.6em] text-black uppercase mt-1">Antigo</span>
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={()=>setSearchOpen(s=>!s)} aria-label="Buscar" className="p-1 text-black hover:text-zinc-500 transition-colors"><Search size={18}/></button>
            <Link href="/contato" className="hidden md:block text-xs tracking-widest uppercase font-medium text-black hover:text-zinc-500 transition-colors">Contato</Link>
          </div>
        </div>
        {searchOpen&&(
          <div className="py-3 border-b border-site-border animate-fade-in-up">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto" role="search">
              <label htmlFor="header-search" className="sr-only">Buscar</label>
              <input id="header-search" type="search" autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar peças, categorias, décadas..." className="input-field flex-1 py-2 text-xs"/>
              <button type="submit" className="btn-primary py-2 px-4 text-xs">Buscar</button>
            </form>
          </div>
        )}
        <nav aria-label="Navegação" className="hidden md:block">
          <ul className="flex items-center justify-center gap-8 py-3">
            {NAV.map(item=>(
              <li key={item.href}>
                <Link href={item.href} className={`text-xs tracking-widest uppercase font-medium transition-colors ${router.pathname===item.href?'text-black border-b border-black pb-0.5':'text-site-text2 hover:text-black'}`}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {menuOpen&&(
        <nav className="md:hidden bg-white border-t border-site-border">
          <div className="px-5 py-3 border-b border-site-border">
            <form onSubmit={handleSearch} className="flex gap-2" role="search">
              <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar..." className="input-field flex-1 py-2 text-xs"/>
              <button type="submit" className="btn-primary py-2 px-3 text-xs">Ir</button>
            </form>
          </div>
          <ul className="py-4 px-5 space-y-1">
            {[...NAV,...CATS.map(c=>({href:`/acervo-colecao?categoria=${encodeURIComponent(c)}`,label:c}))].map(item=>(
              <li key={item.href+item.label}>
                <Link href={item.href} className="block py-2 text-xs tracking-widest uppercase font-medium text-black hover:text-zinc-500">{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
