# 🔌 Guia de Uso da API - Otimiza Beauty Manager

Documentação completa dos endpoints da API com exemplos práticos.

---

## 📍 Base URL

**Desenvolvimento:** `http://localhost:3000/api`  
**Produção:** `https://seu-dominio.com/api`

---

## 📅 Endpoints de Agendamentos

### 1. Listar Agendamentos

**GET** `/api/appointments`

**Query Parameters:**
- `unit_id` (opcional) - UUID da unidade
- `status` (opcional) - `pending`, `confirmed`, `completed`, `cancelled`, `no_show`
- `date` (opcional) - Data no formato `YYYY-MM-DD`

**Exemplo de Requisição:**
```bash
curl -X GET "http://localhost:3000/api/appointments?unit_id=123&status=confirmed&date=2026-01-20"
```

**Resposta de Sucesso (200):**
```json
{
  "appointments": [
    {
      "id": "uuid-1",
      "unit_id": "uuid-unit",
      "client_id": "uuid-client",
      "professional_id": "uuid-prof",
      "service_id": "uuid-service",
      "appointment_date": "2026-01-20",
      "start_time": "14:00",
      "end_time": "15:00",
      "status": "confirmed",
      "notes": null,
      "client_name": "Maria Silva",
      "client_phone": "(11) 98765-4321",
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z",
      "professional": {
        "id": "uuid-prof",
        "user_id": "uuid-user",
        "bio": "Especialista em coloração",
        "rating": 4.9
      },
      "service": {
        "id": "uuid-service",
        "name": "Corte Feminino",
        "price": 80.00,
        "duration_minutes": 60
      },
      "client": {
        "id": "uuid-client",
        "full_name": "Maria Silva",
        "email": "maria@email.com"
      }
    }
  ]
}
```

---

### 2. Criar Agendamento

**POST** `/api/appointments`

**Body (JSON):**
```json
{
  "unit_id": "uuid-da-unidade",
  "professional_id": "uuid-do-profissional",
  "service_id": "uuid-do-servico",
  "appointment_date": "2026-01-25",
  "start_time": "14:00",
  "client_name": "João Santos",
  "client_phone": "(11) 91234-5678",
  "notes": "Primeira vez no salão"
}
```

**Exemplo de Requisição:**
```bash
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "unit_id": "abc-123",
    "professional_id": "def-456",
    "service_id": "ghi-789",
    "appointment_date": "2026-01-25",
    "start_time": "14:00",
    "client_name": "João Santos",
    "client_phone": "(11) 91234-5678"
  }'
```

**Resposta de Sucesso (201):**
```json
{
  "appointment": {
    "id": "novo-uuid",
    "unit_id": "abc-123",
    "professional_id": "def-456",
    "service_id": "ghi-789",
    "appointment_date": "2026-01-25",
    "start_time": "14:00",
    "end_time": "15:00",
    "status": "pending",
    "client_name": "João Santos",
    "client_phone": "(11) 91234-5678",
    "created_at": "2026-01-16T15:45:00Z"
  }
}
```

**Erros Possíveis:**
- `400` - Campos obrigatórios faltando
- `404` - Serviço não encontrado
- `409` - Horário indisponível (conflito)

---

### 3. Verificar Disponibilidade

**GET** `/api/appointments/availability`

**Query Parameters:**
- `professional_id` (obrigatório) - UUID do profissional
- `date` (obrigatório) - Data no formato `YYYY-MM-DD`
- `service_id` (obrigatório) - UUID do serviço

**Exemplo de Requisição:**
```bash
curl -X GET "http://localhost:3000/api/appointments/availability?professional_id=prof-123&date=2026-01-25&service_id=serv-456"
```

**Resposta de Sucesso (200):**
```json
{
  "available_slots": [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30"
  ]
}
```

**Lógica de Disponibilidade:**
- ✅ Considera duração do serviço
- ✅ Exclui horários já agendados
- ✅ Exclui horários bloqueados pelo profissional
- ✅ Respeita horário de funcionamento (9h-18h)

---

### 4. Fechar Agendamento (Finalizar e Calcular Comissão)

**POST** `/api/appointments/close`

**Body (JSON):**
```json
{
  "appointment_id": "uuid-do-agendamento",
  "payment_method": "card"
}
```

**Métodos de Pagamento Aceitos:**
- `cash` - Dinheiro
- `card` - Cartão
- `pix` - PIX
- `other` - Outro

**Exemplo de Requisição:**
```bash
curl -X POST http://localhost:3000/api/appointments/close \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": "apt-123",
    "payment_method": "pix"
  }'
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Agendamento finalizado e comissões calculadas com sucesso",
  "data": {
    "appointment_id": "apt-123",
    "service_price": 120.00,
    "commission_percentage": 50.00,
    "commission_amount": 60.00,
    "salon_amount": 60.00,
    "income_transaction": {
      "id": "trans-income-123",
      "type": "income",
      "amount": 120.00,
      "description": "Serviço: Hidratação - Cliente: Ana Costa"
    },
    "commission_transaction": {
      "id": "trans-comm-456",
      "type": "commission",
      "amount": 60.00,
      "description": "Comissão 50% - Hidratação",
      "professional_id": "prof-789"
    }
  }
}
```

