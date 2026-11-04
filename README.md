# Porta · Termos de portabilidade

Aplicação React + Vite para preencher o modelo `TERMO DE PORTABILIDADE.doc`, um campo por vez, revisar e baixar um PDF com espaço para assinatura.

## Desenvolvimento

```sh
npm install
npm run dev
```

## Vercel

Importe este repositório na Vercel, selecionando o preset **Vite**. Build: `npm run build`. Diretório de saída: `dist`. Não são necessárias variáveis de ambiente, API ou banco de dados.

## Funcionalidades

- Dez passos com validação de obrigatoriedade e formato de CPF/CNPJ, CEP e telefones.
- Acesso único, faixa sequencial DDR/ramal e lista de números não sequenciais.
- Rascunhos salvos automaticamente no localStorage, busca, filtros e exclusão com confirmação.
- Revisão e edição antes de baixar PDF A4, com texto selecionável e paginação automática.
- Declaração preservada do documento original. Assinatura feita pelo cliente após receber o PDF.

Os registros ficam apenas no navegador e dispositivo usados. Limpar os dados de navegação remove os registros. Não há envio de dados do formulário ao servidor. A validação de CPF/CNPJ verifica o tamanho, não dígitos verificadores ou titularidade.

## Verificação

```sh
npm run build
npx playwright install chromium
npm test
```
