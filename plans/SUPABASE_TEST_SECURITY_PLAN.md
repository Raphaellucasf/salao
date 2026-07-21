# Plano de correção do Supabase de testes

Data da linha de base: 2026-07-17  
Última verificação: 2026-07-18  
Projeto de teste: `blzargagmyjdihdkmcwg`

## Resultado

O plano foi executado no ambiente de teste. A linha de base tinha tabelas sem RLS, grants destrutivos, views/funções privilegiadas, ausência de isolamento por unidade, FKs sem índice e operações não atômicas.

O estado verificado agora é:

- 56/56 tabelas públicas com RLS;
- 50 tabelas de negócio com `unit_id NOT NULL`, FK, índice e policy restritiva;
- 50 gatilhos de imutabilidade e 50 verificações de relações entre tenants;
- views `security_invoker`, funções com `search_path` fixo e grants mínimos;
- fluxos financeiros, comandas, estoque, pacotes e catálogo críticos em RPCs transacionais;
- zero initplan RLS, sobreposição permissiva ou índice duplicado apontado pelo advisor;
- três achados de segurança remanescentes: dois INFO intencionais em tabelas globais service-only e proteção contra senhas vazadas ainda desabilitada;
- 38 migrações desta auditoria registradas no teste.

## Pendência de credenciais

As chaves privilegiadas compartilhadas devem ser substituídas por chaves independentes `sb_secret_`; aplicações públicas devem usar `sb_publishable_`. Depois de atualizar todos os consumidores e verificar uso, as chaves legadas precisam ser desativadas no Dashboard. Não envie os novos valores pelo chat.

## Produção

Produção não foi inspecionada nem alterada. Nenhuma migração deste plano está aprovada implicitamente para promoção. São obrigatórios comparação de schema/dados, backup, homologação com duas unidades, plano de rollback e autorização separada.

A evidência detalhada e cronológica está em `plans/AUDITORIA_VIVA.md`.