**Processo Automático:**
1. ✅ Atualiza status do agendamento para `completed`
2. ✅ Cria transação de entrada (receita total)
3. ✅ Calcula e cria transação de comissão do profissional
4. ✅ Saldo do salão = receita - comissão

---

## 💰 Endpoints Financeiros

### 5. Listar Transações

**GET** `/api/transactions`

**Query Parameters:**
- `unit_id` (opcional) - UUID da unidade
- `type` (opcional) - `income`, `expense`, `commission`
- `start_date` (opcional) - Data inicial `YYYY-MM-DD`
- `end_date` (opcional) - Data final `YYYY-MM-DD`

**Exemplo de Requisição:**
```bash
curl -X GET "http://localhost:3000/api/transactions?unit_id=unit-123&type=income&start_date=2026-01-01&end_date=2026-01-31"
```

**Resposta de Sucesso (200):**
```json
{
  "transactions": [
    {
      "id": "trans-1",
      "unit_id": "unit-123",
      "appointment_id": "apt-456",
      "professional_id": null,
      "type": "income",
      "amount": 80.00,
      "description": "Serviço: Corte Feminino - Cliente: Maria Silva",
      "payment_method": "card",
      "transaction_date": "2026-01-16T14:30:00Z",
      "created_at": "2026-01-16T14:30:00Z"
    },
    {
      "id": "trans-2",
      "unit_id": "unit-123",
      "appointment_id": "apt-456",
      "professional_id": "prof-789",
      "type": "commission",
      "amount": 40.00,
      "description": "Comissão 50% - Corte Feminino",
      "payment_method": "card",
      "transaction_date": "2026-01-16T14:30:00Z",
      "created_at": "2026-01-16T14:30:00Z"
    }
  ]
}
```

---

### 6. Criar Transação Manual

**POST** `/api/transactions`

**Body (JSON):**
```json
{
  "unit_id": "uuid-unidade",
  "type": "expense",
  "amount": 150.00,
  "description": "Compra de produtos - shampoo e condicionador",
  "payment_method": "cash"
}
```

**Tipos de Transação:**
- `income` - Receita (entrada de dinheiro)
- `expense` - Despesa (saída de dinheiro)
- `commission` - Comissão de profissional

**Exemplo de Requisição:**
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "unit_id": "unit-123",
    "type": "expense",
    "amount": 150.00,
    "description": "Compra de produtos",
    "payment_method": "cash"
  }'
```

**Resposta de Sucesso (201):**
```json
{
  "transaction": {
    "id": "trans-new",
    "unit_id": "unit-123",
    "type": "expense",
    "amount": 150.00,
    "description": "Compra de produtos",
    "payment_method": "cash",
    "transaction_date": "2026-01-16T16:00:00Z",
    "created_at": "2026-01-16T16:00:00Z"
  }
}
```

---

## 🔔 Webhook para n8n

### Payload Enviado Automaticamente

Quando um novo agendamento é criado, o sistema envia automaticamente um webhook para o n8n (se configurado).

**URL:** Definida em `N8N_WEBHOOK_URL` no `.env.local`

**Método:** POST

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "type": "appointment.created",
  "data": {
    "appointment_id": "uuid-123",
    "client_name": "Maria Silva",
    "client_phone": "(11) 98765-4321",
    "appointment_date": "2026-01-25",
    "start_time": "14:00",
    "service_id": "uuid-service"
  }
}
```

**Eventos Disponíveis:**
- `appointment.created` - Novo agendamento criado
- `appointment.confirmed` - Agendamento confirmado
- `appointment.completed` - Agendamento finalizado
- `appointment.cancelled` - Agendamento cancelado

---

## 🧪 Testando a API

### Usando cURL

```bash
# Listar agendamentos de hoje
curl "http://localhost:3000/api/appointments?date=2026-01-16"

# Criar novo agendamento
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"unit_id":"1","professional_id":"1","service_id":"1","appointment_date":"2026-01-20","start_time":"15:00","client_name":"Teste","client_phone":"11999999999"}'
```

### Usando Postman

1. Importe a coleção (criar arquivo `postman_collection.json`)
2. Configure variável de ambiente `base_url` = `http://localhost:3000`
3. Execute requests

### Usando Código JavaScript

```javascript
// Exemplo: Criar agendamento
const response = await fetch('http://localhost:3000/api/appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    unit_id: 'abc-123',
    professional_id: 'def-456',
    service_id: 'ghi-789',
    appointment_date: '2026-01-25',
    start_time: '14:00',
    client_name: 'João Santos',
    client_phone: '(11) 91234-5678',
  }),
});

const data = await response.json();
console.log(data);
```

---

## 🔒 Autenticação (A Implementar)

**Próximo Passo:** Adicionar autenticação Supabase para proteger endpoints.

**Exemplo de Header:**
```
Authorization: Bearer seu_token_supabase_aqui
```

**Endpoints que precisarão de autenticação:**
- ✅ POST `/api/appointments/close` - Apenas admin/profissional
- ✅ POST `/api/transactions` - Apenas admin
- ✅ GET `/api/transactions` - Apenas admin/profissional

---

## 📊 Códigos de Status HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Requisição bem-sucedida (GET) |
| 201 | Created | Recurso criado com sucesso (POST) |
| 400 | Bad Request | Dados inválidos ou campos faltando |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: horário indisponível) |
| 500 | Internal Server Error | Erro no servidor |

---

**Documentação completa e pronta para uso! 🚀**
