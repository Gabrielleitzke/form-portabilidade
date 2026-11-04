import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, Check, Download, FileText, LoaderCircle, Plus, Trash2, X } from 'lucide-react';
import { digits, fields, fresh, phoneList, validate, declaration } from './model';
import { lookupCep } from './cep';
import './style.css';

const STORAGE_KEY = 'porta-forms-v1';
function readRecords() {
 try {
  const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!Array.isArray(records)) return [];
  return records.filter(d => d && typeof d.id === 'string' && typeof d.name === 'string' && ['single', 'range', 'list'].includes(d.mode)).map(d => ({
   ...fresh(), ...d,
   step: d.flowVersion === 2 ? Math.min(10, Math.max(0, Number(d.step) || 0)) : ({3:4,4:3}[d.step] ?? Math.min(10,Math.max(0,Number(d.step)||0))),
   flowVersion: 2,
  }));
 } catch { return []; }
}

function App() {
 const [records, setRecords] = useState(readRecords);
 const [active, setActive] = useState(null);
 const [showHistory, setShowHistory] = useState(false);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const [storageError, setStorageError] = useState(false);
 const [busy, setBusy] = useState(false);
 const [remove, setRemove] = useState(null);
 const [query, setQuery] = useState('');
 const [cepState, setCepState] = useState({status:'idle'});
 const input = useRef(null);
 const current = records.find(r => r.id === active);
 const d = current || null;
 const step = d?.step ?? 0;
 const formFields = fields(d);
 const f = formFields[step];

 // Start directly with the latest draft; never create a blank record on every reload.
 useEffect(() => {
  const latest = records.find(r => r.status !== 'complete');
  if (latest) setActive(latest.id);
  else { const record = fresh(); setRecords(rs => [record,...rs]); setActive(record.id); }
 }, []);
 useEffect(() => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); setStorageError(false); }
  catch { setStorageError(true); }
 }, [records]);
 useEffect(() => { input.current?.focus(); }, [active,step,showHistory]);
 useEffect(() => {
  if (!notice) return;
  const timeout = setTimeout(() => setNotice(''),5000);
  return () => clearTimeout(timeout);
 }, [notice]);

 const update = patch => {
  if (patch.step !== undefined) setError('');
  setRecords(rs => rs.map(r => r.id === active ? {...r,...patch,status:patch.status || 'draft',updated:new Date().toISOString()} : r));
 };
 const start = () => { setError('');const record = fresh(); setRecords(rs => [record,...rs]); setActive(record.id); setShowHistory(false); };
 const go = () => { const message = validate(d,f.key); if (message) {setError(message);return;} update({step:step+1}); };

 // Abort on navigation / CEP change and only fill fields that are still empty.
 useEffect(() => {
  setCepState({status:'idle'});
  if (!d || step !== 3 || showHistory || digits(d.cep).length !== 8) return;
  const cep = digits(d.cep), id = d.id;
  const controller = new AbortController();
  let expired = false;
  let timeout;
  const debounce = setTimeout(async () => {
   setCepState({status:'loading'});
   timeout = setTimeout(() => { expired = true; controller.abort(); setCepState({status:'error',message:'A consulta demorou mais que o esperado. Você pode preencher o endereço manualmente.'}); },8000);
   try {
    const result = await lookupCep(cep,controller.signal);
    if (controller.signal.aborted) return;
    setRecords(rs => rs.map(r => r.id === id && digits(r.cep) === cep ? {...r,address:r.address || result.address,city:r.city || result.city} : r));
    setCepState({status:'success',...result});
   } catch (err) {
    if (!controller.signal.aborted && !expired) setCepState({status:'error',message:err.message === 'Failed to fetch' ? 'Não foi possível consultar o CEP. Preencha o endereço manualmente.' : err.message});
   } finally { clearTimeout(timeout); }
  },400);
  return () => {clearTimeout(debounce);clearTimeout(timeout);controller.abort();};
 }, [active,d?.cep,step,showHistory]);

 const generate = async (record=d) => {
  for (let i=0;i<formFields.length;i++) {
   const message = validate(record,formFields[i].key);
   if (message) {setActive(record.id);setShowHistory(false);setRecords(rs => rs.map(r=>r.id===record.id?{...r,step:i}:r));setError(message);return;}
  }
  setBusy(true);setError('');
  try {
   const {downloadPdf} = await import('./pdf');
   await downloadPdf(record);
   setRecords(rs => rs.map(r=>r.id===record.id?{...r,status:'complete',updated:new Date().toISOString()}:r));
   setNotice('PDF gerado para assinatura.');
  } catch (err) { console.error('Falha ao gerar PDF:',err);setError(err.message?.includes('muito longo')?err.message:'Não foi possível gerar o PDF. Verifique sua conexão e tente novamente.'); }
  finally {setBusy(false);}
 };
 const recordCount = records.filter(r=>r.name || r.document).length;
 const shown = records.filter(r => r.name || r.document).filter(r=>`${r.name} ${r.document}`.toLowerCase().includes(query.toLowerCase()));
 const inputProps = {ref:input,'aria-invalid':!!error,'aria-describedby':error?'field-error':undefined};

 return <div className="app">
  <header><span className="app-title"><FileText size={19}/> Termo de portabilidade</span><button className="quiet" onClick={()=>{setError('');if(showHistory&&!d)start();else setShowHistory(v=>!v);}}>{showHistory?'Voltar ao formulário':`Termos salvos${recordCount?` (${recordCount})`:''}`}</button></header>
  <main>
   {storageError && <p className="warning" role="alert">Não foi possível salvar neste navegador. Baixe o PDF antes de fechar a página.</p>}
   {showHistory ? <section className="card history">
    <div className="section-heading"><h1>Termos salvos</h1><button className="primary" onClick={start}><Plus size={16}/> Novo termo</button></div>
    <input aria-label="Buscar termos" placeholder="Buscar por nome ou documento" value={query} onChange={e=>setQuery(e.target.value)}/>
    {shown.length ? <ul className="record-list">{shown.map(r=><li key={r.id}><div><strong>{r.name||'Termo sem nome'}</strong><small>{r.document||'Documento não informado'} · {r.status==='complete'?'Concluído':'Rascunho'}</small></div><div className="record-actions"><button className="quiet" onClick={()=>{setError('');setActive(r.id);setShowHistory(false);}}>{r.status==='complete'?'Revisar':'Continuar'}</button>{r.status==='complete'&&<button className="icon-button" aria-label={`Baixar PDF de ${r.name}`} disabled={busy} onClick={()=>generate(r)}><Download size={17}/></button>}<button className="icon-button delete" aria-label={`Excluir termo de ${r.name||'sem nome'}`} onClick={()=>setRemove(r.id)}><Trash2 size={16}/></button></div></li>)}</ul>:<p className="empty">Nenhum termo salvo encontrado.</p>}
    {error&&<p className="error" role="alert">{error}</p>}
    <p className="local-note">Os termos ficam apenas neste navegador e dispositivo.</p>
   </section> : d && <section className="card">
    {step < 10 ? <form onSubmit={e=>{e.preventDefault();go();}}>
     <div className="progress-caption"><span>{f.section}</span><span>{step+1} de {formFields.length}</span></div><div className="progress-track"><span style={{width:`${(step+1)*10}%`}}/></div>
     <h1>{f.label}</h1><p className="hint">{f.hint}</p>
     {f.key==='lines'?<>
      <div className="mode-options">{[['single','Acesso único'],['range','Faixa DDR'],['list','Vários números']].map(([mode,label])=><button key={mode} type="button" aria-pressed={d.mode===mode} className={d.mode===mode?'selected':''} onClick={()=>{update({mode});setError('');}}>{label}</button>)}</div>
      {d.mode==='range'?<div className="range-fields">{[['first','Número inicial'],['last','Número final']].map(([key,label])=><label key={key}>{label}<input inputMode="tel" maxLength={20} value={d[key]} onChange={e=>update({[key]:e.target.value})} placeholder="(11) 3000-0000"/></label>)}</div>:d.mode==='list'?<label>Números com DDD<textarea {...inputProps} maxLength={10000} value={d.numbers} onChange={e=>update({numbers:e.target.value})} placeholder={'1130000000\n1130000001'}/><small>Um por linha, ou separados por vírgula ou ponto e vírgula.</small></label>:<label>Número com DDD<input {...inputProps} inputMode="tel" maxLength={20} value={d.phone} onChange={e=>update({phone:e.target.value})} placeholder="(11) 3000-0000"/></label>}
     </>:<label>{({name:'Razão social ou nome completo',document:'CPF / CNPJ',rg:'RG',cep:'CEP',address:'Endereço completo',city:'Cidade / UF',carrier:'Operadora doadora',signer:'Nome completo',date:'Data do termo'})[f.key]}
      <input key={f.key} {...inputProps} type={f.type||'text'} autoComplete={({name:'organization',cep:'postal-code',address:'street-address',city:'address-level2'})[f.key]||'off'} inputMode={['document','cep'].includes(f.key)?'numeric':undefined} maxLength={f.key==='address'?350:f.key==='cep'?9:150} value={d[f.key]} onChange={e=>{update({[f.key]:e.target.value});setError('');}} placeholder={f.placeholder}/>
     </label>}
     {f.key==='cep' && <div className="cep-status" aria-live="polite">
      {cepState.status==='loading'&&<p><LoaderCircle className="spinner" size={14}/> Consultando CEP…</p>}
      {cepState.status==='success'&&<><p className="success"><Check size={14}/> {cepState.address?`${cepState.address} — `:''}{cepState.city}</p>{((d.address&&d.address!==cepState.address)||(d.city&&d.city!==cepState.city))&&<button className="quiet" type="button" onClick={()=>update({address:cepState.address,city:cepState.city})}>Usar este endereço</button>}<p>Confira o endereço e acrescente número e complemento na próxima etapa.</p></>}
      {cepState.status==='error'&&<p>{cepState.message}</p>}
     </div>}
     {error&&<p id="field-error" className="error" role="alert">{error}</p>}
     <div className="form-footer"><button type="button" className="secondary" onClick={()=>step?update({step:step-1}):setShowHistory(true)}><ArrowLeft size={15}/>{step?'Anterior':'Termos salvos'}</button><button type="submit" className="primary">{step===9?'Revisar termo':'Continuar'}<ArrowRight size={15}/></button></div>
    </form> : <>
     <div className="section-heading"><h1>Revisar termo</h1><span className="step-label">10 de 10</span></div>
     {[
      ['Contratante',[['Razão social / Nome completo',d.name],['CPF / CNPJ',d.document],['RG',d.rg]],0],
      ['Endereço',[['CEP',d.cep],['Endereço completo',d.address],['Cidade / UF',d.city]],3],
      ['Portabilidade',[['Operadora doadora',d.carrier],['Tipo',d.mode==='single'?'Acesso único':d.mode==='range'?'Sequencial (DDR / Ramal)':'Números não sequenciais'],['Números com DDD',phoneList(d).join(', ')]],6],
      ['Assinatura',[['Nome completo',d.signer],['Data',d.date.split('-').reverse().join('/')]],8],
     ].map(([title,items,index])=><div className="review-section" key={title}><div className="section-heading"><h2>{title}</h2><button className="quiet" onClick={()=>update({step:index})}>Editar</button></div><dl>{items.map(([label,value])=><React.Fragment key={label}><dt>{label}</dt><dd>{value||'Não informado'}</dd></React.Fragment>)}</dl></div>)}
     <p className="declaration">{declaration}</p><p className="hint">O PDF mantém o modelo do termo, com espaço para assinatura do cliente.</p>
     {error&&<p className="error" role="alert">{error}</p>}
     <div className="form-footer"><button className="secondary" onClick={()=>update({step:9})}><ArrowLeft size={15}/>Anterior</button><button className="primary" onClick={()=>generate()} disabled={busy}>{busy?<LoaderCircle className="spinner" size={16}/>:<Download size={16}/>} {busy?'Gerando…':'Baixar PDF'}</button></div>
     {d.status==='complete'&&<button className="new-term quiet" onClick={start}><Plus size={15}/>Preencher outro termo</button>}
    </>}
   </section>}
   {!showHistory&&<p className="local-note">{storageError?'Salvamento indisponível.':'Progresso salvo automaticamente neste navegador.'}</p>}
  </main>
  {notice&&<div className="toast" role="status"><Check size={17}/>{notice}<button className="icon-button" aria-label="Fechar aviso" onClick={()=>setNotice('')}><X size={15}/></button></div>}
  {remove&&<div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><h2 id="delete-title">Excluir este termo?</h2><p>Os dados serão removidos deste navegador. Essa ação não pode ser desfeita.</p><div className="form-footer"><button autoFocus className="secondary" onClick={()=>setRemove(null)}>Cancelar</button><button className="danger" onClick={()=>{setRecords(rs=>rs.filter(r=>r.id!==remove));if(active===remove)setActive(null);setRemove(null);setNotice('Termo excluído.');}}>Excluir termo</button></div></div></div>}
 </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
