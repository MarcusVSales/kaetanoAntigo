import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, LogOut, Search, BarChart2, X, RotateCcw } from 'lucide-react';
import { productsAPI, authAPI, getImageUrl, getThumbUrl, thumbFallback } from '@/lib/api';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminHeader from '@/components/admin/AdminHeader';
import dynamic from 'next/dynamic';

import { CATEGORIES } from '@/lib/categories';
const ImageCropper = dynamic(() => import('@/components/products/ImageCropper'), { ssr: false });

const CATS = CATEGORIES;
const MAX_FEAT  = 7;
const CY        = new Date().getFullYear();
const ALL_YEARS = Array.from({ length: CY - 1799 }, (_, i) => String(CY + 10 - i)); // até 10 anos no futuro
const SALE_YEARS= Array.from({ length: CY - 1799 }, (_, i) => String(CY + 10 - i));
const EMPTY     = { name:'', description:'', category:CATS[0], price:'', quantity:1, visible:true, featured:false, sold:false, decade:'', sold_date:'', sold_price:'', buyer_name:'', buyer_doc:'', payment_method:'' };
const PAYMENT_METHODS = ['Dinheiro','PIX','Cartão de Crédito','Cartão de Débito','Transferência Bancária','Cheque','Outro'];

function AdminDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [filter,   setFilter]   = useState('all');
  const [search,   setSearch]   = useState('');
  const [form,     setForm]     = useState(EMPTY);
  const [formErr,  setFormErr]  = useState('');
  const [cropModal,   setCropModal]   = useState(false);
  const [cropImage,   setCropImage]   = useState(null);
  const [cropProduct, setCropProduct] = useState(null);
  const [imgModal,    setImgModal]    = useState(false);
  const [imgProduct,  setImgProduct]  = useState(null);
  const [imgList,     setImgList]     = useState([]);

  useEffect(() => {
    authAPI.verify().then(() => load()).catch(() => router.push('/admin/login'));
  }, []);

  const load = async () => {
    setLoading(true);
    try { const r = await productsAPI.adminList(); setProducts(r.data); }
    catch { toast.error('Erro ao carregar produtos'); }
    finally { setLoading(false); }
  };

  const featuredCount = products.filter(p => p.featured && !p.sold).length;

  const openCreate = () => { setEditing(null); setForm(EMPTY); setFormErr(''); setModal(true); };
  const openEdit   = p  => {
    setEditing(p);
    setForm({
      name:p.name, description:p.description||'', category:p.category,
      price:p.price||'', quantity:p.quantity||1,
      visible:!!p.visible, featured:!!p.featured, sold:!!p.sold,
      decade:p.decade||'', sold_date:p.sold_date||'',
      sold_price:p.sold_price||'', buyer_name:p.buyer_name||'',
      buyer_doc:p.buyer_doc||'', payment_method:p.payment_method||'',
    });
    setFormErr(''); setModal(true);
  };

  const setField = (k, v) => {
    setFormErr('');
    if (k==='sold'     && v===true  && form.featured) { setFormErr('Remova o destaque antes de marcar como vendido.'); return; }
    if (k==='featured' && v===true  && form.sold)     { setFormErr('Remova "vendido" antes de marcar como destaque.'); return; }
    if (k==='featured' && v===true  && !form.featured) {
      const cur = editing ? products.filter(p=>p.featured&&!p.sold&&p.id!==editing.id).length : featuredCount;
      if (cur >= MAX_FEAT) { setFormErr(`Limite de ${MAX_FEAT} destaques atingido!`); return; }
    }
    if (k==='sold' && v===false) { setForm(f=>({...f,sold:false,sold_date:'',sold_price:'',buyer_name:'',buyer_doc:'',payment_method:''})); return; }
    // CPF/CNPJ: só números
    if (k==='buyer_doc') { v = v.replace(/\D/g,'').slice(0,14); }
    setForm(f=>({...f,[k]:v}));
  };

  const save = async () => {
    if (!form.name || !form.category) { toast.error('Nome e categoria são obrigatórios'); return; }
    if (form.sold && !form.sold_date) { setFormErr('Informe o ano da venda antes de salvar.'); return; }
    if (formErr) return;
    try {
      const payload = {
        ...form,
        price:      form.price      ? Number(form.price)      : null,
        sold_price: form.sold_price ? Number(form.sold_price) : null,
        featured:   form.sold       ? false                   : form.featured,
      };
      editing ? await productsAPI.update(editing.id, payload) : await productsAPI.create(payload);
      toast.success(editing ? 'Produto atualizado!' : 'Produto criado!');
      setModal(false); load();
    } catch { toast.error('Erro ao salvar produto'); }
  };

  const unmarkSold = async p => {
    if (!confirm(`Desfazer a venda de "${p.name}"?\n\nA peça voltará ao acervo e os dados de venda serão apagados.`)) return;
    try { await productsAPI.unmarkSold(p.id); toast.success('Venda desfeita! Peça voltou ao acervo.'); load(); }
    catch { toast.error('Erro ao desfazer venda'); }
  };

  const remove = async p => {
    if (!confirm(`Remover "${p.name}" permanentemente?`)) return;
    try { await productsAPI.remove(p.id); toast.success('Removido!'); load(); }
    catch { toast.error('Erro'); }
  };

  const toggleVisible = async p => {
    try { await productsAPI.update(p.id,{visible:!p.visible}); load(); }
    catch { toast.error('Erro'); }
  };

  const openImgManager = async pid => {
    try {
      const r = await productsAPI.get(pid);
      setImgProduct(r.data);
      setImgList(r.data.images || []);
      setImgModal(true);
    } catch { toast.error('Erro ao carregar fotos'); }
  };

  const uploadImages = async (pid, files) => {
    if (!files.length) return;
    try {
      await productsAPI.uploadImages(pid, Array.from(files));
      toast.success('Fotos enviadas!');
      load();
      // Recarrega o modal se estiver aberto
      if (imgProduct?.id === pid) openImgManager(pid);
    } catch { toast.error('Erro no upload'); }
  };

  const deleteImg = async (pid, iid) => {
    if (!confirm('Remover esta foto?')) return;
    try { await productsAPI.deleteImage(pid,iid); toast.success('Removida'); openImgManager(pid); load(); }
    catch { toast.error('Erro'); }
  };

  const setPrimary = async (pid, iid) => {
    try { await productsAPI.setPrimaryImage(pid,iid); toast.success('Foto de destaque definida!'); openImgManager(pid); load(); }
    catch { toast.error('Erro'); }
  };

