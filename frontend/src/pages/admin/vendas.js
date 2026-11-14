import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, FileSpreadsheet, Download } from 'lucide-react';
import { productsAPI, authAPI } from '@/lib/api';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminHeader from '@/components/admin/AdminHeader';

const CY = new Date().getFullYear();
const YEARS  = Array.from({ length: CY - 1799 + 10 }, (_, i) => String(CY + 10 - i));
const MONTHS = [
  {v:'',  l:'Todos os meses'},
  {v:'01',l:'Janeiro'},{v:'02',l:'Fevereiro'},{v:'03',l:'Março'},
  {v:'04',l:'Abril'},{v:'05',l:'Maio'},{v:'06',l:'Junho'},
  {v:'07',l:'Julho'},{v:'08',l:'Agosto'},{v:'09',l:'Setembro'},
  {v:'10',l:'Outubro'},{v:'11',l:'Novembro'},{v:'12',l:'Dezembro'},
];

// Extrai partes de datas no formato DD/MM/YYYY ou YYYY
function parseSoldDate(raw) {
  if (!raw) return { day:'', month:'', year:'' };
  raw = raw.trim();
  // DD/MM/YYYY
  const full = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (full) return { day: full[1], month: full[2], year: full[3] };
  // MM/YYYY
  const my = raw.match(/^(\d{2})\/(\d{4})$/);
  if (my) return { day: '', month: my[1], year: my[2] };
  // YYYY
  const y = raw.match(/^(\d{4})$/);
  if (y) return { day: '', month: '', year: y[1] };
  return { day:'', month:'', year: raw };
}

