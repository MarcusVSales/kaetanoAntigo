import { CATEGORIES } from '@/lib/categories';
const CATS = CATEGORIES;
export default function CategoryFilter({active,onChange,counts={}}){
  return(
    <nav aria-label="Filtrar por categoria">
      <ul className="flex flex-wrap gap-2 justify-center">
        <li><button onClick={()=>onChange(null)} aria-pressed={!active} className={`px-4 py-2 text-xs tracking-widest uppercase font-medium border transition-all ${!active?'bg-black text-white border-black':'text-black border-site-border hover:border-black'}`}>Todos {counts._total!==undefined&&<span className="ml-1 opacity-60">({counts._total})</span>}</button></li>
        {CATS.map(cat=>(
          <li key={cat}><button onClick={()=>onChange(cat===active?null:cat)} aria-pressed={active===cat} className={`px-4 py-2 text-xs tracking-widest uppercase font-medium border transition-all ${active===cat?'bg-black text-white border-black':'text-black border-site-border hover:border-black'}`}>{cat} {counts[cat]!==undefined&&<span className="ml-1 opacity-60">({counts[cat]})</span>}</button></li>
        ))}
      </ul>
    </nav>
  );
}
