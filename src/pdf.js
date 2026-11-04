import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import templateUrl from './assets/termo-original.pdf?url';
import { digits, phoneList } from './model';

let templatePromise;
async function loadTemplate() {
 if (!templatePromise) templatePromise = fetch(templateUrl).then(response => {
  if (!response.ok) throw new Error('O modelo do termo não pôde ser carregado.');
  return response.arrayBuffer();
 }).catch(error => {templatePromise = undefined;throw error;});
 return templatePromise;
}

// Coordinates are in PDF points, measured from the top of the original A4 page.
// All borders, colors, headings and the logo come from the supplied .doc.
export async function createPdf(d) {
 const pdf = await PDFDocument.load(await loadTemplate());
 const page = pdf.getPage(0);
 const font = await pdf.embedFont(StandardFonts.Helvetica);
 const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
 const black = rgb(0,0,0);
 const clean = value => Array.from(String(value || '').replace(/[\r\n\t]+/g,' ')).map(char=>{try {font.encodeText(char);return char;}catch {return '?';}}).join('');
 function wrap(value,width,size) {
  const lines = []; let line = '';
  // Wrap long names/addresses as well as words without spaces.
  for (const char of clean(value)) {
   if (line && font.widthOfTextAtSize(line+char,size)>width) {lines.push(line.trim());line='';}
   line += char;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
 }
 function box(value,x,top,width,height,maxSize=10) {
  if (!value) return;
  let size=maxSize,lines=wrap(value,width,size);
  while (size>5.5 && lines.length*size*1.15>height) {size-=0.25;lines=wrap(value,width,size);}
  if (lines.length*size*1.15>height) throw new Error('O texto é muito longo para o campo do termo.');
  const total=lines.length*size*1.15;
  const firstTop=top+(height-total)/2+size;
  lines.forEach((line,i)=>page.drawText(line,{font,size,x,y:page.getHeight()-firstTop-i*size*1.15,color:black}));
 }
 for(const [key,top,height] of [['name',260,17],['document',278.5,16],['rg',296,16],['address',313.5,16],['carrier',331,15.5],['cep',348,15],['city',365,15]]) {
  box(d[key],144,top,418,height);
 }
 if (d.mode==='single') box(digits(d.phone),144,434.5,418,16);
 if (d.mode==='range') {
  box(digits(d.first),144,487,91,16,9);
  box(digits(d.last),399,487,162,16,9);
 }
 if (d.mode==='list') {
  const numbers=phoneList(d).map(digits);
  const columns=5,capacity=20;
  numbers.slice(0,capacity).forEach((number,index)=>box(number,32+(index%columns)*106,540+Math.floor(index/columns)*10.5,100,11,9));
  if (numbers.length>capacity) {
   // Never omit extra lines; use a clearly linked annex while preserving the template.
   let annex,y;
   const nextPage=()=>{
    annex=pdf.addPage([page.getWidth(),page.getHeight()]);y=785;
    annex.drawText('ANEXO - NÚMEROS NÃO SEQUENCIAIS',{x:30,y,font:bold,size:12});y-=22;
    const identity=wrap(`Contratante: ${d.name} | CPF/CNPJ: ${d.document}`,530,9);
    identity.forEach(line=>{annex.drawText(line,{x:30,y,font,size:9});y-=13;});y-=15;
   };
   nextPage();
   numbers.slice(capacity).forEach((number,index)=>{
    if(y<60)nextPage();
    annex.drawText(number,{x:32+(index%5)*106,y,font,size:10});
    if(index%5===4)y-=20;
   });
   box('Demais números: ver anexo.',32,583,520,8,5.5);
  }
 }
 // Replace the printed placeholders without changing their labels or signature line.
 page.drawRectangle({x:58,y:page.getHeight()-706,width:108,height:16,color:rgb(1,1,1)});
 box(d.date.split('-').reverse().join(' / '),59,691,105,15,9);
 page.drawRectangle({x:330,y:page.getHeight()-708,width:197,height:19,color:rgb(1,1,1)});
 box(d.signer,331,690,194,17,9);
 pdf.setTitle('Termo de aceite - Solicitação de portabilidade');
 pdf.setAuthor('');pdf.setSubject('');pdf.setKeywords([]);
 return pdf;
}
export async function downloadPdf(d) {
 const pdf=await createPdf(d);
 const bytes=await pdf.save();
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
 const anchor=document.createElement('a');
 anchor.href=url;
 anchor.download=`termo-portabilidade-${d.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').slice(0,70)}.pdf`;
 document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
