export const declaration = 'ATESTO POSSUIR A AUTONOMIA NECESSÁRIA PARA A REALIZAÇÃO DA PORTABILIDADE DESCRITA NESTE TERMO';
export const fresh = () => ({id:globalThis.crypto?.randomUUID?.() ?? `term-${Date.now()}-${Math.random().toString(36).slice(2)}`,name:'',document:'',rg:'',address:'',cep:'',city:'',carrier:'',mode:'single',phone:'',first:'',last:'',numbers:'',signer:'',date:new Date().toLocaleDateString('sv-SE'),step:0,status:'draft',updated:new Date().toISOString()});
export const digits = value => value.replace(/\D/g,'');
export const phoneList = d => d.mode === 'single' ? [d.phone] : d.mode === 'range' ? [d.first+' até '+d.last] : d.numbers.split(/[\n;,]+/).map(x=>x.trim()).filter(Boolean);
export const fields = d => [
 {key:'name',label:'Quem é o contratante?',hint:'Informe a razão social da empresa ou o nome completo da pessoa física.',placeholder:'Ex.: Acme Soluções Ltda.',section:'Contratante'},
 {key:'document',label:'Qual é o CPF ou CNPJ?',hint:'Use o documento do titular das linhas na operadora atual.',placeholder:'CPF ou CNPJ',section:'Contratante'},
 {key:'rg',label:'Qual é o RG?',hint:'Informe o RG do titular ou do representante da empresa.',placeholder:'Número do RG',section:'Contratante'},
 {key:'address',label:'Qual é o endereço completo?',hint:'Inclua rua, número, complemento e bairro.',placeholder:'Ex.: Rua das Flores, 120, sala 4, Centro',section:'Endereço'},
 {key:'cep',label:'Qual é o CEP?',hint:'Informe o CEP do endereço do contratante.',placeholder:'00000-000',section:'Endereço'},
 {key:'city',label:'Em qual cidade?',hint:'Informe a cidade e a UF do endereço.',placeholder:'Ex.: São Paulo / SP',section:'Endereço'},
 {key:'carrier',label:'Qual é a operadora atual?',hint:'É a operadora doadora, de onde os números serão transferidos.',placeholder:'Ex.: Vivo, Claro, Oi…',section:'Portabilidade'},
 {key:'lines',label:'Quais números serão portados?',hint:'Informe os números com DDD. Escolha o formato que se aplica às linhas.',section:'Portabilidade'},
 {key:'signer',label:'Quem vai assinar o termo?',hint:'Nome completo da pessoa com autonomia para autorizar a portabilidade.',placeholder:'Nome completo do responsável',section:'Assinatura'},
 {key:'date',label:'Qual é a data do termo?',hint:'Esta data será exibida junto à identificação do responsável.',section:'Assinatura',type:'date'},
];
export function validate(d, key) {
 if(key==='lines') {
 const valid = n => /^\d{10,11}$/.test(digits(n));
 if(d.mode==='range') return !valid(d.first)||!valid(d.last) ? 'Informe os dois números com DDD (10 ou 11 dígitos).' : digits(d.first).length!==digits(d.last).length || digits(d.first).slice(0,2)!==digits(d.last).slice(0,2) || Number(digits(d.first))>Number(digits(d.last)) ? 'A faixa deve ter o mesmo DDD e o número final deve ser maior ou igual ao inicial.' : '';
 const list=phoneList(d); return !list.length||list.some(n=>!valid(n)) ? 'Informe cada número com DDD (10 ou 11 dígitos).' : '';
 }
 if(!d[key]?.trim()) return 'Preencha este campo para continuar.';
 if(key==='document' && ![11,14].includes(digits(d.document).length)) return 'Informe um CPF com 11 dígitos ou CNPJ com 14 dígitos.';
 if(key==='cep' && digits(d.cep).length!==8) return 'O CEP deve ter 8 dígitos.';
 if(key==='date' && !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return 'Informe uma data válida.';
 return '';
}
