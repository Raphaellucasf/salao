# Diagnóstico e robustez na criação de usuários (Supabase)

## Escopo

Este documento registra uma análise focal do erro `Unexpected end of JSON input` no fluxo de criação de usuários. Ele não certifica a segurança global de autenticação, roles ou RLS; para o estado atual, consulte `plans/AUDITORIA_VIVA.md`.

## Diagnóstico do erro de resposta

- O erro ocorre quando o frontend tenta interpretar como JSON uma resposta vazia ou malformada.
- O cliente deve verificar `res.ok` e tratar falha de parsing sem exibir detalhes internos.
- A API deve retornar `NextResponse.json` em todos os caminhos esperados e possuir captura de exceções no limite do handler.

## Riscos relacionados confirmados

- A role administrativa canônica é validada em `public.users`; metadata editável pelo usuário não é autoridade.
- O ambiente de testes possui 56 tabelas públicas com RLS; as 50 tabelas de negócio estão isoladas por unidade.
- A criação/atualização de usuários usa tipos regenerados do schema de teste e ainda precisa de homologação HTTP integrada.
- A produção não está acessível pela conta conectada e não foi comparada com o teste.

## Recomendações

- Testar respostas vazias, JSON inválido, 401, 403, conflito de email e falha parcial entre Auth e perfil público.
- Nunca registrar senha temporária, token, cookie ou corpo completo de criação de usuário.
- Manter criação e alteração de role exclusivamente em APIs administrativas com autorização antes do banco.
- Não promover alterações de schema/RLS sem primeiro validar o ambiente de testes e um plano de rollback.

## Estado

Revisão documental somente. Nenhuma migração, deploy, commit ou push foi executado por esta auditoria.
