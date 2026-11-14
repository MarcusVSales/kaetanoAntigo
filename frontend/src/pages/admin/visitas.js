import { useEffect, useState, useCallback } from 'react';
import { analyticsAPI } from '@/lib/api';
import { NOTRACK_KEY } from '@/lib/analytics';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminHeader from '@/components/admin/AdminHeader';

const PERIODS = [
  { days: 1, label: 'Hoje' }, { days: 7, label: '7 dias' }, { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' }, { days: 365, label: '12 meses' },
];

const fmtDur = s => {
  s = Math.round(s || 0);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), r = s % 60;
  return r ? `${m}min ${r}s` : `${m}min`;
};
const fmtNum = n => new Intl.NumberFormat('pt-BR').format(n || 0);

// Gera todos os dias (ou meses) do período, preenchendo com 0 os dias sem visita
function buildSeries(daily, days) {
  const map = Object.fromEntries(daily.map(d => [d.day, d]));
  const out = [];
  const now = new Date();
  if (days > 90) {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      out.push({ key, label: d.toLocaleDateString('pt-BR', { month: 'short' }), views: map[key]?.views || 0, sessions: map[key]?.sessions || 0 });
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({ key, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), views: map[key]?.views || 0, sessions: map[key]?.sessions || 0 });
    }
  }
  return out;
}

