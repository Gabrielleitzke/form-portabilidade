import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import logoUrl from './assets/logo-original.png?url';
import {declaration,digits,fullAddress,identityLabel,phoneList} from './model';
import {formatDocument} from './validation';

const color=hex=>rgb(...hex.match(/\w\w/g).map(value=>parseInt(value,16)/255));
const palette={ink:color('25232D'),muted:color('77717F'),primary:color('583276'),tint:color('F4F0F8'),line:color('DDD6E5'),white:rgb(1,1,1),soft:color('FAF9FC')};
let logoPromise;
async function loadLogo() {
 if(!logoPromise)logoPromise=fetch(logoUrl).then(response=>{if(!response.ok)throw new Error('Não foi possível carregar o logo do termo.');return response.arrayBuffer();}).catch(error=>{logoPromise=undefined;throw error;});
 return logoPromise;
}

// Recreates the supplied term's sections as selectable vector tables, with the
// original logo, a quieter palette and more room for addresses and signatures.
export async function createPdf(d) {
 const pdf=await PDFDocument.create();
 const pageSize=[595.28,841.89],margin=36,width=pageSize[0]-margin*2;
 const font=await pdf.embedFont(StandardFonts.Helvetica);
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const logo=await pdf.embedPng(await loadLogo());
 const clean=value=>Array.from(String(value||'').replace(/[\r\n\t]+/g,' ')).map(char=>{try{font.encodeText(char);return char;}catch{return '?';}}).join('');
 const wrap=(value,maxWidth,size,face=font)=>{
  const result=[];let line='';
  for(const word of clean(value).split(' ')) {
   if(line&&face.widthOfTextAtSize(`${line} ${word}`,size)>maxWidth){result.push(line);line='';}
   for(const char of (line?' ':'')+word){
    if(line&&face.widthOfTextAtSize(line+char,size)>maxWidth){result.push(line);line='';}
    line+=char;
   }
  }
  if(line.trim())result.push(line.trim());
  return result;
 };
 const rect=(page,x,top,w,h,fill,border=palette.line)=>page.drawRectangle({x,y:page.getHeight()-top-h,width:w,height:h,color:fill,borderColor:border,borderWidth:.5});
 const line=(page,x1,top,x2)=>page.drawLine({start:{x:x1,y:page.getHeight()-top},end:{x:x2,y:page.getHeight()-top},color:palette.line,thickness:.6});
 function text(page,value,x,top,w,h,{size=10,face=font,ink=palette.ink,align='left',minSize=7}={}) {
  if(!value)return;
  let current=size,lines=wrap(value,w,current,face);
  while(current>minSize&&lines.length*current*1.25>h){current-=.25;lines=wrap(value,w,current,face);}
  if(lines.length*current*1.25>h)throw new Error('O texto é muito longo para o campo do termo. Reduza o texto antes de gerar o PDF.');
  const firstTop=top+(h-lines.length*current*1.25)/2+current;
  lines.forEach((value,index)=>page.drawText(value,{font:face,size:current,x:align==='center'?x+(w-face.widthOfTextAtSize(value,current))/2:x,y:page.getHeight()-firstTop-index*current*1.25,color:ink}));
 }
 function header(page,annex=false) {
  page.drawImage(logo,{x:margin,y:page.getHeight()-91,width:55,height:55});
  text(page,annex?'ANEXO AO TERMO DE ACEITE':'TERMO DE ACEITE',108,39,width-72,23,{face:bold,size:17,ink:palette.primary});
  text(page,'Solicitação de portabilidade',108,66,width-72,18,{size:11,ink:palette.muted});
  line(page,margin,111,margin+width);
 }
 function band(page,title,top,height=25,dark=false) {
  rect(page,margin,top,width,height,dark?palette.primary:palette.tint,dark?palette.primary:palette.line);
  text(page,title,margin+12,top+3,width-24,height-6,{size:9,face:bold,ink:dark?palette.white:palette.primary});
 }
 const page=pdf.addPage(pageSize);header(page);
 let y=132;
 rect(page,margin,y,width,33,palette.primary,palette.primary);
 text(page,'DADOS DO CONTRATANTE',margin+12,y+4,width-24,13,{face:bold,size:9.5,ink:palette.white});
 text(page,'Pessoa jurídica / Pessoa física · Preenchimento obrigatório',margin+12,y+18,width-24,10,{size:7.5,ink:color('E7DDED')});
 y+=33;
 const labelWidth=137;
 for(const [label,value,height] of [
  ['Razão social / Nome completo',d.name,29],['CNPJ / CPF',formatDocument(d.document),25],['RG / CIN',identityLabel(d),25],
  ['Endereço completo',fullAddress(d),42],['Operadora doadora',d.carrier,25],['CEP',d.cep,25],['Cidade / UF',d.city,25],
 ]) {
  rect(page,margin,y,labelWidth,height,palette.tint);
  rect(page,margin+labelWidth,y,width-labelWidth,height,palette.white);
  text(page,label,margin+12,y+4,labelWidth-24,height-8,{size:8.5,face:bold,ink:palette.primary});
  text(page,value,margin+labelWidth+12,y+4,width-labelWidth-24,height-8,{size:10});
  y+=height;
 }
 y+=18;
 band(page,'NÚMEROS A SEREM PORTADOS · FORMATO DDD + NÚMERO',y,27,true);y+=27;
 band(page,'Acesso único',y,21);y+=21;
 rect(page,margin,y,width,25,palette.white);
 text(page,d.mode==='single'?digits(d.phone):'—',margin+12,y+4,width-24,17,{size:10,ink:d.mode==='single'?palette.ink:palette.muted});y+=35;
 band(page,'Quando sequencial (DDR / Ramal)',y,21);y+=21;
 const half=width/2;
 for(const [label,value,x] of [['Número inicial',d.first,margin],['Número final',d.last,margin+half]]) {
  rect(page,x,y,half,27,palette.white);
  text(page,label,x+12,y+5,90,17,{size:8.5,face:bold,ink:palette.muted});
  text(page,d.mode==='range'?digits(value):'—',x+104,y+5,half-116,17,{size:10});
 }
 y+=37;
 band(page,'Quando não sequencial, preencher os números abaixo',y,21);y+=21;
 const numbers=d.mode==='list'?phoneList(d).map(digits):[];
 const capacity=20,columns=5,columnWidth=width/columns;
 rect(page,margin,y,width,64,palette.white);
 if(numbers.length) {
  numbers.slice(0,capacity).forEach((number,index)=>text(page,number,margin+(index%columns)*columnWidth+9,y+5+Math.floor(index/columns)*12,columnWidth-18,12,{size:9}));
  if(numbers.length>capacity)text(page,'Demais números: ver anexo deste termo.',margin+9,y+52,width-18,9,{size:6.5,ink:palette.muted,minSize:6.5});
 } else text(page,'—',margin+12,y+6,width-24,16,{ink:palette.muted});
 y+=79;
 rect(page,margin,y,width,43,palette.soft);
 text(page,declaration,margin+13,y+8,width-26,27,{size:8.2,face:bold,ink:palette.primary});
 y+=59;
 const metadataWidth=width*.36;
 text(page,'DATA',margin,y,metadataWidth,12,{size:7.5,face:bold,ink:palette.muted});
 text(page,'NOME COMPLETO DO RESPONSÁVEL',margin+metadataWidth,y,width-metadataWidth,12,{size:7.5,face:bold,ink:palette.muted});
 text(page,d.date.split('-').reverse().join(' / '),margin,y+16,metadataWidth-15,20,{size:10});
 text(page,d.signer,margin+metadataWidth,y+16,width-metadataWidth,20,{size:10});
 const signatureTop=775;
 if(y+38>signatureTop-30)throw new Error('O conteúdo é muito longo para o campo do termo.');
 line(page,margin+width*.34,signatureTop,margin+width);
 text(page,'ASSINATURA DO RESPONSÁVEL',margin+width*.34,signatureTop+4,width*.66,13,{size:7.5,ink:palette.muted,align:'center'});

 // Overflow always belongs to this term and retains the company/document context.
 const remaining=numbers.slice(capacity);
 const perPage=110;
 for(let offset=0;offset<remaining.length;offset+=perPage) {
  const annex=pdf.addPage(pageSize);header(annex,true);
  text(annex,d.name,margin,129,width,30,{face:bold,size:11});
  text(annex,`CNPJ / CPF: ${formatDocument(d.document)}`,margin,165,width,17,{size:9,ink:palette.muted});
  band(annex,'NÚMEROS NÃO SEQUENCIAIS · CONTINUAÇÃO',200,28,true);
  remaining.slice(offset,offset+perPage).forEach((number,index)=>{
   const row=Math.floor(index/columns),column=index%columns,top=228+row*24;
   rect(annex,margin+column*columnWidth,top,columnWidth,24,row%2?palette.white:palette.soft);
   text(annex,number,margin+column*columnWidth+9,top+5,columnWidth-18,14,{size:9});
  });
 }
 const pages=pdf.getPages();
 pages.forEach((p,index)=>{
  line(p,margin,806,margin+width);
  text(p,'Assine o PDF original e preserve a versão assinada.',margin,813,width-65,11,{size:7,ink:palette.muted});
  text(p,`${index+1} / ${pages.length}`,margin+width-55,813,55,11,{size:7,ink:palette.muted,align:'center'});
 });
 pdf.setTitle('Termo de aceite - Solicitação de portabilidade');
 pdf.setSubject('Autorização de portabilidade para assinatura do responsável');
 pdf.setAuthor('');pdf.setKeywords([]);
 return pdf;
}
export async function downloadPdf(d) {
 const pdf=await createPdf(d),bytes=await pdf.save();
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
 const anchor=document.createElement('a');anchor.href=url;
 anchor.download=`termo-portabilidade-${d.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').slice(0,70)}.pdf`;
 document.body.appendChild(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
