// Usage: node scripts/prepare-template.mjs /path/to/converted-original.pdf
// First convert TERMO DE PORTABILIDADE.doc with LibreOffice / Word.
import {readFile,writeFile} from 'node:fs/promises';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
const source=await PDFDocument.load(await readFile(process.argv[2]));
const template=await PDFDocument.create();
const [page]=await template.copyPages(source,[0]);
template.addPage(page);
// The source .doc spills only the word "ASSINATURA" onto page 2.
// Keep the signature caption under its original line on the same page.
const font=await template.embedFont(StandardFonts.HelveticaBold);
const size=9,text='ASSINATURA',center=(279.7+530.26)/2;
page.drawText(text,{font,size,x:center-font.widthOfTextAtSize(text,size)/2,y:page.getHeight()-781,color:rgb(0,0,0)});
template.setTitle('Termo de aceite - Solicitação de portabilidade');
await writeFile('src/assets/termo-original.pdf',await template.save());