const setImageOrder = async (pid, iid, position) => {
  try {
    await productsAPI.setImageOrder(pid, iid, Number(position));
    toast.success('Posição atualizada!');
    await openImgManager(pid);
    load();
  } catch {
    toast.error('Erro ao atualizar posição');
  }
};

  const openCrop = (product, image) => {
    setCropProduct(product);
    setCropImage(image);
    setCropModal(true);
  };

  const saveCrop = async (croppedArea) => {
    try {
      await productsAPI.saveCrop(cropProduct.id, cropImage.id, croppedArea);
      toast.success('Recorte salvo!');
      setCropModal(false);
      load();
    } catch { toast.error('Erro ao salvar recorte'); }
  };

  // Busca por nome OU CPF/CNPJ
  const filtered = products.filter(p => {
    const fm =
      filter==='all'      ? true :
      filter==='active'   ? p.visible && !p.sold :
      filter==='sold'     ? p.sold :
      filter==='hidden'   ? !p.visible :
      filter==='featured' ? p.featured && !p.sold : true;
    const q = search.toLowerCase().replace(/\D/g,''); // remove não-dígitos para busca de CPF/CNPJ
    if (!search) return fm;
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat  = p.category.toLowerCase().includes(search.toLowerCase());
    const matchDoc  = q && p.buyer_doc && p.buyer_doc.replace(/\D/g,'').includes(q);
    return fm && (matchName || matchCat || matchDoc);
  });

  const fmt    = v => v ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v) : '—';

  const STATS = [
    { key:'all',      label:'Total',     val:products.length },
    { key:'active',   label:'Ativos',    val:products.filter(p=>p.visible&&!p.sold).length },
    { key:'featured', label:'Destaques', val:featuredCount, warn:featuredCount>=MAX_FEAT },
    { key:'sold',     label:'Vendidos',  val:products.filter(p=>p.sold).length },
    { key:'hidden',   label:'Ocultos',   val:products.filter(p=>!p.visible).length },
  ];

  return (
    <>
      <Head><title>Admin — Kaetano Antigo</title></Head>
      <div className="min-h-screen bg-white">

        {/* Header */}
        <AdminHeader current="produtos"/>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {STATS.map(s=>(
              <button key={s.key} onClick={()=>setFilter(s.key)}
                className={`border p-4 text-center transition-all ${filter===s.key?'bg-black text-white border-black':`bg-white border-site-border hover:border-black ${s.warn?'border-red-300':''}`}`}>
                <p className={`font-display text-3xl font-light ${s.warn&&filter!==s.key?'text-red-500':''}`}>{s.val}</p>
                <p className="text-xs tracking-widest uppercase font-medium mt-1">{s.label}</p>
                {s.warn&&filter!==s.key&&<p className="text-xs text-red-500 mt-1">Limite {MAX_FEAT}!</p>}
              </button>
            ))}
          </div>

          {/* Busca por nome OU CPF/CNPJ + Novo */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
            <div className="relative max-w-md flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-site-text3"/>
              <input type="search" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar por nome, categoria ou CPF/CNPJ..."
                className="input-field pl-9 py-2 text-xs"/>
            </div>
            <button onClick={openCreate} className="btn-primary text-xs gap-2 whitespace-nowrap"><Plus size={13}/> Novo Produto</button>
          </div>

          {/* Tabela */}
          {loading ? <p className="text-center py-16 text-site-text3 text-sm animate-pulse">Carregando...</p> : (
            <div className="border border-site-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-site-border bg-site-bg2">
                      <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium">Produto</th>
                      <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium hidden sm:table-cell">Categoria</th>
                      <th className="text-left px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium hidden md:table-cell">Preço</th>
                      <th className="text-center px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium">Status</th>
                      <th className="text-right px-4 py-3 text-xs tracking-widest uppercase text-site-text3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length===0
                      ? <tr><td colSpan={5} className="text-center py-14 text-site-text3 text-sm">Nenhum produto encontrado</td></tr>
                      : filtered.map(p=>(
                      <tr key={p.id} className="border-b border-site-border hover:bg-site-bg2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 relative bg-site-bg2 border border-site-border flex-shrink-0 overflow-hidden">
                              {p.primary_image
                                ? <img src={getThumbUrl(p.primary_image)} alt={p.name} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={e=>thumbFallback(e,p.primary_image)}/>
                                : <div className="w-full h-full flex items-center justify-center text-site-text3 text-xs">—</div>}
                            </div>
                            <div>
                              <p className="text-sm text-black font-medium">{p.name}</p>
                              <p className="text-xs text-site-text3">{p.image_count||0} foto(s)</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell"><span className="text-xs text-site-text2 font-medium">{p.category}</span></td>
                        <td className="px-4 py-3 hidden md:table-cell"><span className="text-sm text-black">{fmt(p.price)}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {p.sold
                              ? <span className="bg-black text-white text-xs px-2 py-0.5 font-medium">Vendido</span>
                              : p.visible
                                ? <span className="bg-site-bg2 border border-site-border text-black text-xs px-2 py-0.5 font-medium">Ativo</span>
                                : <span className="text-site-text3 text-xs px-2 py-0.5 border border-site-border font-medium">Oculto</span>}
                            {p.featured&&!p.sold&&<Star size={11} className="text-black fill-black"/>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {/* Gerenciar fotos */}
                            <button onClick={()=>openImgManager(p.id)} title="Gerenciar fotos"
                              className="p-1.5 text-site-text3 hover:text-black transition-colors">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                            </button>
                            <button onClick={()=>toggleVisible(p)} title={p.visible?'Ocultar':'Mostrar'}
                              className="p-1.5 text-site-text3 hover:text-black">
                              {p.visible?<Eye size={13}/>:<EyeOff size={13}/>}
                            </button>
                            <button onClick={()=>openEdit(p)} className="p-1.5 text-site-text3 hover:text-black"><Edit2 size={13}/></button>
                            {p.sold&&(
                              <button onClick={()=>unmarkSold(p)} title="Desfazer venda"
                                className="p-1.5 text-site-text3 hover:text-blue-600">
                                <RotateCcw size={13}/>
                              </button>
                            )}
                            <button onClick={()=>remove(p)} className="p-1.5 text-site-text3 hover:text-red-600"><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Criar/Editar ──────────────────────────────────────────────── */}
      {modal&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white w-full max-w-lg max-h-[94vh] overflow-y-auto border border-site-border flex flex-col">
            {/* Header fixo */}
            <div className="px-6 py-4 border-b border-site-border flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-display text-xl font-light text-black">{editing?'Editar Produto':'Novo Produto'}</h2>
              <button onClick={()=>setModal(false)} className="text-site-text3 hover:text-black p-1"><X size={18}/></button>
            </div>

            {/* Conteúdo */}
            <div className="px-6 py-6 space-y-5 flex-1">
              {formErr&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-medium" role="alert">{formErr}</div>}

              <div>
                <label htmlFor="f-name" className="label-field">Nome *</label>
                <input id="f-name" type="text" value={form.name} onChange={e=>setField('name',e.target.value)} className="input-field" placeholder="Ex: Buffet Jacarandá Anos 50" required/>
              </div>

              <div>
                <label htmlFor="f-cat" className="label-field">Categoria *</label>
                <select id="f-cat" value={form.category} onChange={e=>setField('category',e.target.value)} className="input-field">
                  {CATS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label htmlFor="f-desc" className="label-field">Descrição</label>
                <textarea id="f-desc" value={form.description} onChange={e=>setField('description',e.target.value)} className="input-field resize-none" rows={4} placeholder="Materiais, estado de conservação, características..."/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="f-price" className="label-field">Preço (R$)</label>
                  <input id="f-price" type="number" value={form.price} onChange={e=>setField('price',e.target.value)} className="input-field" placeholder="0.00" min="0" step="0.01"/>
                </div>
                <div>
                  <label htmlFor="f-qty" className="label-field">Quantidade</label>
                  <input id="f-qty" type="number" value={form.quantity} onChange={e=>setField('quantity',parseInt(e.target.value)||1)} className="input-field" min="0"/>
                </div>
              </div>

              {/* Ano do móvel — 1800 até 10 anos no futuro */}
              <div>
                <label htmlFor="f-decade" className="label-field">Ano do Móvel</label>
                <select id="f-decade" value={form.decade} onChange={e=>setField('decade',e.target.value)} className="input-field">
                  <option value="">Não informado</option>
                  {ALL_YEARS.map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Flags */}
              <div className="pt-3 border-t border-site-border space-y-3">
                <p className="label-field pt-2">Status da Peça</p>
                {[
                  {k:'visible',  label:'Visível no site'},
                  {k:'featured', label:`Destaque na home (${featuredCount}/${MAX_FEAT} usados)`},
                  {k:'sold',     label:'Marcar como vendido'},
                ].map(({k,label})=>(
                  <label key={k} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form[k]} onChange={e=>setField(k,e.target.checked)} className="w-4 h-4 accent-black"/>
                    <span className="text-sm text-black font-medium">{label}</span>
                  </label>
                ))}
              </div>

              {/* Dados da venda */}
              {form.sold&&(
                <div className="bg-site-bg2 border border-site-border p-5 space-y-4">
                  <p className="text-xs tracking-widest uppercase text-site-text2 font-medium">Dados da Venda</p>

                  <div>
                    <label htmlFor="f-sdate" className="label-field">Data da Venda * (DD/MM/AAAA)</label>
                    <input
                      id="f-sdate"
                      type="text"
                      inputMode="numeric"
                      value={form.sold_date}
                      onChange={e => {
                        // Formata automaticamente enquanto digita: DD/MM/YYYY
                        let v = e.target.value.replace(/\D/g,'');
                        if (v.length > 2)  v = v.slice(0,2) + '/' + v.slice(2);
                        if (v.length > 5)  v = v.slice(0,5) + '/' + v.slice(5);
                        if (v.length > 10) v = v.slice(0,10);
                        setField('sold_date', v);
                      }}
                      className="input-field font-mono"
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                    />
                    {form.sold && !form.sold_date && <p className="text-xs text-red-500 mt-1 font-medium">⚠ Obrigatório antes de salvar</p>}
                  </div>

                  <div>
                    <label htmlFor="f-sprice" className="label-field">Valor de Venda (R$)</label>
                    <input id="f-sprice" type="number" value={form.sold_price} onChange={e=>setField('sold_price',e.target.value)} className="input-field" placeholder="0.00" min="0" step="0.01"/>
                  </div>

                  {/* Forma de pagamento */}
                  <div>
                    <label htmlFor="f-pay" className="label-field">Forma de Pagamento</label>
                    <select id="f-pay" value={form.payment_method} onChange={e=>setField('payment_method',e.target.value)} className="input-field">
                      <option value="">Selecione</option>
                      {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Nome do comprador */}
                  <div>
                    <label htmlFor="f-bname" className="label-field">Nome do Comprador</label>
                    <input id="f-bname" type="text" value={form.buyer_name}
                      onChange={e=>setField('buyer_name',e.target.value)}
                      className="input-field" placeholder="Nome completo do comprador"/>
                  </div>

                  {/* CPF/CNPJ — só números */}
                  <div>
                    <label htmlFor="f-doc" className="label-field">CPF / CNPJ do Comprador</label>
                    <input id="f-doc" type="text" inputMode="numeric" value={form.buyer_doc}
                      onChange={e=>setField('buyer_doc',e.target.value)}
                      className="input-field font-mono" placeholder="Somente números" maxLength={14}/>
                    <p className="text-xs text-site-text3 mt-1">
                      {form.buyer_doc.length > 0 && (
                        form.buyer_doc.length <= 11
                          ? `CPF: ${form.buyer_doc.length}/11 dígitos`
                          : `CNPJ: ${form.buyer_doc.length}/14 dígitos`
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer fixo com botão SALVAR destacado */}
            <div className="px-6 py-4 border-t border-site-border flex gap-3 justify-end sticky bottom-0 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
              <button onClick={()=>setModal(false)} className="btn-outline text-xs px-5 py-2.5">Cancelar</button>
              <button onClick={save} className="bg-black text-white px-8 py-2.5 text-xs tracking-widest uppercase font-medium hover:bg-zinc-800 transition-all flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {editing?'Salvar Alterações':'Criar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Gerenciar Imagens ─────────────────────────────────────────── */}
      {imgModal&&imgProduct&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-site-border">
            <div className="px-6 py-4 border-b border-site-border flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-display text-xl font-light text-black">Fotos — {imgProduct.name}</h2>
              <button onClick={()=>setImgModal(false)} className="text-site-text3 hover:text-black p-1"><X size={18}/></button>
            </div>
            <div className="px-6 py-6">
              {/* Contador de fotos + aviso de limite */}
              {imgList.length >= 7 ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-xs font-medium mb-4 rounded">
                  ⚠ Você atingiu o limite máximo de 7 fotos para este móvel. Remova uma foto antes de adicionar outra.
                </div>
              ) : (
                <label className="flex items-center gap-2 btn-outline text-xs mb-2 cursor-pointer w-fit">
                  <Plus size={13}/> Adicionar Fotos
                  <input type="file" accept="image/*" multiple className="sr-only"
                    onChange={e=>uploadImages(imgProduct.id, e.target.files)}/>
                </label>
              )}
              <p className="text-xs text-site-text3 mb-6">
                {imgList.length}/7 fotos —{' '}
                Clique em <strong>☆ Destaque</strong> para definir qual foto aparece na listagem.
                Clique em <strong>✂ Recortar</strong> para ajustar o enquadramento no destaque da home.
              </p>

              {imgList.length===0
                ? <p className="text-site-text3 text-sm text-center py-8">Nenhuma foto ainda. Adicione acima.</p>
                : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  {imgList.map(img=>(
                    <div key={img.id}>
                      {/* Foto com bordas */}
                      <div className={`relative aspect-[3/4] overflow-hidden border-2 bg-site-bg2 ${img.is_primary?'border-black':'border-site-border'}`}>
                        {/* Usa tag img normal para evitar problemas com Next/Image e CORS no crop */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getThumbUrl(img.filename)}
                          loading="lazy" decoding="async"
                          onError={e=>thumbFallback(e,img.filename)}
                          alt="Foto do produto"
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                        {Boolean(img.is_primary) && (
                          <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-0.5 font-medium">Principal</span>
                        )}
                      </div>

                      {/* Botões de ação */}
                      <div className="flex flex-col gap-1.5 mt-2">
                        {/* Botão Destaque — define foto principal */}
                        {!img.is_primary&&(
                          <button onClick={()=>setPrimary(imgProduct.id,img.id)}
                            className="w-full flex items-center justify-center gap-1.5 border border-black text-black text-xs py-1.5 tracking-wider uppercase font-medium hover:bg-black hover:text-white transition-all">
                            <Star size={11}/> Destaque
                          </button>
                        )}
                        {Boolean(img.is_primary) && (
                          <div className="w-full flex items-center justify-center gap-1.5 bg-black text-white text-xs py-1.5 tracking-wider uppercase font-medium">
                            <Star size={11} className="fill-white"/> Foto Principal
                          </div>
                        )}
                        {/* Botão Recortar */}
                        <button onClick={()=>openCrop(imgProduct,img)}
                          className="w-full flex items-center justify-center gap-1.5 border border-site-border text-site-text2 text-xs py-1.5 tracking-wider uppercase hover:border-black hover:text-black transition-all">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 2 6 8 2 8"/><polyline points="18 22 18 16 22 16"/><path d="M2 6h14v14"/><path d="M22 18H8V4"/></svg>
                          Recortar
                        </button>
                        {/* Botão Remover */}
                        <button onClick={()=>deleteImg(imgProduct.id,img.id)}
                          className="w-full flex items-center justify-center gap-1.5 border border-red-200 text-red-500 text-xs py-1.5 tracking-wider uppercase hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={11}/> Remover
                        </button>
                        <div className="flex items-center gap-2 mt-2">
                        <label className="text-xs text-site-text2">
                          Posição:
                        </label>
                        <input
                          key={`${img.id}-${img.order_index}`}
                          type="number"
                          min="1"
                          max={imgList.length}
                          defaultValue={img.order_index > 0 ? img.order_index : ""}
                          onBlur={(e) => {
                            const position = Number(e.target.value);

                            if (
                              !Number.isInteger(position) ||
                              position < 1 ||
                              position > imgList.length
                            ) {
                              toast.error(`Escolha uma posição entre 1 e ${imgList.length}`);
                              e.target.value = img.order_index > 0
                                ? String(img.order_index)
                                : "";
                              return;
                            }

                            if (position !== img.order_index) {
                              setImageOrder(imgProduct.id, img.id, position);
                            }
                          }}
                          className="w-16 border border-site-border px-2 py-1 text-sm"
                        />

                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Crop ─────────────────────────────────────────────────────────────── */}
      {cropModal&&cropImage&&(
        <ImageCropper
          imageUrl={getImageUrl(cropImage.filename)}
          aspect={16/9}
          label="hero da home (tela principal)"
          onSave={saveCrop}
          onCancel={()=>setCropModal(false)}
        />
      )}
    </>
  );
}

export default function AdminDashboardPage() {
  return <AdminGuard><AdminDashboard/></AdminGuard>;
}
