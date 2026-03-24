# 🤖 Guia de Integração — n8n + Otimiza Beauty

> Envie este documento para o n8n (como System Prompt de um AI Agent, ou como contexto de um nó "Set") para que ele saiba exatamente como interagir com o sistema.

---

## 📍 Base URL

```
https://<SEU-DOMINIO>.vercel.app
```
> Em desenvolvimento local: `http://localhost:3000`

---

## 🔐 Autenticação

Todas as rotas `/api/whatsapp/*` exigem o header:

```
x-api-key: <N8N_API_KEY>
```

A chave é definida no arquivo `.env.local` do projeto:
```
N8N_API_KEY=sua-chave-secreta-aqui
```

---

## 📡 Rotas Disponíveis para o n8n

---

### 1. `GET /api/whatsapp/horarios` — Listar Horários Livres

Retorna todos os slots disponíveis de um profissional em um dia.

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `profissional_id` | UUID | ✅ | ID do profissional |
| `data` | string | ✅ | Data no formato `YYYY-MM-DD` |
| `duracao` | integer | ❌ | Duração mínima em minutos (padrão: `30`) |

**Exemplo de chamada:**
```
GET /api/whatsapp/horarios?profissional_id=57f816ab-2a28-4cbc-bdb0-4b2b2f845f16&data=2026-03-20&duracao=60
x-api-key: minha-chave
```

**Resposta de sucesso (200):**
```json
{
  "profissional": {
    "id": "57f816ab-2a28-4cbc-bdb0-4b2b2f845f16",
    "nome": "Ana Paula"
  },
  "data": "20/03/2026",
  "data_iso": "2026-03-20",
  "total_livres": 4,
  "horarios_livres": [
    { "hora_inicio": "09:00", "hora_fim": "10:00" },
    { "hora_inicio": "10:00", "hora_fim": "11:00" },
    { "hora_inicio": "14:00", "hora_fim": "15:00" },
    { "hora_inicio": "16:00", "hora_fim": "17:00" }
  ],
  "mensagem_whatsapp": "*Horários disponíveis com Ana Paula em 20/03/2026:*\n\n1. 09:00 às 10:00\n2. 10:00 às 11:00\n3. 14:00 às 15:00\n4. 16:00 às 17:00\n\nQual horário prefere?"
}
```

**Respostas de erro:**

| Status | Motivo |
|--------|--------|
| 400 | `profissional_id` ou `data` ausentes / formato inválido |
| 401 | API Key inválida |
| 404 | Profissional não encontrado ou inativo |
| 500 | Erro interno |

---

### 2. `POST /api/whatsapp/agendar` — Criar Agendamento

Cria um novo agendamento. Se o cliente não existir, cria automaticamente pelo telefone.

**Body JSON:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `profissional_id` | UUID | ✅ | ID do profissional |
| `data` | string | ✅ | Data `YYYY-MM-DD` |
| `hora_inicio` | string | ✅ | Horário `HH:MM` |
| `cliente_nome` | string | ✅ | Nome do cliente |
| `cliente_telefone` | string | ❌ | Telefone (usado para buscar cliente existente) |
| `servico_id` | UUID | ❌ | ID do serviço (calcula duração automaticamente) |
| `cliente_id` | UUID | ❌ | ID do cliente (se já cadastrado) |

**Exemplo de chamada:**
```json
POST /api/whatsapp/agendar
x-api-key: minha-chave
Content-Type: application/json

{
  "profissional_id": "57f816ab-2a28-4cbc-bdb0-4b2b2f845f16",
  "data": "2026-03-20",
  "hora_inicio": "09:00",
  "cliente_nome": "Maria da Silva",
  "cliente_telefone": "11999887766",
  "servico_id": "abc123-..."
}
```

**Resposta de sucesso (200):**
```json
{
  "sucesso": true,
  "agendamento_id": "uuid-do-agendamento",
  "mensagem_whatsapp": "✅ *Agendamento confirmado!*\n\n👤 Cliente: Maria da Silva\n💇 Profissional: Ana Paula\n📅 Data: 20/03/2026\n🕐 Horário: 09:00 às 10:00\n\nTe esperamos! 😊"
}
```

**Resposta de conflito (409):**
```json
{
  "error": "Horário 09:00 já está ocupado com Ana Paula. Escolha outro horário."
}
```

---

### 3. `GET /api/appointments` — Listar Agendamentos (admin)

Retorna agendamentos com filtros opcionais.

**Query Parameters:** `date=YYYY-MM-DD`, `status=agendado|concluido|cancelado`

---

### 4. `GET /api/search` — Buscar Serviços

```
GET /api/search?q=corte&tipo=servico
```

Útil para o bot identificar o `servico_id` a partir do nome que o cliente mencionar.

**Resposta:**
```json
{
  "servicos": [
    { "id": "uuid", "nome": "Corte Feminino", "duracao_minutos": 60, "preco": 80 }
  ]
}
```

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

### Tabelas principais usadas nas rotas:

