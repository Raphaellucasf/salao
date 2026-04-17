# INTEGRATIONS — Otimiza Beauty Manager

_Última atualização: 02/04/2026 | Mapeamento brownfield_

## Supabase (Backend Principal)

| Componente | Uso |
|-----------|-----|
| **Auth** | Login/logout, JWT, sessões via cookies |
| **PostgreSQL** | Banco principal com RLS |
| **Realtime** | Não utilizado (candidato para agenda ao vivo) |
| **Storage** | Referenciado, não confirmado em uso |

**Clientes no código:**
- `src/lib/supabase.ts` → browser (anon key + RLS)
- `src/lib/supabase-server.ts` → API routes (service_role, sem RLS)
- `src/lib/supabase-admin.ts` → ações administrativas (service_role)

## n8n + WhatsApp

- **Trigger**: Criação de agendamento → dispara webhook não-bloqueante para n8n
- **Endpoint público**: `GET /api/whatsapp/horarios` → retorna slots disponíveis
  - Protegido por header `x-api-key` (env `N8N_API_KEY`)
- **URL do webhook**: env `N8N_WEBHOOK_URL`
- **Status**: Funcionando em produção
- **Risco**: Fire-and-forget sem retry/feedback de falha

## Vercel (Deploy)

- `vercel.json` configurado
- Serverless functions para API Routes
- Variáveis de ambiente gerenciadas no painel Vercel
- **Status**: Produção ativa com usuários reais

## Exports (jsPDF + XLSX)

- Bibliotecas instaladas e importadas em `src/services/relatorios.ts`
- Sem API routes dedicadas para export
- Implementação parcial no frontend direto

## Integrações Planejadas / Pendentes

| Integração | Status | Notas |
|-----------|--------|-------|
| **Supabase Realtime** | Planejado | Útil para agenda em tempo real |
| **Push Notifications** | Não iniciado | Para PWA de profissionais |
| **Pagamento online** | Não iniciado | Fora do escopo atual |
| **Multi-unidade** | Parcial | Tabela `units` existe, sem UI multi-tenant |
