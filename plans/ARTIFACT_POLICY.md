# Política de artefatos locais

## Versionar

- Código-fonte, configuração reproduzível e testes determinísticos.
- Documentação vigente e planos de migração revisados.
- `.env.example` somente com placeholders sem valor real.
- Migrações de banco aprovadas, numeradas e imutáveis após aplicação.

## Não versionar

- `.env.local`, `.env.production.local` e qualquer segredo.
- `.next`, `playwright-report`, `test-results`, coverage e traces.
- Saídas locais `*_out.txt`, `*_output.txt`, `lint_output.txt`, `playwright_out*.txt` e `tsc*.txt`.
- Estado de agentes/ferramentas em `.agents`.
- Dumps, backups e cópias de dados reais, mesmo quando sanitizados informalmente.

## Retenção

- Relatórios de CI devem ficar no provedor de CI com retenção limitada, não no Git.
- Traces E2E podem conter cookies, URLs e payloads; compartilhar apenas após sanitização.
- Backups devem usar armazenamento criptografado, acesso mínimo e política formal de expiração.

## Verificações antes de publicar

1. Executar `npm run test:secrets`.
2. Conferir `git status --short` e classificar cada arquivo novo.
3. Não adicionar arquivos ignorados com `git add -f` sem revisão de segurança.
4. Confirmar que logs e screenshots não contêm dados pessoais ou credenciais.