function fmtDoc(doc) {
  if (!doc) return '—';
  const d = doc.replace(/\D/g,'');
  if (d.length <= 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function AdminVendas() {
  const router = useRouter();
  const [sold,    setSold]  = useState([]);
  const [loading, setLoad]  = useState(true);
  const [year,    setYear]  = useState(String(CY));
  const [month,   setMonth] = useState('');

  useEffect(() => {
    authAPI.verify()
      .then(() => productsAPI.adminList())
      .then(r  => setSold(r.data.filter(p => p.sold)))
      .catch(() => router.push('/admin/login'))
      .finally(() => setLoad(false));
  }, []);

  const fmt = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);

  // Filtra por ano E mês
  const filtered = sold.filter(p => {
    const { year: y, month: m } = parseSoldDate(p.sold_date);
    if (year  && y !== year)  return false;
    if (month && m !== month) return false;
    return true;
  });

  const total     = sold.reduce((s,p)=>s+(Number(p.sold_price)||0), 0);
  const totalFilt = filtered.reduce((s,p)=>s+(Number(p.sold_price)||0), 0);

  // Balancete agrupado por ANO/MÊS dependendo do filtro ativo
  const grouped = sold.reduce((acc, p) => {
    const { year: y, month: m } = parseSoldDate(p.sold_date);
    // Se filtrou por ano, agrupa por mês; senão agrupa por ano
    const key = year ? (m ? `${MONTHS.find(x=>x.v===m)?.l || m}/${y}` : y) : (y || 'Sem data');
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  // Filtra o balancete pelo ano/mês selecionado
  const groupedFiltered = Object.fromEntries(
    Object.entries(grouped).filter(([key, items]) => {
      return items.some(p => {
        const { year: y, month: m } = parseSoldDate(p.sold_date);
        if (year  && y !== year)  return false;
        if (month && m !== month) return false;
        return true;
      });
    }).map(([key, items]) => [
      key,
      items.filter(p => {
        const { year: y, month: m } = parseSoldDate(p.sold_date);
        if (year  && y !== year)  return false;
        if (month && m !== month) return false;
        return true;
      })
    ])
  );

  // ── Exportar Excel ────────────────────────────────────────────────────────
  const exportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const label = [
        year,
        month ? MONTHS.find(m2=>m2.v===month)?.l : '',
      ].filter(Boolean).join(' — ') || 'Geral';

      const rows = filtered.map(p => ({
        'Data da Venda':       p.sold_date || '—',
        'Peça':                p.name,
        'Categoria':           p.category,
        'Ano do Móvel':        p.decade || '—',
        'Nome do Comprador':   p.buyer_name || '—',
        'CPF/CNPJ':            p.buyer_doc ? fmtDoc(p.buyer_doc) : '—',
        'Forma de Pagamento':  p.payment_method || '—',
        'Preço Anunciado':     p.price      ? Number(p.price)      : '',
        'Valor de Venda':      p.sold_price ? Number(p.sold_price) : '',
      }));

      rows.push({
        'Data da Venda': `TOTAL (${filtered.length} peça${filtered.length!==1?'s':''})`,
        'Peça':'','Categoria':'','Ano do Móvel':'',
        'Nome do Comprador':'','CPF/CNPJ':'','Forma de Pagamento':'',
        'Preço Anunciado':'','Valor de Venda': totalFilt,
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{wch:14},{wch:32},{wch:14},{wch:13},{wch:25},{wch:20},{wch:20},{wch:18},{wch:16}];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Vendas ${label}`);
      XLSX.writeFile(wb, `kaetano-vendas-${label.toLowerCase().replace(/\s/g,'-')}.xlsx`);
    } catch(e) {
      console.error(e);
      alert('Erro ao exportar.');
    }
  };

  const periodLabel = [
    month ? MONTHS.find(m2=>m2.v===month)?.l : '',
    year,
  ].filter(Boolean).join('/')  || 'Geral';

  return (
    <>
      <Head><title>Vendas — Kaetano Antigo Admin</title></Head>
      <div className="min-h-screen bg-white">

        {/* Header */}
        <AdminHeader current="vendas">
          {/* Filtros: mês + ano + export */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro MÊS */}
            <select value={month} onChange={e=>setMonth(e.target.value)}
              className="bg-white text-black border border-white/20 px-3 py-1.5 text-xs font-medium min-w-[120px]">
              {MONTHS.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
            {/* Filtro ANO */}
            <select value={year} onChange={e=>setYear(e.target.value)}
              className="bg-white text-black border border-white/20 px-3 py-1.5 text-xs font-medium">
              <option value="">Todos os anos</option>
              {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 bg-white text-black px-4 py-1.5 text-xs font-medium hover:bg-white/90 transition-all whitespace-nowrap">
              <FileSpreadsheet size={13}/> Exportar Excel
            </button>
          </div>
        </AdminHeader>


          

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

          {/* Card total */}
          <div className="border border-site-border p-8 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-xs tracking-widest uppercase text-site-text3 font-medium mb-2">
                Total — {periodLabel}
              </p>
              <p className="font-display text-5xl font-light text-black">{fmt(totalFilt)}</p>
              <p className="text-sm text-site-text3 mt-2">{filtered.length} peça{filtered.length!==1?'s':''} vendida{filtered.length!==1?'s':''}</p>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <p className="text-xs text-site-text3 font-medium">Total Histórico</p>
              <p className="font-display text-2xl font-light text-site-text2">{fmt(total)}</p>
              <p className="text-xs text-site-text3">{sold.length} peça{sold.length!==1?'s':''} no total</p>
            </div>
          </div>

          {/* Balancete */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-light text-black">
              Balancete {year ? `— ${periodLabel}` : 'Geral'}
            </h2>
            {/* Botão exportar só o balancete filtrado */}
            <button onClick={exportExcel}
              className="flex items-center gap-1.5 border border-black text-black px-3 py-1.5 text-xs font-medium hover:bg-black hover:text-white transition-all">
              <Download size={13}/> Exportar {periodLabel}
            </button>
          </div>
          {loading ? <p className="text-site-text3 text-sm mb-12 animate-pulse">Carregando...</p> : (
            <div className="border border-site-border mb-12 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-site-border bg-site-bg2">
                    <th className="text-left px-5 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium">
                      {year ? 'Mês' : 'Ano'}
                    </th>
                    <th className="text-center px-5 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium">Peças</th>
                    <th className="text-right px-5 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedFiltered).sort((a,b)=>b[0].localeCompare(a[0])).map(([key, items])=>(
                    <tr key={key} className="border-b border-site-border hover:bg-site-bg2">
                      <td className="px-5 py-3 text-sm text-black font-medium">{key}</td>
                      <td className="px-5 py-3 text-center text-sm text-site-text2">{items.length}</td>
                      <td className="px-5 py-3 text-right text-sm text-black">
                        {fmt(items.reduce((s,p)=>s+(Number(p.sold_price)||0),0))}
                      </td>
                    </tr>
                  ))}
                  {Object.keys(groupedFiltered).length===0&&(
                    <tr><td colSpan={3} className="text-center py-12 text-site-text3 text-sm">Nenhuma venda no período</td></tr>
                  )}
                </tbody>
                <tfoot className="border-t-2 border-black">
                  <tr>
                    <td className="px-5 py-3 text-sm font-bold text-black">Total</td>
                    <td className="px-5 py-3 text-center text-sm font-bold text-black">{filtered.length}</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-black">{fmt(totalFilt)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Lista de peças */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-light text-black">
              Peças Vendidas {periodLabel !== 'Geral' ? `— ${periodLabel}` : ''}
            </h2>
            <button onClick={exportExcel} className="flex items-center gap-1.5 border border-black text-black px-3 py-1.5 text-xs font-medium hover:bg-black hover:text-white transition-all">
              <Download size={13}/> Exportar
            </button>
          </div>

          <div className="border border-site-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-site-border bg-site-bg2">
                    <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium">Data Venda</th>
                    <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium">Peça</th>
                    <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium hidden sm:table-cell">Comprador</th>
                    <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium hidden lg:table-cell">CPF/CNPJ</th>
                    <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium hidden xl:table-cell">Pagamento</th>
                    <th className="text-right px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0
                    ? <tr><td colSpan={6} className="text-center py-14 text-site-text3 text-sm">Nenhuma venda no período</td></tr>
                    : filtered.map(p=>(
                    <tr key={p.id} className="border-b border-site-border hover:bg-site-bg2">
                      <td className="px-4 py-3 text-xs text-site-text2 font-mono whitespace-nowrap">{p.sold_date||'—'}</td>
                      <td className="px-4 py-3 text-sm text-black font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-xs text-site-text2 hidden sm:table-cell">{p.buyer_name||'—'}</td>
                      <td className="px-4 py-3 text-xs text-site-text2 font-mono hidden lg:table-cell">{fmtDoc(p.buyer_doc)}</td>
                      <td className="px-4 py-3 text-xs text-site-text2 hidden xl:table-cell">{p.payment_method||'—'}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-black">{p.sold_price?fmt(p.sold_price):'—'}</td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length>0&&(
                  <tfoot className="border-t-2 border-black">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-sm font-bold text-black">Total {periodLabel}</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-black">{fmt(totalFilt)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminVendasPage() {
  return <AdminGuard><AdminVendas/></AdminGuard>;
}
