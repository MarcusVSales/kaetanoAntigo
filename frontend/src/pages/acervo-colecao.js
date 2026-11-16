import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Search } from 'lucide-react';
import { productsAPI } from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import CategoryFilter from '@/components/products/CategoryFilter';
import { normalizeCategory } from '@/lib/categories';

export default function AcervoColecao() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeCategory, setActiveCat] = useState(null);
  const [query,    setQuery]    = useState('');
  const [counts,   setCounts]   = useState({});

  useEffect(() => {
    if (!router.isReady) return;
    setActiveCat(normalizeCategory(router.query.categoria));
    setQuery(router.query.busca || '');
  }, [router.isReady, router.query.categoria, router.query.busca]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pr, cr] = await Promise.all([
          productsAPI.list(activeCategory ? { category: activeCategory } : {}),
          productsAPI.categories()
        ]);
        let data = pr.data;
        if (query) {
          const q = query.toLowerCase();
          data = data.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.description||'').toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.decade||'').includes(q)
          );
        }
        setProducts(data);
        const cm = { _total: data.length };
        cr.data.forEach(c => { cm[c.category] = c.count; });
        setCounts(cm);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [activeCategory, query]);

  const handleCatChange = cat => {
    setActiveCat(cat);
    router.push({ pathname:'/acervo-colecao', query:{ ...(cat?{categoria:cat}:{}), ...(query?{busca:query}:{}) } }, undefined, { shallow:true });
  };

  const handleSearch = e => {
    e.preventDefault();
    router.push({ pathname:'/acervo-colecao', query:{ ...(activeCategory?{categoria:activeCategory}:{}), ...(query?{busca:query}:{}) } }, undefined, { shallow:true });
  };

  return (
    <>
        
<Head>
  <title>
    {activeCategory
      ? `${activeCategory} | Acervo Kaetano Antigo`
      : 'Acervo de Móveis Antigos e Modernistas | Kaetano Antigo'}
  </title>

  <meta
    name="description"
    content="Explore o acervo da Kaetano Antigo, antiquário em São Paulo. Encontre móveis clássicos, modernistas e peças selecionadas para ambientes com personalidade."
  />

  <meta
    name="robots"
    content="index, follow"
  />

  <link
    rel="canonical"
    href="https://kaetanoantigo.com.br/acervo-colecao"
  />

  <meta
    property="og:type"
    content="website"
  />

  <meta
    property="og:title"
    content="Acervo de Móveis Antigos e Modernistas | Kaetano Antigo"
  />

  <meta
    property="og:description"
    content="Conheça nossa seleção de móveis clássicos e modernistas em São Paulo."
  />

  <meta
    property="og:url"
    content="https://kaetanoantigo.com.br/acervo-colecao"
  />

  <meta
    property="og:locale"
    content="pt_BR"
  />

  <meta
    property="og:site_name"
    content="Kaetano Antigo"
  />

      </Head>
      <section className="text-center py-14 bg-site-bg2 border-b border-site-border">
        <h1 className="section-title">{activeCategory || 'Acervo'}</h1>
        <div className="section-divider"/>
        <p className="text-site-text3 text-xs tracking-widest mt-3 font-medium uppercase">
          {loading ? '...' : `${products.length} peça${products.length!==1?'s':''}`}
        </p>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mb-10" role="search">
          <label htmlFor="col-search" className="sr-only">Buscar</label>
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-site-text3"/>
            <input id="col-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nome, categoria, década..." className="input-field pl-9 py-2.5 text-xs"/>
          </div>
          <button type="submit" className="btn-primary py-2 px-5 text-xs">Buscar</button>
        </form>
        <div className="mb-12"><CategoryFilter active={activeCategory} onChange={handleCatChange} counts={counts}/></div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({length:8}).map((_,i)=><div key={i} className="animate-pulse"><div className="aspect-[3/4] bg-site-border mb-4"/><div className="h-3 bg-site-bg2 w-1/3 mb-2"/><div className="h-5 bg-site-border w-3/4"/></div>)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24"><p className="font-display text-2xl font-light text-site-text2 mb-2">Nenhuma peça encontrada</p><p className="text-xs text-site-text3">Tente outro termo ou categoria.</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
            {products.map((p,i)=><div key={p.id} role="listitem"><ProductCard product={p} index={i}/></div>)}
          </div>
        )}
      </div>
    </>
  );
}
