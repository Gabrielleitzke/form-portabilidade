# Formulário de portabilidade

Formulário para preencher o `TERMO DE PORTABILIDADE.doc`, um campo por vez, e baixar o PDF para assinatura.

```sh
npm install
npm run dev
```

O formulário abre diretamente no último rascunho. **Termos salvos** permite revisar, continuar, baixar e excluir registros. Rascunhos antigos são preservados; os campos novos e os documentos são conferidos novamente antes de baixar o PDF.

## Endereço

A consulta do [ViaCEP](https://viacep.com.br/) preenche rua, bairro e cidade após informar oito dígitos de CEP. O número é um campo separado e obrigatório, com complemento opcional. Aceita sufixo, como `120A`, e `S/N` quando o imóvel não possui número. Campos já preenchidos são preservados; o usuário pode aplicar explicitamente o endereço encontrado. A consulta é cancelada ao mudar de CEP/etapa, com timeout de oito segundos. Se a consulta falhar ou o CEP não existir, o preenchimento manual continua disponível.

## Documentos

- **CPF**: formato, repetição e os dois dígitos verificadores.
- **CNPJ numérico e alfanumérico**: 14 posições, com dois verificadores numéricos. Letras são preservadas e convertidas para maiúsculas. Cálculo por módulo 11, usando o valor ASCII de cada caractere menos 48 e os pesos oficiais, conforme o [Anexo XV da Receita Federal](https://normas.receita.fazenda.gov.br/sijut2consulta/anexoOutros.action?idArquivoBinario=76204). Exemplos de teste: `12.345.678/0001-95` e `12.ABC.345/01DE-35`.
- **RG**: tipo selecionado, UF de emissão obrigatória, formato, comprimento e caracteres; preserva zeros à esquerda, prefixos e sufixos com letras. Não aplica um único algoritmo de DV a documentos de todos os estados. Não há verificação de existência, titularidade ou consulta cadastral.
- **CIN**: opção distinta do RG estadual; valida o CPF que identifica a Carteira de Identidade Nacional, conforme as [orientações oficiais da CIN](https://www.gov.br/gestao/pt-br/identidade-nacional).

Validação matemática não confirma a existência, situação cadastral ou titularidade de CPF/CNPJ. Dados do representante que assina podem ser diferentes dos dados do contratante.

## PDF e assinatura

O PDF A4 mantém as seções, a declaração e o logo do termo original. As tabelas são desenhadas em vetor com `pdf-lib`, usando bordas leves, roxo discreto, células com respiro e texto selecionável. Rua/bairro, número e complemento compõem o endereço completo. RG ou CIN e UF são incluídos na identificação. O modelo antigo permanece em `src/assets/termo-original.pdf` como referência visual; o logo extraído está em `src/assets/logo-original.png`.

As três modalidades de linhas permanecem no documento; apenas a escolhida é preenchida. Até 20 números não sequenciais cabem no quadro principal; os demais seguem em anexos com contratante, CPF/CNPJ e paginação, sem truncamento. A assinatura fica na mesma página da declaração, com espaço para assinatura digital.

Após qualquer download, inclusive pelo histórico, a aplicação exibe instruções para o responsável assinar pelo [Gov.br](https://assinador.iti.br/) (conta prata/ouro, quando aceito pela operadora) ou com certificado ICP-Brasil. Orienta a baixar/preservar o arquivo assinado e conferir a assinatura no [VALIDAR do ITI](https://validar.iti.gov.br/), sem editar nem imprimir para PDF após assinar. A aplicação não assina o documento nem afirma que o simples download lhe confere validade. A orientação segue o [serviço oficial de assinatura eletrônica](https://www.gov.br/governodigital/pt-br/identidade/assinatura-eletronica/assinatura-eletronica/) e observa os requisitos da operadora.

## Armazenamento

Os registros ficam apenas no localStorage do navegador/dispositivo. Limpar os dados de navegação remove os registros. Apenas o CEP é enviado ao ViaCEP; os demais dados não são enviados ao servidor. Links de assinatura são abertos somente por ação do usuário e nenhum arquivo é enviado automaticamente.

## Vercel

A configuração está versionada em `vercel.json`: preset **Vite**, instalação `npm ci`, build `npm run build` e saída `dist`. O `package.json` fixa Node.js **24.x**. A `.vercelignore` exclui arquivos locais, testes e documentos de referência do upload via CLI. Não requer banco de dados, chave de API nem variáveis de ambiente.

Para conectar à sua conta: importe `Gabrielleitzke/form-portabilidade` em https://vercel.com/new, mantenha a raiz do repositório (`./`) e clique em Deploy. A integração com GitHub permitirá novos deploys a partir dos pushes. Pela CLI autenticada, use `vercel link --repo` e `vercel deploy` para preview. Deploy de produção deve ser solicitado explicitamente.

## Verificação

```sh
npm run build
npx playwright install chromium
npm test
```

Os testes cobrem preenchimento, número obrigatório, CPF/CNPJ numérico e alfanumérico, RG/CIN, consulta de CEP (respostas controladas), falhas/respostas tardias, migração de rascunhos, responsividade, faixa DDR, anexo de números e download/orientação de assinatura na revisão e no histórico. O servidor de testes é encerrado automaticamente.

### Verificação mobile

`tests/mobile.spec.js` percorre todas as etapas, RG/CIN, modalidades de linhas, revisão, histórico, exclusão e orientação de assinatura nas larguras de 320, 390 e 430 pixels, com toque simulado no Chromium. Verifica ausência de rolagem horizontal, visibilidade dos controles, alvos de toque com pelo menos 44 pixels de altura e download do PDF. Capturas ficam nos resultados locais do Playwright. Essa simulação não substitui testes em aparelhos físicos ou no Safari.

No mobile, os campos usam texto de 16 pixels, os controles têm maior área de toque e o histórico organiza as ações abaixo do nome. O diálogo de assinatura permite rolagem interna e bloqueia a página ao fundo. O PDF mantém somente a paginação no rodapé, sem a frase de orientação final; as instruções de assinatura continuam na interface após o download.
