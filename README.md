# Formulário de portabilidade VoIP

Uma aplicação simples para preencher termos de portabilidade, um passo por vez, e gerar um PDF para assinatura. Funciona no navegador, sem cadastro, servidor de aplicação ou banco de dados.

## O que faz

- Preenchimento guiado, com consulta de endereço pelo [ViaCEP](https://viacep.com.br/).
- Validação de CPF e CNPJ numérico ou alfanumérico; conferência de formato e UF do RG e suporte à CIN.
- Acesso único, faixa DDR/ramal e lista de números não sequenciais.
- Rascunhos automáticos, histórico e edição dos termos no próprio navegador.
- PDF A4 com revisão dos dados e orientações para assinatura após o download.
- Interface adaptada para computador e celular.

A validação dos documentos não consulta existência, situação cadastral ou titularidade. O aplicativo gera o termo; a assinatura eletrônica é feita fora dele, conforme os requisitos da operadora.

## Rodar localmente

Requisitos: **Node.js 24.x** e npm.

```sh
git clone https://github.com/Gabrielleitzke/form-portabilidade.git
cd form-portabilidade
npm ci
npm run dev
```

Abra o endereço exibido no terminal. Não são necessárias chaves de API nem variáveis de ambiente.

## Build e testes

```sh
npm run build
npm run preview
```

Para executar os testes de fluxo, validação e mobile:

```sh
npx playwright install chromium
npm test
```

Os testes usam dados de exemplo e respostas controladas para a consulta de CEP. O servidor de testes é encerrado automaticamente. A verificação mobile simula toque em telas de 320, 390 e 430 pixels no Chromium; não substitui testes em aparelhos físicos.

## Publicar na Vercel

Importe este repositório em [Vercel → New Project](https://vercel.com/new), mantenha a raiz `./` e clique em **Deploy**. A configuração está em [vercel.json](vercel.json): Vite, instalação `npm ci`, build `npm run build` e saída `dist`.

## Dados e privacidade

Os formulários ficam no `localStorage` do navegador e dispositivo utilizados. Limpar os dados de navegação remove os registros. Não há sincronização nem armazenamento dos formulários no servidor.

Somente o CEP é enviado ao ViaCEP. Os links de assinatura não enviam arquivos automaticamente. Ao abrir a aplicação em outro domínio ou navegador, o histórico anterior não estará disponível.

## Organização

- `src/`: formulário, validações, consulta de CEP, geração do PDF e estilos.
- `src/assets/`: logo utilizado no documento.
- `tests/`: testes automatizados com Playwright.
- `docs/referencias/`: modelos usados como referência visual, fora do build.

## Contribuir

Sugestões e correções são bem-vindas. Abra uma [issue](https://github.com/Gabrielleitzke/form-portabilidade/issues) ou envie um pull request. Veja o [guia de contribuição](CONTRIBUTING.md).

## Licença

O código e a documentação do projeto são disponibilizados sob a [licença MIT](LICENSE). O logo e os documentos de referência não estão incluídos nessa licença; seus direitos permanecem com os respectivos titulares. Veja [NOTICE.md](NOTICE.md).
