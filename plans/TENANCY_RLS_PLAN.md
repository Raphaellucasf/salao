# Plano de isolamento por unidade e RLS

Status: implementação concluída e verificada no Supabase de teste. Produção não foi inspecionada nem alterada.

## Estado confirmado no teste

- 56 tabelas no schema `public`, todas com RLS habilitado.
- 50 tabelas de negócio têm `unit_id NOT NULL`, FK para `units`, índice iniciado por `unit_id` e policy restritiva `tenant_unit_boundary`.
- As seis tabelas globais são `units`, `users`, `usuarios`, `roles`, `user_units` e `usuarios_sessoes`.
- `user_units(user_id, unit_id)` é a associação canônica, com no máximo uma unidade padrão ativa por usuário.
- `requireAdmin` deriva `unitId` da associação; nenhum arquivo em `src` conserva `DEFAULT_UNIT_ID`.
- Cinquenta gatilhos tornam `unit_id` imutável e cinquenta gatilhos impedem referências entre registros de unidades diferentes, inclusive em RPCs com `service_role`.
- O resolvedor privado usa a associação Auth ou o header interno `x-unit-id`; o fallback de serviço só funciona quando existe exatamente uma unidade padrão ativa distinta.
- Testes negativos com claims reais e `ROLLBACK` confirmaram: escrita/leitura na unidade A funciona; inserção e leitura cruzadas para B são rejeitadas ou invisíveis.
- `anamneses.cliente_id` e `prontuarios.cliente_id` foram alinhados ao bigint de `clientes.id`; FKs ausentes foram adicionadas. Quatro etapas de serviços já órfãs foram removidas antes de instalar a FK.
- O advisor de segurança registra apenas dois INFO em tabelas globais service-only e um WARN de configuração do Auth.
- As chaves privilegiadas compartilhadas precisam ser rotacionadas; isso é independente do isolamento RLS.
- A produção permanece fora do escopo desta implementação e não deve receber SQL copiado sem comparação.

## Garantias mantidas no código

- A unidade nunca é aceita do payload como autoridade em rotas administrativas.
- Clientes `service_role` recebem o contexto interno da unidade somente depois de autenticação/autorização.
- Buscas por IDs, alterações e exclusões validam a pertença à unidade antes de RPCs privilegiadas.
- Rotas públicas derivam a unidade de entidades ativas selecionadas e validam relações profissionais/serviços dentro dela.
- Tipos TypeScript foram gerados novamente a partir do schema implantado no teste.

## Homologação obrigatória antes de produção

- Repetir os testes com duas unidades e contas descartáveis de administrador e funcionário.
- Exercitar clientes, agenda, caixa, estoque, comandas, pacotes, clínica, relatórios e integrações.
- Confirmar 401/403/404 e ausência de dados parciais ao fornecer IDs de outra unidade.
- Comparar schema, volume, órfãos e memberships de produção antes de preparar qualquer backfill.
- Medir planos e latência das consultas principais com carga representativa.
- Preparar backup, janela de mudança, critérios de abortar e rollback apenas de policies/código; não apagar backfill automaticamente.

## Bloqueios externos

- Rotacionar e revogar as chaves expostas de teste e produção em sessões administrativas autorizadas.
- Habilitar proteção contra senhas vazadas no Auth do teste.
- Conectar a organização de produção para inspeção separada, quando o responsável autorizar.

