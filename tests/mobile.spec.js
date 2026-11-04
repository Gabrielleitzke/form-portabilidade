import {test,expect} from '@playwright/test';
const record={id:'mobile',flowVersion:3,name:'Empresa de Serviços de Telecomunicações e Tecnologia para Empresas Ltda.',document:'12.ABC.345/01DE-35',rgType:'rg',rgUf:'SP',rg:'12.345.678-2',address:'Avenida das Nações Unidas, Centro',number:'120A',complement:'sala 101, Edifício Comercial',cep:'01001-000',city:'São Paulo / SP',carrier:'Vivo',mode:'single',phone:'1130000000',first:'1130000000',last:'1130000010',numbers:'1130000000\n1130000001',signer:'Maria de Oliveira da Silva',date:'2026-11-04',step:0,status:'draft'};
async function noOverflow(page) {
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 const outside=await page.locator('main input, main select, main textarea, main .primary, main .secondary').evaluateAll(elements=>elements.filter(element=>{const r=element.getBoundingClientRect();return r.left<0||r.right>innerWidth+1;}).map(element=>element.outerHTML.slice(0,100)));
 expect(outside).toEqual([]);
}
for(const width of [320,390,430]) {
 test(`mobile ${width}px: etapas, revisão, download e histórico`,async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width,height:740},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const page=await context.newPage();
  try {
   await page.goto('/');
   const states=Array.from({length:12},(_,step)=>({step,mode:'single'})).concat([{step:8,mode:'range'},{step:8,mode:'list'}]);
   for(const state of states) {
    await page.evaluate(data=>localStorage.setItem('porta-forms-v1',JSON.stringify([data])),{...record,...state});
    await page.reload();await expect(page.locator('main h1')).toBeVisible();await noOverflow(page);
    if([2,5,10,11].includes(state.step))await page.screenshot({path:testInfo.outputPath(`etapa-${state.step}.png`),fullPage:true});
   }
   await page.evaluate(data=>localStorage.setItem('porta-forms-v1',JSON.stringify([data])),{...record,step:11});
   await page.reload();
   const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Baixar PDF',exact:true}).tap();
   const download=await pending;expect(download.suggestedFilename()).toMatch(/\.pdf$/);
   const dialog=page.getByRole('dialog',{name:'PDF pronto. Falta a assinatura.'});await expect(dialog).toBeVisible();
   expect(await dialog.evaluate(element=>element.scrollWidth<=element.clientWidth)).toBeTruthy();
   await page.screenshot({path:testInfo.outputPath('assinatura-inicio.png')});
   await page.getByRole('button',{name:'Entendi',exact:true}).scrollIntoViewIfNeeded();await expect(page.getByRole('button',{name:'Entendi',exact:true})).toBeInViewport();
   await page.screenshot({path:testInfo.outputPath('assinatura.png')});
   await page.getByRole('button',{name:'Entendi',exact:true}).tap();
   await page.getByRole('button',{name:/Termos salvos/}).tap();await noOverflow(page);
   const smallTargets=await page.locator('button:visible').evaluateAll(buttons=>buttons.filter(button=>button.getBoundingClientRect().height<44).map(button=>button.textContent||button.getAttribute('aria-label')));
   expect(smallTargets).toEqual([]);
   await page.screenshot({path:testInfo.outputPath('historico.png'),fullPage:true});
   await page.getByRole('button',{name:/Excluir termo de/}).tap();await expect(page.getByRole('dialog',{name:'Excluir este termo?'})).toBeVisible();await noOverflow(page);
   await page.getByRole('button',{name:'Cancelar',exact:true}).tap();
  } finally {await context.close();}
 });
}
