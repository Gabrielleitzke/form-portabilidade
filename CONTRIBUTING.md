# Como contribuir

Para sugerir uma melhoria ou relatar um problema, abra uma issue com o comportamento esperado e os passos para reproduzir. Em problemas visuais, informe o navegador e o tamanho da tela.

Para enviar uma alteração:

1. Faça um fork e crie uma branch para a mudança.
2. Instale as dependências com `npm ci` (Node.js 24.x).
3. Faça uma alteração pequena e focada. Acrescente ou ajuste testes quando mudar o comportamento.
4. Execute `npm run build` e `npm test`. Na primeira vez, instale o navegador com `npx playwright install chromium`.
5. Abra um pull request explicando o que mudou e como verificou.

Use dados fictícios em testes e exemplos. Não inclua credenciais, dados de clientes ou documentos preenchidos em commits, issues ou capturas de tela.

Ao contribuir com código ou documentação de sua autoria, você concorda com a disponibilização da contribuição sob a licença MIT do projeto.
