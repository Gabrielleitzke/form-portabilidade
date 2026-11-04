// CNPJ: Anexo XV da IN RFB 2.119/2022, alterado pela IN RFB 2.229/2024.
// https://normas.receita.fazenda.gov.br/sijut2consulta/anexoOutros.action?idArquivoBinario=76204
export const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
export const normalizeDocument = value => String(value || '').trim().toUpperCase().replace(/[.\-/\s]/g,'');
export function validCpf(value) {
 const cpf=normalizeDocument(value);
 if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
 for(let length=9;length<=10;length++) {
  const sum=Array.from(cpf.slice(0,length)).reduce((total,char,index)=>total+Number(char)*(length+1-index),0);
  const remainder=sum%11;
  if(Number(cpf[length])!==(remainder<2?0:11-remainder))return false;
 }
 return true;
}
export function validCnpj(value) {
 const cnpj=normalizeDocument(value);
 if(!/^[A-Z0-9]{12}\d{2}$/.test(cnpj)||/^(\d)\1+$/.test(cnpj))return false;
 const check=base=>{
  const weights=base.length===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2];
  const sum=Array.from(base).reduce((total,char,index)=>total+(char.charCodeAt(0)-48)*weights[index],0);
  return sum%11<2?'0':String(11-sum%11);
 };
 const first=check(cnpj.slice(0,12));
 return cnpj.slice(-2)===first+check(cnpj.slice(0,12)+first);
}
export function documentError(value) {
 const normalized=normalizeDocument(value);
 if(/^\d{11}$/.test(normalized)) return validCpf(value)?'':'CPF inválido. Confira os dígitos verificadores.';
 if(/^[A-Z0-9]{12}\d{2}$/.test(normalized)) return validCnpj(value)?'':'CNPJ inválido. Confira os dígitos verificadores.';
 return 'Informe um CPF com 11 dígitos ou um CNPJ com 14 caracteres, numérico ou alfanumérico. Os dois últimos caracteres do CNPJ devem ser números.';
}
export function identityError(d) {
 if(d.rgType==='cin')return validCpf(d.rg)?'':'A CIN usa o CPF. Informe os 11 dígitos e confira os verificadores.';
 if(d.rgType!=='rg')return 'Escolha RG ou CIN.';
 if(!STATES.includes(d.rgUf))return 'Selecione a UF de emissão do RG.';
 const raw=String(d.rg||'').trim().toUpperCase();
 if(!/^[A-Z0-9.\-\s]+$/.test(raw))return 'Use somente letras, números, pontos, espaços e hífen no RG.';
 const rg=raw.replace(/[.\-\s]/g,'');
 // Older state documents have no nationwide check-digit algorithm. Preserve
 // their letter prefixes/suffixes and leading zeros; do not apply CPF rules.
 if(!/^[A-Z]{0,3}\d{4,13}[A-Z]?$/.test(rg)||rg.length>14||/^(\d)\1+$/.test(rg.replace(/\D/g,'')))return 'Confira o RG: informe de 4 a 14 caracteres, incluindo as letras que constam no documento.';
 return '';
}
export function formatDocument(value) {
 const doc=normalizeDocument(value);
 if(/^\d{11}$/.test(doc))return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/,'$1.$2.$3-$4');
 if(/^[A-Z0-9]{12}\d{2}$/.test(doc))return doc.replace(/^(.{2})(.{3})(.{3})(.{4})(.{2})$/,'$1.$2.$3/$4-$5');
 return value;
}
