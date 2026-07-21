# Operação de segurança

## SEC-06 — migração de chaves expostas

O Supabase não recomenda mais “girar” os JWTs legados `anon`/`service_role`. O procedimento atual é migrar para chaves independentes:

- browser: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`;
- backend: `SUPABASE_SECRET_KEY=sb_secret_...`.

A aplicação já aceita os nomes modernos prioritariamente. Os fallbacks legados só podem ser removidos depois de atualizar os ambientes sem causar indisponibilidade.

### Procedimento no Dashboard

Execute separadamente no teste e na produção, sem enviar valores pelo chat:

1. Abra **Settings → API Keys → Publishable and secret API keys**.
2. Confirme/crie a publishable key.
3. Crie uma secret key exclusiva para o backend Otimiza Beauty.
4. Atualize o secret manager/local env autorizado com os dois nomes modernos.
5. Execute `npm run verify:key-rotation`; ele valida somente presença/formato e nunca imprime valores.
6. Execute uma chamada server-side autenticada e os testes de login.
7. Verifique integrações, jobs, webhooks e ambientes externos.
8. Consulte o indicador de último uso e desative as chaves legadas `anon`/`service_role`.
9. Em **Authentication → Password Security**, habilite a proteção contra senhas vazadas.
10. Reexecute o Security Advisor.

Desativar antes de substituir todos os consumidores pode interromper a aplicação. A secret key continua com privilégios elevados e nunca pode ir ao browser, Git, documentação, logs, URL ou chat.

## Estado observado em 2026-07-18

- O projeto de teste já possui uma publishable key moderna ativa, mas a chave pública legada também permanece ativa.
- O conector não cria, revela ou revoga secret keys e não altera configuração de Auth.
- `.env.local` e `.env.production.local` ainda usam os dois nomes legados; `npm run verify:key-rotation` falha fechado até a substituição.
- O advisor do teste mantém o WARN `auth_leaked_password_protection`.
- Produção não foi alterada.
- O scanner do repositório não encontra os valores expostos conhecidos.

## Estado confirmado do banco de testes

- 56 tabelas públicas com RLS; 50 tabelas de negócio possuem isolamento obrigatório por unidade.
- 50 policies restritivas, 50 gatilhos de imutabilidade e 50 verificações de relações entre tenants.
- Três achados de segurança: dois INFO intencionais em tabelas globais service-only e o WARN de proteção de senha.
- 38 migrações desta auditoria em uma única cadeia local `supabase/migrations/`.
- Produção não foi inspecionada nem alterada.

## Observabilidade mínima

- Registrar rota, status, request ID, unidade autorizada e classe do erro.
- Nunca registrar tokens, cookies, chaves, payloads financeiros completos ou dados pessoais desnecessários.
- Alertar sobre picos de 401/403, tentativas cruzadas, duplicidade, compensações e falhas de webhook.

