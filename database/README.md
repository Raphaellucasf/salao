# Arquivos históricos de banco

> **NÃO EXECUTE os arquivos desta pasta como instalação, migração ou reparo.**

`database/` preserva documentação e scripts anteriores à cadeia canônica. Alguns refletem schemas, policies e premissas que já foram substituídos e podem conflitar com o banco atual.

A única fonte executável é [`supabase/migrations/`](../supabase/migrations/), documentada em [`supabase/README.md`](../supabase/README.md). Novas mudanças devem ser criadas ali, ordenadas por timestamp, verificadas primeiro no ambiente de teste e nunca copiadas cegamente para produção.

Subdiretórios:

- `database/migrations/`: cópias históricas das primeiras rodadas;
- `database/drafts/`: propostas não executáveis;
- SQLs soltos: referência histórica/bootstrap legado, sem autoridade sobre o schema implantado.

Consulte `plans/AUDITORIA_VIVA.md` para o estado verificado.
