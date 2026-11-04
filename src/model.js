import {documentError,identityError,formatDocument} from './validation.js';
export const declaration='ATESTO POSSUIR A AUTONOMIA NECESSÁRIA PARA A REALIZAÇÃO DA PORTABILIDADE DESCRITA NESTE TERMO';
export const fresh=()=>({id:globalThis.crypto?.randomUUID?.()??`term-${Date.now()}-${Math.random().toString(36).slice(2)}`,name:'',document:'',rg:'',rgType:'rg',rgUf:'',address:'',number:'',complement:'',cep:'',city:'',carrier:'',mode:'single',phone:'',first:'',last:'',numbers:'',signer:'',date:new Date().toLocaleDateString('sv-SE'),step:0,status:'draft',flowVersion:3,updated:new Date().toISOString()});
export const digits=value=>String(value||'').replace(/\D/g,'');
export const phoneList=d=>d.mode==='single'?[d.phone]:d.mode==='range'?[d.first+' até '+d.last]:d.numbers.split(/[\n;,]+/).map(x=>x.trim()).filter(Boolean);
export const fullAddress=d=>{
 const number=String(d.number||'').trim();
 const canonical=value=>value.trim().toUpperCase().replace(/^N[º°O.]?\s*/, '').replace(/\s+/g,'');
 const alreadyPresent=number&&String(d.address||'').split(',').slice(1).some(part=>canonical(part)===canonical(number));
 return [d.address,number&&!alreadyPresent?`nº ${number}`:'',d.complement].filter(Boolean).join(', ');
};
export const identityLabel=d=>d.rgType==='cin'?`CIN: ${formatDocument(d.rg)}`:`${d.rg}${d.rgUf?` / ${d.rgUf}`:''}`;
export const fields=()=>[
 {key:'name',label:'Quem é o contratante?',hint:'Informe a razão social da empresa ou o nome completo da pessoa física.',placeholder:'Ex.: Acme Soluções Ltda.',section:'Contratante'},
 {key:'document',label:'Qual é o CPF ou CNPJ?',hint:'CPF ou CNPJ do titular das linhas. Aceita CNPJ numérico e alfanumérico.',placeholder:'CPF ou CNPJ',section:'Contratante'},
 {key:'rg',label:'Qual é o documento de identidade?',hint:'Escolha RG ou a nova Carteira de Identidade Nacional (CIN).',section:'Contratante'},
 {key:'cep',label:'Qual é o CEP?',hint:'O endereço será consultado automaticamente. Você poderá revisar os dados.',placeholder:'00000-000',section:'Endereço'},
 {key:'address',label:'Qual é o endereço?',hint:'Confira a rua e o bairro. O número será preenchido na próxima etapa.',placeholder:'Rua e bairro',section:'Endereço'},
 {key:'number',label:'Qual é o número do imóvel?',hint:'O número é obrigatório. Se o imóvel não tiver número, informe S/N.',placeholder:'Ex.: 120 ou 120A',section:'Endereço'},
 {key:'city',label:'Em qual cidade?',hint:'Informe a cidade e a UF do endereço.',placeholder:'Ex.: São Paulo / SP',section:'Endereço'},
 {key:'carrier',label:'Qual é a operadora atual?',hint:'É a operadora doadora, de onde os números serão transferidos.',placeholder:'Ex.: Vivo, Claro, Oi…',section:'Portabilidade'},
 {key:'lines',label:'Quais números serão portados?',hint:'Informe os números com DDD. Escolha o formato que se aplica às linhas.',section:'Portabilidade'},
 {key:'signer',label:'Quem vai assinar o termo?',hint:'Nome completo da pessoa com autonomia para autorizar a portabilidade.',placeholder:'Nome completo do responsável',section:'Assinatura'},
 {key:'date',label:'Qual é a data do termo?',hint:'Esta data será exibida junto à identificação do responsável.',section:'Assinatura',type:'date'},
];
export function migrateRecord(d) {
 const oldStep=Math.max(0,Number(d.step)||0);
 // Version 1 asked address before CEP. Version 3 inserts house number after address.
 const version2Step=d.flowVersion>=2?oldStep:({3:4,4:3}[oldStep]??oldStep);
 const step=d.flowVersion===3?oldStep:version2Step>=5?version2Step+1:version2Step;
 // Preserve legacy free-text addresses verbatim; ask for the new required field.
 return {...fresh(),...d,step:Math.min(fields().length,step),flowVersion:3};
}
export function validate(d,key) {
 if(key==='lines') {
  const valid=n=>/^\d{10,11}$/.test(digits(n));
  if(d.mode==='range')return !valid(d.first)||!valid(d.last)?'Informe os dois números com DDD (10 ou 11 dígitos).':digits(d.first).length!==digits(d.last).length||digits(d.first).slice(0,2)!==digits(d.last).slice(0,2)||Number(digits(d.first))>Number(digits(d.last))?'A faixa deve ter o mesmo DDD e o número final deve ser maior ou igual ao inicial.':'';
  const list=phoneList(d);return !list.length||list.some(n=>!valid(n))?'Informe cada número com DDD (10 ou 11 dígitos).':'';
 }
 if(!d[key]?.trim())return key==='number'?'Informe o número do imóvel para continuar.':'Preencha este campo para continuar.';
 if(key==='document')return documentError(d.document);
 if(key==='rg')return identityError(d);
 if(key==='number'&&!/^(?:\d{1,8}[A-Z]?(?:[-/][A-Z0-9]{1,4})?|S\/?N)$/i.test(d.number.trim()))return 'Informe o número do imóvel, com letra se houver, ou S/N.';
 if(key==='cep'&&digits(d.cep).length!==8)return 'O CEP deve ter 8 dígitos.';
 if(key==='date'&&!/^\d{4}-\d{2}-\d{2}$/.test(d.date))return 'Informe uma data válida.';
 return '';
}