#### `profissionais`
```
id (UUID)         — identificador único
nome (text)       — nome do profissional
ativo (boolean)   — se está ativo
horarios_por_dia (jsonb) — horário por dia da semana
  Formato: { "1": {"inicio":"09:00","fim":"18:00"}, "2": {...} }
  Chaves: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
```

#### `agendamentos`
```
id (UUID)
profissional_id (UUID)  → profissionais.id
cliente_id (UUID)       → clientes.id
cliente_nome (text)     — nome salvo diretamente
data_agendamento (date) — formato YYYY-MM-DD
hora_inicio (time)      — HH:MM:SS
hora_fim (time)         — HH:MM:SS
status (text)           — agendado | concluido | cancelado
observacoes (text)
```

#### `clientes`
```
id (UUID)
nome (text)
telefone (text)   — usado para evitar duplicar clientes
email (text)
ativo (boolean)
```

#### `servicos`
```
id (UUID)
nome (text)
duracao_minutos (integer)
preco (numeric)
ativo (boolean)
```

---

## ⚙️ Funções SQL no Banco

### `fn_horarios_vagos(profissional_id, data, duracao_minutos)`
Retorna tabela de slots de 30 min com `livre = true/false`.

### `verificar_conflito_horario_v2(profissional_id, data, hora_inicio, hora_fim)`
Retorna `true` se há conflito, `false` se horário está livre.

### Views:
- `vw_blocos_ocupados` — todos os blocos ocupados por profissional
- `vw_etapas_agendadas` — etapas de serviço com horários calculados

---

## 🔄 Fluxo Recomendado no n8n (WhatsApp Bot)

```
[Trigger: WhatsApp recebe mensagem]
        ↓
[AI Node: identifica intenção]
  → "quero agendar" → Fluxo de Agendamento
  → "quais horários" → Fluxo de Consulta
  → outro → resposta padrão
        ↓
[Fluxo de Consulta]
  1. Perguntar: "Com qual profissional?"
  2. Buscar UUID: GET /api/appointments?... ou lista fixa
  3. Perguntar: "Para qual data?"
  4. GET /api/whatsapp/horarios?profissional_id=X&data=Y
  5. Enviar campo "mensagem_whatsapp" da resposta
        ↓
[Fluxo de Agendamento]
  1. Perguntar: data, profissional, serviço, nome do cliente
  2. POST /api/whatsapp/agendar com os dados
  3. Enviar campo "mensagem_whatsapp" da resposta
```

---

## 📋 Como obter os IDs dos profissionais

Execute no Supabase SQL Editor:
```sql
SELECT id, nome FROM profissionais WHERE ativo = true ORDER BY nome;
```

Cole os resultados no n8n como lista fixa, ou crie uma rota adicional `GET /api/whatsapp/profissionais` se quiser dinâmico.

---

## 🔗 Integração Direta n8n ↔ Supabase (alternativa avançada)

O n8n tem um **node nativo do Supabase** (Supabase Node). Com ele, o bot pode:

1. Chamar `fn_horarios_vagos` diretamente via node **Supabase → RPC**
2. Inserir em `agendamentos` via node **Supabase → Insert Row**
3. Buscar `profissionais` via node **Supabase → Get Many Rows**

**Credenciais necessárias:**
- **Supabase URL:** `https://<seu-projeto>.supabase.co`
- **Supabase Anon Key:** encontrada em Settings → API no painel Supabase

Esta abordagem elimina a necessidade das rotas `/api/whatsapp/*` e permite ao n8n interagir diretamente com o banco.

---

## 💬 Comunicação Direta n8n ↔ Copilot (GitHub Copilot)

Não existe integração nativa entre n8n e GitHub Copilot. As opções são:

### Opção A — n8n com OpenAI / Claude (mais prático)
Configure um **AI Agent node** no n8n com:
- **System Prompt:** cole o conteúdo deste documento
- **Model:** GPT-4o ou Claude 3.5 Sonnet
- **Tools:** HTTP Request nodes apontando para as rotas acima

### Opção B — Webhook bidirecional
1. n8n expõe um **Webhook** que recebe perguntas
2. Copilot (ou você) chama esse webhook com contexto
3. n8n responde via HTTP

### Opção C — Supabase como "memória compartilhada"
- Crie uma tabela `bot_contexto` no Supabase
- n8n lê/escreve nessa tabela
- O código do sistema também lê/escreve
- Funciona como canal de comunicação assíncrona

---

## ✅ Checklist para colocar o bot em produção

- [ ] Definir `N8N_API_KEY` no `.env.local` e nas variáveis de ambiente da Vercel
- [ ] Deploy do projeto na Vercel (ou servidor com domínio público)
- [ ] Configurar WhatsApp Business API (Evolution API, Z-API, ou Twilio)
- [ ] Criar fluxo no n8n com os nodes:
  - Trigger (WhatsApp)
  - AI Agent (com este documento como system prompt)
  - HTTP Request → `/api/whatsapp/horarios`
  - HTTP Request → `/api/whatsapp/agendar`
- [ ] Testar com número real
- [ ] Popular `horarios_por_dia` nos profissionais cadastrados (via tela de profissionais)
