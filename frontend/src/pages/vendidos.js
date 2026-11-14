import Head from 'next/head';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { productsAPI, getThumbUrl, thumbFallback } from '@/lib/api';

export default function Vendidos() {
  const [all,setAll]=useState([]);
  const [filtered,setFiltered]=useState([]);
  const [loading,setLoading]=useState(true);
  const [query,setQuery]=useState('');

  useEffect(()=>{
    productsAPI.archive().then(r=>{setAll(r.data);setFiltered(r.data);}).catch(console.error).finally(()=>setLoading(false));
  },[]);

  const handleSearch=e=>{
    e.preventDefault();
    if(!query.trim()){setFiltered(all);return;}
    const q=query.toLowerCase();
    setFiltered(all.filter(p=>p.name.toLowerCase().includes(q)||p.category.toLowerCase().includes(q)||(p.decade||'').includes(q)));
  };

  return (
    <>
      <Head>
        <title>Vendidos — Kaetano Antigo</title>
        <meta name="description" content="Peças que já passaram por aqui e já estão em um novo lar."/>
      </Head>
      <section className="text-center py-14 bg-site-bg2 border-b border-site-border">
        <h1 className="section-title">Vendidos</h1>
        <div className="section-divider"/>
        <p className="text-site-text3 text-sm font-light mt-3 max-w-sm mx-auto">Peças que já passaram por aqui <br></br>e já estão em um novo lar</p>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto mb-12" role="search">
          <label htmlFor="vend-search" className="sr-only">Buscar vendidos</label>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-site-text3"/>
            <input id="vend-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar nos vendidos..." className="input-field pl-9 py-2.5 text-xs"/>
          </div>
          <button type="submit" className="btn-primary py-2 px-4 text-xs">Buscar</button>
        </form>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {Array.from({length:4}).map((_,i)=><div key={i}><div className="aspect-[3/4] bg-site-border mb-4"/><div className="h-4 bg-site-bg2 w-3/4"/></div>)}
          </div>
        ) : filtered.length===0 ? (
          <div className="text-center py-20"><p className="font-display text-2xl font-light text-site-text2">Nenhuma peça encontrada</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((p,i)=>(
              <article key={p.id} className="opacity-70 hover:opacity-90 transition-opacity animate-fade-in-up" style={{animationDelay:`${i*60}ms`,animationFillMode:'both'}}>
                <div className="relative aspect-[3/4] bg-site-bg2 overflow-hidden mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getThumbUrl(p.primary_image)} alt={`${p.name} - vendido`} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={e => thumbFallback(e, p.primary_image)}/>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-black/70 text-white text-xs tracking-widest uppercase px-4 py-2 font-medium">Vendido</span>
                  </div>
                </div>
                <p className="text-xs tracking-widest uppercase text-site-text3 mb-1 font-medium">{p.category}</p>
                <p className="font-display text-base font-light text-site-text2">{p.name}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
