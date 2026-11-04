import {test,expect} from '@playwright/test';
test('preenche, retoma rascunho, gera PDF e exclui termo',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Novo termo',exact:true}).click();
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Preencha');
 const values=['Empresa Teste Ltda','12345678000190','1234567','Rua das Flores, 120, Centro','01001000','São Paulo / SP','Vivo','1130000000','Maria da Silva'];
 for(let i=0;i<values.length;i++){
  await page.locator('main input').fill(values[i]);
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  if(i===2){await page.reload();await page.getByRole('button',{name:'Continuar',exact:false}).first().click();await expect(page.getByRole('heading',{name:'Qual é o endereço completo?'})).toBeVisible();}
 }
 await page.getByRole('button',{name:'Revisar termo'}).click();
 await expect(page.getByRole('heading',{name:'Termo de aceite',exact:true})).toBeVisible();
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Baixar PDF',exact:true}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('termo-portabilidade-Empresa-Teste-Ltda.pdf');
 const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream) chunks.push(chunk);
 const pdf=Buffer.concat(chunks).toString('latin1');expect(pdf.startsWith('%PDF-')).toBeTruthy();expect(pdf).toContain('Maria da Silva');expect(pdf).toContain('ASSINATURA');
 await page.getByRole('button',{name:'Voltar para meus termos'}).click();
 await expect(page.getByText('Concluído',{exact:true})).toBeVisible();
 await page.reload();await expect(page.getByText('Empresa Teste Ltda',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Excluir termo de Empresa Teste Ltda'}).click();
 await page.getByRole('button',{name:'Excluir termo',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Seu primeiro termo começa aqui'})).toBeVisible();
});
test('responsivo e validação de faixa DDR',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 await page.getByRole('button',{name:'Novo termo',exact:true}).click();
 for(const value of ['Pessoa Teste','12345678901','1234','Rua Teste, 2','01001000','São Paulo / SP','Vivo']){await page.locator('main input').fill(value);await page.getByRole('button',{name:'Continuar',exact:true}).click();}
 await page.getByRole('button',{name:'Faixa DDR'}).click();
 await page.getByLabel('Número inicial').fill('1130000010');await page.getByLabel('Número final').fill('1130000000');
 await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.getByRole('alert')).toContainText('faixa');
 await page.getByLabel('Número final').fill('1130000020');await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Quem vai assinar o termo?'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