function Stat({ label, value, sub, accent }) {
  return (
    <div className="border border-site-border p-5">
      <p className="text-xs tracking-widest uppercase text-site-text3 font-medium mb-2 flex items-center gap-2">
        {accent && <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true"/>}{label}
      </p>
      <p className="font-display text-4xl font-light text-black">{value}</p>
      {sub && <p className="text-xs text-site-text3 mt-1">{sub}</p>}
    </div>
  );
}

function Bars({ items, total }) {
  if (!items.length) return <p className="text-sm text-site-text3 py-4">Sem dados no período.</p>;
  return (
    <ul className="space-y-3">
      {items.map(i => (
        <li key={i.name}>
          <div className="flex justify-between text-xs mb-1"><span className="text-black font-medium">{i.name}</span><span className="text-site-text3">{i.sessions} ({total ? Math.round(i.sessions / total * 100) : 0}%)</span></div>
          <div className="h-1.5 bg-site-bg2"><div className="h-full bg-black" style={{ width: `${total ? i.sessions / total * 100 : 0}%` }}/></div>
        </li>
      ))}
    </ul>
  );
}

function Visitas() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notrack, setNotrack] = useState(false);

  useEffect(() => { try { setNotrack(localStorage.getItem(NOTRACK_KEY) === '1'); } catch {} }, []);

  const load = useCallback(() => {
    analyticsAPI.summary(days).then(r => { setData(r.data); setError(''); })
      .catch(() => setError('Não foi possível carregar as estatísticas.'));
  }, [days]);

  useEffect(() => { setData(null); load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const toggleNotrack = e => {
    const on = e.target.checked; setNotrack(on);
    try { on ? localStorage.setItem(NOTRACK_KEY, '1') : localStorage.removeItem(NOTRACK_KEY); } catch {}
  };

  const series = data ? buildSeries(data.daily, data.days) : [];
  const max = Math.max(1, ...series.map(s => s.views));
  const totalSess = data ? data.totals.sessions : 0;
  const step = Math.ceil(series.length / 10);

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader current="visitas"/>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-light text-black">Visitas do site</h1>
            <p className="text-xs text-site-text3 mt-1">Atualiza sozinho a cada 30 segundos. Dados anônimos: sem cookies e sem endereço de IP.</p>
          </div>
          <div className="flex border border-black" role="group" aria-label="Período">
            {PERIODS.map(p => (
              <button key={p.days} onClick={() => setDays(p.days)} aria-pressed={days === p.days}
                className={`px-4 py-2 text-xs tracking-wider font-medium transition-colors ${days === p.days ? 'bg-black text-white' : 'bg-white text-black hover:bg-site-bg2'}`}>{p.label}</button>
            ))}
          </div>
        </div>

        {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-medium mb-6">{error}</div>}
        {!data && !error && <p className="text-site-text3 text-sm animate-pulse py-20 text-center">Carregando…</p>}

        {data && (<>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            <Stat label="Online agora" accent value={fmtNum(data.online)} sub="ativos nos últimos 5 min"/>
            <Stat label="Visitantes" value={fmtNum(data.totals.sessions)} sub="visitas ao site"/>
            <Stat label="Páginas vistas" value={fmtNum(data.totals.views)} sub={`${data.totals.pagesPerSession} por visita`}/>
            <Stat label="Tempo médio" value={fmtDur(data.totals.avgSessionSec)} sub="por visita"/>
          </div>

          <section className="border border-site-border p-6 mb-10" aria-labelledby="h-daily">
            <h2 id="h-daily" className="text-xs tracking-widest uppercase text-site-text2 font-medium mb-6">Páginas vistas {data.days > 90 ? 'por mês' : 'por dia'}</h2>
            <div className={`flex items-end gap-1 h-40 ${series.length < 14 ? 'justify-center' : ''}`} role="img" aria-label={`Gráfico de páginas vistas. Total: ${data.totals.views}`}>
              {series.map(s => (
                <div key={s.key} className="flex-1 max-w-[56px] flex flex-col justify-end h-full group relative min-w-[3px]" title={`${s.label}: ${s.views} páginas · ${s.sessions} visitantes`}>
                  <div className="bg-black group-hover:bg-zinc-500 transition-colors" style={{ height: `${s.views ? Math.max(3, s.views / max * 100) : 0}%` }}/>
                </div>
              ))}
            </div>
            <div className={`flex gap-1 mt-2 ${series.length < 14 ? 'justify-center' : ''}`}>
              {series.map((s, i) => <div key={s.key} className="flex-1 max-w-[56px] text-center text-[10px] text-site-text3 min-w-[3px] overflow-visible whitespace-nowrap">{i % step === 0 ? s.label : ''}</div>)}
            </div>
          </section>

          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            <section className="lg:col-span-2 border border-site-border" aria-labelledby="h-pages">
              <h2 id="h-pages" className="text-xs tracking-widest uppercase text-site-text2 font-medium p-5 border-b border-site-border">Telas mais visitadas</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-site-bg2 text-left">
                    <th className="px-5 py-2.5 text-xs tracking-widest uppercase text-site-text3 font-medium">Tela</th>
                    <th className="px-3 py-2.5 text-xs tracking-widest uppercase text-site-text3 font-medium text-right">Vistas</th>
                    <th className="px-3 py-2.5 text-xs tracking-widest uppercase text-site-text3 font-medium text-right">Visitantes</th>
                    <th className="px-5 py-2.5 text-xs tracking-widest uppercase text-site-text3 font-medium text-right">Tempo médio</th>
                  </tr></thead>
                  <tbody>
                    {data.pages.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-site-text3">Nenhuma visita registrada neste período.</td></tr>}
                    {data.pages.map(p => (
                      <tr key={p.path} className="border-t border-site-border">
                        <td className="px-5 py-3 text-sm text-black font-medium">{p.label}<span className="block text-[11px] text-site-text3 font-mono font-normal">{p.path}</span></td>
                        <td className="px-3 py-3 text-sm text-right">{fmtNum(p.views)}</td>
                        <td className="px-3 py-3 text-sm text-right text-site-text2">{fmtNum(p.sessions)}</td>
                        <td className="px-5 py-3 text-sm text-right text-site-text2">{fmtDur(p.avgSec)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="space-y-6">
              <section className="border border-site-border p-5" aria-labelledby="h-ref">
                <h2 id="h-ref" className="text-xs tracking-widest uppercase text-site-text2 font-medium mb-4">De onde vieram</h2>
                <Bars items={data.referrers} total={totalSess}/>
              </section>
              <section className="border border-site-border p-5" aria-labelledby="h-dev">
                <h2 id="h-dev" className="text-xs tracking-widest uppercase text-site-text2 font-medium mb-4">Aparelho</h2>
                <Bars items={data.devices} total={totalSess}/>
              </section>
            </div>
          </div>

          <section className="border border-site-border mb-10" aria-labelledby="h-j">
            <h2 id="h-j" className="text-xs tracking-widest uppercase text-site-text2 font-medium p-5 border-b border-site-border">Últimas visitas — por onde cada pessoa passou</h2>
            {data.journeys.length === 0 && <p className="px-5 py-10 text-center text-sm text-site-text3">Nenhuma visita registrada neste período.</p>}
            <ol>
              {data.journeys.map((j, i) => (
                <li key={i} className="px-5 py-4 border-t border-site-border first:border-t-0">
                  <p className="text-xs text-site-text3 mb-2">
                    {new Date(j.start).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{j.pages} página{j.pages !== 1 ? 's' : ''}{' · '}tempo total {fmtDur(j.seconds)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {j.steps.map((s, k) => (
                      <span key={k} className="flex items-center gap-1.5">
                        {k > 0 && <span className="text-site-text3" aria-hidden="true">→</span>}
                        <span className="border border-site-border px-2 py-1 text-black">{s.label} <span className="text-site-text3">{fmtDur(s.seconds)}</span></span>
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </>)}

        <label className="flex items-start gap-3 text-xs text-site-text2 border border-site-border p-4 cursor-pointer">
          <input type="checkbox" checked={notrack} onChange={toggleNotrack} className="mt-0.5 w-4 h-4 accent-black"/>
          <span><strong className="text-black">Não contar minhas visitas neste navegador.</strong> Ligado automaticamente quando você entra no admin, para o seu uso não inflar os números. Desligue se quiser testar o monitor.</span>
        </label>
      </div>
    </div>
  );
}

export default function VisitasPage() { return <AdminGuard><Visitas/></AdminGuard>; }
