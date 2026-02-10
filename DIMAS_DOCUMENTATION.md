# 🎯 DIMAS DONA CONCEPT - Documentação Técnica Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquivos Criados](#arquivos-criados)
3. [Schema do Banco de Dados](#schema-do-banco-de-dados)
4. [APIs Implementadas](#apis-implementadas)
5. [Funcionalidades Especiais](#funcionalidades-especiais)
6. [Guia de Implantação](#guia-de-implantação)
7. [Próximos Passos](#próximos-passos)

---

## 🎨 Visão Geral

Sistema **Otimiza Beauty Manager** personalizado para **Dimas Dona Concept** com arquitetura "Clean Luxury".

### Identidade Visual
- **Estilo:** Minimalista e sofisticado
- **Cores:** Bege (#a89b86), Dourado (#d4af37), Preto Suave (#171717)
- **Tipografia:** Inter/Geist Sans (elegante e moderna)
- **Cards:** Brancos com `shadow-luxury` e `rounded-xl`

### Navegação
- **Desktop:** Sidebar lateral fixa (recolhível)
- **Mobile:** Bottom Navigation Bar (Agenda, Vendas, Clientes, Menu)

---

## 📂 Arquivos Criados

### 1. Database (SQL)
```
database/
├── dimas_schema.sql       # Schema completo com todas as tabelas
└── dimas_seed.sql         # Dados de seed (equipe, serviços, produtos)
```

### 2. APIs (TypeScript)
```
src/app/api/
├── appointments/
│   └── dimas-route.ts     # API com bloqueio duplo MegaHair
├── sales/
│   └── route.ts           # Venda retail + uso interno
└── search/
    └── route.ts           # Busca inteligente por apelidos
```

### 3. Configurações
```
tailwind.config.ts         # Tema Clean Luxury
.env.local                 # Credenciais Supabase configuradas
```

---

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

#### 1. `units` - Unidades/Salões
Armazena dados do salão Dimas Dona Concept.
```sql
- name: "Dimas Dona Concept"
- address: "Rua Mário de Souza Campos, 773, Centro - Birigui/SP"
- phone: "(18) 99768-1052"
- pix_key: "55 18 99768-1052"
- instagram: ["@dimasdona_concept", "@madiosbeauty", "@dimasdona"]
- amenities: ["Wi-Fi", "Café Bar", "Espumante", "Capuccino", "Chás Premium"]
- opening_hours: Terça a Sábado, 08:00-19:00 (Dom/Seg bloqueados)
```

#### 2. `users` - Usuários
Campos especiais:
- `is_vip`: Boolean para clientes VIP
- `anamnese`: JSONB com ficha médica/estética
- `allergies`: Texto com alergias

#### 3. `professionals` - Profissionais
Equipe do salão:
- **Dimas** (Admin/Owner): Estética Masculina, Maquiagem Química VIP
- **Julya**: Estética Feminina, MegaHair
- **Hendril**: Química, Coloração, Progressiva
- **Amélia**: Progressiva, Tratamentos

Campos especiais:
- `specialties`: JSONB array de especialidades
- `commission_percentage`: % de comissão (padrão 50%)
- `priority_level`: 1-3 para auto-atribuição

#### 4. `services` - Serviços
**NOVO:**
- `keywords`: JSONB array para busca inteligente
  - Exemplo: ["tingir", "cobrir brancos", "fazer raiz"]
- `search_vector`: tsvector para full-text search
- `requires_double_booking`: Boolean (true para MegaHair)
- `required_professionals`: JSONB array de IDs obrigatórios
- `is_vip_only`: Boolean para serviços exclusivos

**Serviços Principais:**
- MegaHair (Bloqueio duplo Julya + Dimas)
- Colorações (10GR, 20GR, 40GR, 60GR)
- Luzes + Tonalizante
- Progressivas
- Cortes
- Estética (Design Sobrancelha, Injetável)

#### 5. `products` - Produtos
**NOVO:**
- `is_retail`: Boolean
  - `true` = Venda ao cliente (gera receita)
  - `false` = Uso interno/Backbar (consumo no lavatório)
- `brand`: Keune, Wella, Change
- `min_quantity`: Alerta de estoque crítico

**Produtos Retail (Venda):**
- Linha Change (Shampoo a Seco R$64, Always Blond R$87)
- Linha Wella (Oil Reflection R$196)
- Linha Keune (Care Vital R$118)

**Produtos Uso Interno (Backbar):**
- Tintas Keune (6.0, 7.0, 8.0, 8.1, 9.0, 10.0)
- Tintas Wella (Color Touch, Illumina, Blondor)
- Consumíveis (Papel, Luvas, Gola, Alumínio)

#### 6. `inventory_logs` - Histórico de Estoque
Registra toda movimentação:
- `movement_type`: 'sale', 'internal_use', 'purchase', 'adjustment', 'loss'
- `quantity`: Negativo = saída, Positivo = entrada
- `appointment_id`: Link com serviço (se uso interno)

#### 7. `appointments` - Agendamentos
**NOVO:**
- `secondary_professional_id`: UUID para bloqueio duplo
- `is_double_booking`: Boolean
- `client_is_vip`: Boolean (cache)
- `internal_notes`: Texto (visível só para equipe)

#### 8. `transactions` - Transações
**NOVO:**
- `type`: 'service_income', 'product_sale', 'expense', 'commission', 'vale'
- `installments`: Inteiro (parcelamento)
- `installment_value`: Decimal (valor/parcela)

**Regra:** Mínimo R$100/parcela

#### 9. `commissions` - Comissões
```sql
final_amount = (base_amount - fees_deducted) * (commission_percentage / 100)
```
- `status`: 'pending', 'paid', 'vale_applied'

#### 10. `vales` - Adiantamentos
- Profissionais podem pegar vales
- Admin autoriza (`granted_by`)
- Descontado automaticamente das comissões

#### 11. `blocked_times` - Horários Bloqueados
- `is_override`: Boolean (para admin forçar dom/seg/feriados)

---

## 🚀 APIs Implementadas

### 1. Agendamentos com Bloqueio Duplo
**Arquivo:** `src/app/api/appointments/dimas-route.ts`

#### POST /api/appointments
Cria agendamento com validações avançadas.

**Fluxo MegaHair:**
1. Detecta `requires_double_booking = true`
2. Busca `required_professionals` (Julya + Dimas)
3. Verifica disponibilidade de **ambos** simultaneamente
4. Cria 1 agendamento linkando os 2 profissionais
5. Bloqueia agenda de ambos no horário

**Validações:**
- Conflito de horário (overlap)
- Horários bloqueados (`blocked_times`)
- Serviço VIP only (verifica `users.is_vip`)
- Múltiplos profissionais obrigatórios

**Resposta de Sucesso:**
```json
{
  "appointment": {...},
  "message": "Agendamento criado com bloqueio duplo para Julya e Dimas"
}
```

**Erros:**
- 409: Horário indisponível para um dos profissionais
- 403: Serviço exclusivo para VIPs
- 400: Configuração inválida

#### GET /api/appointments
Lista agendamentos com filtros.

**Query Params:**
- `unit_id`: Filtrar por unidade
- `professional_id`: Mostra agendamentos onde é prof. principal OU secundário
- `status`: pending, confirmed, in_progress, completed, cancelled, no_show
- `date`: YYYY-MM-DD
- `client_id`: Agendamentos do cliente

---

### 2. Vendas e Gestão de Estoque
**Arquivo:** `src/app/api/sales/route.ts`

#### POST /api/sales
Registra venda ou uso interno com gestão de estoque.

**Body:**
```json
{
  "sale_type": "retail_sale" ou "internal_use",
  "unit_id": "UUID",
  "professional_id": "UUID",
  "products": [
    {
      "product_id": "UUID",
      "quantity": 2,
      "price": 64.00  // Opcional, usa sale_price se omitido
    }
  ],
  "appointment_id": "UUID",  // Obrigatório se internal_use
  "payment_method": "cash | card | pix",
  "installments": 3,
  "notes": "Observações"
}
```

**Funcionalidades:**
1. **Venda Retail:**
   - Valida que produto tem `is_retail = true`
   - Calcula total
   - Cria transação tipo 'product_sale'
   - Valida parcelamento (mínimo R$100/parcela)
   - Atualiza estoque
   
2. **Uso Interno (Backbar):**
   - Valida que produto tem `is_retail = false`
   - NÃO gera receita (custo embutido no serviço)
   - Cria log tipo 'internal_use'
   - Atualiza estoque
   - Pode linkar com `appointment_id`

3. **Alertas de Estoque:**
   - Verifica se `quantity <= min_quantity`
   - Retorna `low_stock_alerts` array

**Resposta de Sucesso:**
```json
{
  "success": true,
  "sale_type": "retail_sale",
  "transaction_id": "UUID",
  "total_amount": 128.00,
  "products": [...],
  "low_stock_alerts": [
    {
      "product": "Tinta Keune 8.0",
      "quantity": 2,
      "min_quantity": 3
    }
  ],
  "message": "Venda registrada: R$ 128,00"
}
```

#### GET /api/sales (produtos)
Lista produtos com filtros.

**Query Params:**
- `unit_id`: Filtrar por unidade
- `is_retail`: 'true' ou 'false'
- `category`: Tinta, Shampoo, Tratamento, etc.
- `search`: Busca no nome
- `low_stock`: 'true' para alertas

---

### 3. Busca Inteligente por Apelidos
**Arquivo:** `src/app/api/search/route.ts`

#### GET /api/search?q=termo
Busca serviços por nome, descrição e keywords/apelidos.

**Estratégias de Busca (em ordem):**
1. **Busca Exata no Nome** (score +100)
2. **Keyword Exata** (score +80)
   - Cliente digita "tingir" → Encontra Coloração
3. **Keyword Parcial** (score +50)
   - "ting" → Encontra "tingir" nas keywords
4. **Descrição** (score +30)
5. **Full-Text Search** (PostgreSQL tsvector)

**Sugestões Inteligentes:**
- "brancos" → Sugere "coloração"
- "liso" → Sugere "progressiva"
- "clarear" → Sugere "luzes"

**Resposta:**
```json
{
  "services": [
    {
      "id": "UUID",
      "name": "Coloração 60GR",
      "keywords": ["tingir", "pintar", "cobrir brancos"],
      "relevance_score": 180
    }
  ],
  "search_term": "tingir",
  "suggestions": [
    {
      "term": "coloração",
      "reason": "Termo relacionado"
    }
  ],
  "stats": {
    "total_results": 5,
    "exact_matches": 0,
    "keyword_matches": 3
  }
}
```

**Exemplos de Keywords por Serviço:**
- Coloração: ["tingir", "pintar", "cobrir brancos", "fazer raiz"]
- Luzes: ["mechas", "californianas", "clarear", "descolorir"]
- Progressiva: ["alisar", "escovar", "liso", "frizz"]
- MegaHair: ["alongar", "aplique", "fibra", "fita"]

---

## 🎯 Funcionalidades Especiais

### 1. Bloqueio Duplo de Agenda (MegaHair)
**Problema:** MegaHair precisa de 2 profissionais ao mesmo tempo.

**Solução:**
1. Serviço marcado com `requires_double_booking = true`
2. Campo `required_professionals` com IDs de Julya e Dimas
3. API valida disponibilidade de ambos
4. Cria 1 único agendamento com `secondary_professional_id`
5. Ambos ficam "ocupados" naquele horário

### 2. Estoque Híbrido (Retail vs Backbar)
**Problema:** Produto vendido vs produto usado no lavatório.

**Solução:**
- Campo `is_retail` diferencia
- Venda Retail: Gera receita, cria transação
- Uso Interno: Baixa estoque sem receita (custo no serviço)
- Histórico completo em `inventory_logs`

**Caso de Uso:**
```
Profissional finaliza Coloração 60GR:
1. Sistema pergunta: "Houve consumo de produto interno?"
2. Profissional seleciona: "Tinta Keune 8.0" (2 tubos)
3. Sistema registra em inventory_logs:
   - movement_type: 'internal_use'
   - appointment_id: UUID do agendamento
   - quantity: -2
```

### 3. Sistema de Comissões Automático
**Cálculo:**
```javascript
base_amount = appointment.final_price || service.price
fees = payment_method === 'card' ? base_amount * 0.03 : 0
commission_amount = base_amount * (professional.commission_percentage / 100)
final_amount = commission_amount - fees
```

**Vales:**
- Profissional pede vale de R$500
- Admin aprova
- Na próxima comissão:
  - Comissão bruta: R$800
  - Vale descontado: -R$500
  - Líquido: R$300

### 4. Parcelamento Inteligente
**Regra:** Mínimo R$100/parcela

**Validação:**
```javascript
if (installments > 1) {
  const value_per_installment = total / installments;
  if (value_per_installment < 100) {
    return error("Valor mínimo de R$100,00 por parcela");
  }
}
```

**Exemplo:**
- Total: R$850
- Cliente quer 10x = R$85/parcela ❌ Inválido
- Máximo permitido: 8x = R$106,25/parcela ✅

---

## 📥 Guia de Implantação

### Passo 1: Executar Schema SQL
Acesse o SQL Editor no Supabase:
```
https://supabase.com/dashboard/project/blzargagmyjdihdkmcwg/sql
```

Cole e execute:
```sql
-- Conteúdo de database/dimas_schema.sql
```

### Passo 2: Criar Função RPC (Estoque)
Execute no SQL Editor:
```sql
CREATE OR REPLACE FUNCTION decrement_product_quantity(
  product_id UUID,
  quantity_to_remove DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET quantity = quantity - quantity_to_remove,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Passo 3: Criar Usuários no Auth
1. Acesse: Authentication → Users → Add User
2. Crie os 4 profissionais:
   - dimas@dimasdona.com.br
   - julya@dimasdona.com.br
   - hendril@dimasdona.com.br
   - amelia@dimasdona.com.br

3. Copie os UUIDs gerados

### Passo 4: Executar Seed
Edite `database/dimas_seed.sql`:
- Substitua 'UNIT_ID' pelo UUID da unidade
- Substitua 'UUID_DIMAS', 'UUID_JULYA', etc. pelos UUIDs reais
- Execute o SQL

### Passo 5: Substituir APIs
Renomeie os arquivos:
```bash
mv src/app/api/appointments/dimas-route.ts src/app/api/appointments/route.ts
# Faça backup do route.ts anterior se necessário
```

### Passo 6: Reiniciar Servidor
```bash
npm run dev
```

### Passo 7: Testar APIs
```bash
# Busca inteligente
curl "http://localhost:3000/api/search?q=tingir"

# Criar agendamento MegaHair
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "unit_id": "UUID",
    "professional_id": "UUID_JULYA",
    "service_id": "UUID_MEGAHAIR",
    "appointment_date": "2026-01-25",
    "start_time": "14:00",
    "client_name": "Cliente Teste",
    "client_phone": "(18) 99999-9999"
  }'

# Venda rápida
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "sale_type": "retail_sale",
    "unit_id": "UUID",
    "professional_id": "UUID_DIMAS",
    "products": [
      {"product_id": "UUID_PRODUTO", "quantity": 1}
    ],
    "payment_method": "pix"
  }'
```

---

## 🎯 Próximos Passos

### Fase 1: Interface (Semana 1-2)
1. ✅ Atualizar tema Tailwind (Clean Luxury) - **CONCLUÍDO**
2. ⏳ Criar Sidebar Desktop minimalista
3. ⏳ Criar Bottom Navigation Mobile
4. ⏳ Painel do Profissional:
   - Card "Próximo Cliente" (destaque VIP/Anamnese)
   - Botão "Venda Rápida"
   - Visualização de Comissões + Vales
5. ⏳ Dashboard Admin:
   - Monitoramento "Quem está atendendo"
   - Financeiro separado (Serviço vs Produto)
   - Alertas de estoque crítico

### Fase 2: Funcionalidades Avançadas (Semana 3-4)
6. ⏳ Componente de Busca Inteligente (com autocomplete)
7. ⏳ Modal de Uso Interno de Produtos (ao finalizar serviço)
8. ⏳ Sistema de Anamnese digital
9. ⏳ Relatórios financeiros
10. ⏳ Integração n8n (WhatsApp)

### Fase 3: PWA e Mobile (Semana 5+)
11. ⏳ Service Worker (offline)
12. ⏳ Push Notifications
13. ⏳ Instalação como app
14. ⏳ Otimizações de performance

---

## 📞 Suporte

**Documentação Completa:**
- Schema: `database/dimas_schema.sql`
- Seed: `database/dimas_seed.sql`
- APIs: `src/app/api/*/route.ts`

**Contato:**
- Email: suporte@otimizabeauty.com.br
- WhatsApp: (18) 99768-1052

---

## 🎉 Status Atual

### ✅ Implementado
- [x] Schema completo com 11 tabelas
- [x] Seed com dados reais do Dimas Dona Concept
- [x] API de agendamento com bloqueio duplo
- [x] API de vendas (retail + backbar)
- [x] API de busca inteligente
- [x] Tema Clean Luxury (Tailwind)
- [x] Gestão de estoque híbrido
- [x] Sistema de comissões
- [x] Vales de profissionais
- [x] Parcelamento com validação

### ⏳ Em Desenvolvimento
- [ ] Interface dos painéis
- [ ] Componentes de UX
- [ ] Testes automatizados

---

**Versão:** 2.0 (Clean Luxury Edition)  
**Data:** 19 de Janeiro de 2026  
**Cliente:** Dimas Dona Concept  
**Status:** ✅ Backend Completo | ⏳ Frontend em Progresso
