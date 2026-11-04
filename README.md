# Formulário de portabilidade

Formulário para preencher o `TERMO DE PORTABILIDADE.doc`, um campo por vez, e baixar o PDF para assinatura.

```sh
npm install
npm run dev
```

O formulário abre diretamente no último rascunho. O botão **Termos salvos** permite revisar, continuar, baixar e excluir registros. Os rascunhos antigos são preservados, inclusive na mudança da ordem dos campos CEP/endereço.

A consulta do [ViaCEP](https://viacep.com.br/) preenche rua, bairro e cidade após informar oito dígitos de CEP. Número e complemento devem ser conferidos manualmente. Campos já preenchidos são preservados; o usuário pode aplicar explicitamente o endereço encontrado. Consulta abortada ao mudar de CEP/etapa e timeout de oito segundos. Em caso de falha ou CEP inexistente, o preenchimento manual continua disponível.

Os registros ficam apenas no localStorage do navegador e dispositivo usados. Limpar os dados de navegação remove os registros. Apenas o CEP é enviado ao ViaCEP; os demais dados do formulário não são enviados ao servidor. CPF/CNPJ é validado pelo tamanho, não pelos dígitos verificadores ou titularidade.

## Modelo do PDF

`src/assets/termo-original.pdf` foi convertido do `.doc` fornecido. O PDF é preenchido sobre esse modelo com `pdf-lib`, mantendo logo, cores, tabelas, textos e espaços originais. O único ajuste no modelo coloca a legenda **ASSINATURA** sob a respectiva linha, evitando a segunda página que no `.doc` continha apenas essa legenda.

As três seções de linhas são preservadas; apenas a modalidade escolhida é preenchida. Até 20 números não sequenciais cabem no quadro original. Números adicionais seguem em anexo identificado com contratante e CPF/CNPJ, sem truncamento. O tamanho da fonte se adapta ao conteúdo dos campos.

Para recriar o modelo após alterar o arquivo Word:

```sh
libreoffice --headless --convert-to pdf --outdir /tmp 'TERMO DE PORTABILIDADE.doc'
node scripts/prepare-template.mjs '/tmp/TERMO DE PORTABILIDADE.pdf'
```

A conversão só é necessária ao modificar o modelo; não é executada no servidor ou durante o build.

## Vercel

Importe o repositório, usando preset **Vite**, build `npm run build` e saída `dist`. Não requer banco de dados, chave de API nem variáveis de ambiente.

## Verificação

```sh
npm run build
npx playwright install chromium
npm test
```

Os testes cobrem preenchimento, consulta de CEP com respostas controladas, falha de consulta, resposta tardia, migração de rascunho, responsividade, validação de faixa DDR e download do PDF na revisão e no histórico.
