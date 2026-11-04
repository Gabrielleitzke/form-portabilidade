import { jsPDF } from 'jspdf';
import {declaration,phoneList} from './model';
export function createPdf(d) {
 const pdf=new jsPDF(); let y=25;
 const text=(value,size=10,bold=false)=>{pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);const lines=pdf.splitTextToSize(String(value),170);for(const line of lines){if(y>265){pdf.addPage();y=25;}pdf.text(line,20,y);y+=size*.48;}y+=3;};
 const heading=t=>{y+=5;pdf.setDrawColor(185);pdf.line(20,y,190,y);y+=9;text(t,10,true);};
 text('TERMO DE ACEITE',19,true);text('SOLICITAÇÃO DE PORTABILIDADE',12);y+=4;
 heading('DADOS DO CONTRATANTE (Pessoa Jurídica / Pessoa Física)');
 for(const [label,key] of [['Razão social ou nome completo','name'],['CNPJ / CPF','document'],['RG','rg'],['Endereço completo','address'],['CEP','cep'],['Cidade','city'],['Operadora doadora','carrier']]) {text(label,8,true);text(d[key],11);}
 heading('INFORMAÇÕES DO(S) NÚMERO(S) A SER(EM) PORTADO(S)');
 text('Formato DDD + número',9);text(d.mode==='range'?'Sequencial (DDR / Ramal)':d.mode==='single'?'Acesso único':'Números não sequenciais',10,true);
 phoneList(d).forEach(n=>text(n,11));
 if(y>200){pdf.addPage();y=25;}
 y+=8;text(declaration,10,true);y+=5;
 text('Data: '+d.date.split('-').reverse().join('/'),11);text('Nome completo: '+d.signer,11);y+=22;
 pdf.setDrawColor(70);pdf.line(35,y,175,y);y+=7;pdf.setFontSize(9);pdf.text('ASSINATURA',105,y,{align:'center'});
 const pages=pdf.getNumberOfPages();for(let i=1;i<=pages;i++){pdf.setPage(i);pdf.setFontSize(8);pdf.setTextColor(120);pdf.text(`Termo de portabilidade  |  ${i} / ${pages}`,105,285,{align:'center'});}
 return pdf;
}
export function downloadPdf(d){createPdf(d).save(`termo-portabilidade-${d.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').slice(0,70)}.pdf`);}
