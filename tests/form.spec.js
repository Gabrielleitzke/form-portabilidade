import {test,expect} from '@playwright/test';
import {PDFDocument} from 'pdf-lib';
const sampleCep={cep:'01001-000',logradouro:'Praça da Sé',bairro:'Sé',localidade:'São Paulo',uf:'SP'};
const continueStep=page=>page.getByRole('button',{name:'Continuar',exact:true}).click();
async function identity(page) {
 for(const value of ['Empresa Teste Ltda','12345678000195']){await page.locator('main input').fill(value);await continueStep(page);}
 await page.getByLabel('Número do RG',{exact:true}).fill('12.345.678-2');
 await page.getByLabel('UF de emissão').selectOption('SP');await continueStep(page);
}
async function finish(page) {
 await page.getByLabel('Rua e bairro',{exact:true}).fill('Praça da Sé, Sé');await continueStep(page);
 await continueStep(page);await expect(page.getByRole('alert')).toContainText('número do imóvel');
 await page.getByLabel('Número do imóvel',{exact:true}).fill('120');await page.getByLabel('Complemento (opcional)',{exact:true}).fill('sala 4');await continueStep(page);
 for(const value of ['São Paulo / SP','Vivo','1130000000','Maria da Silva']){await page.locator('main input').fill(value);await continueStep(page);}
 await page.getByRole('button',{name:'Revisar termo',exact:true}).click();
}
test('consulta CEP, retoma rascunho e baixa PDF nos dois botões',async({page},testInfo)=>{
 await page.route('https://viacep.com.br/ws/*/json/',route=>route.fulfill({json:sampleCep}));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Quem é o contratante?'})).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('formulario.png'),fullPage:true});
 await continueStep(page);await expect(page.getByRole('alert')).toContainText('Preencha');
 await identity(page);
 await page.getByLabel('CEP',{exact:true}).fill('01001000');
 await expect(page.getByText('Praça da Sé, Sé — São Paulo / SP')).toBeVisible();
 await continueStep(page);
 await expect(page.getByLabel('Rua e bairro',{exact:true})).toHaveValue('Praça da Sé, Sé');
 await page.reload();
 await expect(page.getByRole('heading',{name:'Qual é o endereço?'})).toBeVisible();
 await finish(page);
 await expect(page.getByRole('heading',{name:'Revisar termo',exact:true})).toBeVisible();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar PDF',exact:true}).click();
 const download=await downloadPromise;await download.saveAs(testInfo.outputPath('termo-portabilidade-exemplo.pdf'));
 expect(download.suggestedFilename()).toBe('termo-portabilidade-Empresa-Teste-Ltda.pdf');
 const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream) chunks.push(chunk);
 const pdf=await PDFDocument.load(Buffer.concat(chunks));expect(pdf.getPageCount()).toBe(1);
 await expect(page.getByRole('dialog',{name:'PDF pronto. Falta a assinatura.'})).toBeVisible();
 await expect(page.getByRole('link',{name:/Gov.br/})).toHaveAttribute('href','https://assinador.iti.br/');
 await page.getByRole('button',{name:'Entendi',exact:true}).click();
 await page.getByRole('button',{name:/Termos salvos/}).click();
 await expect(page.getByText(/Concluído/)).toBeVisible();
 const secondDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar PDF de Empresa Teste Ltda'}).click();
 expect((await secondDownload).suggestedFilename()).toBe(download.suggestedFilename());
 await page.getByRole('button',{name:'Entendi',exact:true}).click();
 await page.getByRole('button',{name:'Excluir termo de Empresa Teste Ltda'}).click();await page.getByRole('button',{name:'Excluir termo',exact:true}).click();
 await expect(page.getByText('Nenhum termo salvo encontrado.')).toBeVisible();
 await page.getByRole('button',{name:'Voltar ao formulário'}).click();
 await expect(page.getByRole('heading',{name:'Quem é o contratante?'})).toBeVisible();
});
test('falha de CEP permite preencher manualmente; responsivo e faixa DDR',async({page})=>{
 await page.route('https://viacep.com.br/ws/*/json/',route=>route.fulfill({json:{erro:true}}));
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await identity(page);await page.getByLabel('CEP',{exact:true}).fill('99999999');
 await expect(page.getByText(/CEP não encontrado/)).toBeVisible();await continueStep(page);
 await page.getByLabel('Rua e bairro',{exact:true}).fill('Rua Teste');await continueStep(page);
 await page.getByLabel('Número do imóvel',{exact:true}).fill('2');await continueStep(page);
 for(const value of ['São Paulo / SP','Vivo']){await page.locator('main input').fill(value);await continueStep(page);}
 await page.getByRole('button',{name:'Faixa DDR'}).click();await page.getByLabel('Número inicial').fill('1130000010');await page.getByLabel('Número final').fill('1130000000');
 await continueStep(page);await expect(page.getByRole('alert')).toContainText('faixa');
 await page.getByLabel('Número final').fill('1130000020');await continueStep(page);
 await expect(page.getByRole('heading',{name:'Quem vai assinar o termo?'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('consulta atrasada não sobrescreve o endereço digitado manualmente',async({page})=>{
 let resolveLookup;
 await page.route('https://viacep.com.br/ws/*/json/',async route=>{await new Promise(resolve=>{resolveLookup=resolve;});await route.fulfill({json:sampleCep}).catch(()=>{});});
 await page.goto('/');await identity(page);await page.getByLabel('CEP',{exact:true}).fill('01001000');
 await expect(page.getByText('Consultando CEP…')).toBeVisible();await continueStep(page);
 await page.getByLabel('Rua e bairro',{exact:true}).fill('Endereço manual, 99');resolveLookup();
 await expect(page.getByLabel('Rua e bairro',{exact:true})).toHaveValue('Endereço manual, 99');
});
test('preserva rascunho anterior na mudança da ordem CEP/endereço',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('porta-forms-v1',JSON.stringify([{id:'old',name:'Empresa antiga',document:'12345678000190',rg:'123',address:'Rua antiga, 1',cep:'01001000',city:'São Paulo / SP',carrier:'Vivo',mode:'single',phone:'1130000000',first:'',last:'',numbers:'',signer:'Maria',date:'2026-11-04',step:3,status:'draft'}])));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Qual é o endereço?'})).toBeVisible();await expect(page.getByLabel('Rua e bairro',{exact:true})).toHaveValue('Rua antiga, 1');
});
for (const mode of ['range','list']) {
 test(`PDF preserva modelo e todos os números: ${mode}`,async({page},testInfo)=>{
  const numbers=Array.from({length:35},(_,i)=>String(1130000000+i));
  const record={id:'pdf-test',flowVersion:3,name:'Empresa de Serviços de Telecomunicações e Tecnologia Ltda.',document:'12.ABC.345/01DE-35',rgType:'rg',rgUf:'MG',rg:'MG-12.345.678',address:'Avenida das Nações Unidas, Centro',number:'12345',complement:'sala 101, Edifício Comercial',cep:'01001-000',city:'São Paulo / SP',carrier:'Vivo',mode,phone:'',first:'1130000000',last:'1130000034',numbers:numbers.join('\n'),signer:'Maria de Oliveira da Silva',date:'2026-11-04',step:11,status:'draft'};
  await page.addInitScript(record=>localStorage.setItem('porta-forms-v1',JSON.stringify([record])),record);
  await page.goto('/');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar PDF',exact:true}).click();
  const download=await pending;await download.saveAs(testInfo.outputPath(`termo-${mode}.pdf`));
  const stream=await download.createReadStream(),chunks=[];for await(const chunk of stream) chunks.push(chunk);
  const pdf=await PDFDocument.load(Buffer.concat(chunks));expect(pdf.getPageCount()).toBe(mode==='list'?2:1);
 });
}
test('campo aceita CNPJ alfanumérico e bloqueia DV inválido; RG pede UF',async({page})=>{
 await page.goto('/');await page.getByLabel('Razão social ou nome completo').fill('Empresa Alfanumérica');await continueStep(page);
 const document=page.getByLabel('CPF / CNPJ',{exact:true});
 await expect(document).not.toHaveAttribute('inputmode','numeric');
 await document.fill('12.ABC.345/01DE-36');await continueStep(page);await expect(page.getByRole('alert')).toContainText('CNPJ inválido');
 await document.fill('12.abc.345/01de-35');await expect(document).toHaveValue('12.ABC.345/01DE-35');await continueStep(page);
 await page.getByLabel('Número do RG',{exact:true}).fill('12.345.678-X');await continueStep(page);await expect(page.getByRole('alert')).toContainText('UF');
 await page.getByRole('button',{name:'CIN (novo documento)',exact:true}).click();await page.getByLabel('CPF da CIN',{exact:true}).fill('52998224726');await continueStep(page);await expect(page.getByRole('alert')).toContainText('CIN usa o CPF');
 await page.getByLabel('CPF da CIN',{exact:true}).fill('52998224725');await continueStep(page);await expect(page.getByRole('heading',{name:'Qual é o CEP?'})).toBeVisible();
});
test('termo antigo não baixa sem confirmar número obrigatório',async({page})=>{
 const record={id:'old-number',flowVersion:2,name:'Empresa Antiga',document:'12345678000195',rgType:'rg',rgUf:'SP',rg:'12.345.678-2',address:'Rua Antiga, 42, Centro',cep:'01001000',city:'São Paulo / SP',carrier:'Vivo',mode:'single',phone:'1130000000',numbers:'',signer:'Maria Silva',date:'2026-11-04',step:10,status:'draft'};
 await page.addInitScript(record=>localStorage.setItem('porta-forms-v1',JSON.stringify([record])),record);
 await page.goto('/');await page.getByRole('button',{name:'Baixar PDF',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Qual é o número do imóvel?'})).toBeVisible();
 await expect(page.getByRole('alert')).toContainText('número do imóvel');
 await expect(page.getByLabel('Número do imóvel',{exact:true})).toHaveValue('');
});
