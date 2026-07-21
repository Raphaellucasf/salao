# Migrações Supabase

Esta é a única fonte executável e ordenada de mudanças do banco do Otimiza Beauty.

- Diretório canônico: `supabase/migrations/`
- Ordem: timestamp crescente do nome do arquivo.
- Ambiente autorizado nesta auditoria: somente Supabase de teste.
- Produção exige comparação de schema, backup, homologação e autorização separada.
- Nunca copie migrações manualmente do diretório `database/`: ele contém material histórico.

Antes de aplicar uma nova migração:

1. inspecione o catálogo e dados incompatíveis;
2. execute preflight dentro de transação com `ROLLBACK`;
3. revise RLS, grants, `search_path` e relações entre unidades;
4. aplique uma única migração revisada;
5. execute advisors e testes negativos;
6. gere novamente `src/types/supabase.ts`.

Não coloque chaves em SQL, Vault versionado, documentação ou logs.
