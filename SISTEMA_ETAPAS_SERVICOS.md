# 🎯 SISTEMA DE ETAPAS NOS SERVIÇOS

## 📋 Visão Geral

Sistema que permite dividir serviços complexos em etapas menores, com:
- ⏱️ Duração individualizada por etapa
- 👥 Atribuição de profissionais/auxiliares diferentes por etapa
- 💰 Comissões personalizadas por etapa
- 📊 Visualização detalhada na agenda

---

## 🏗️ Estrutura do Sistema

### 1. Banco de Dados

#### Nova Tabela: `servico_etapas`

```sql
CREATE TABLE servico_etapas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  duracao_minutos INTEGER NOT NULL DEFAULT 30,
  comissao_percentual DECIMAL(5,2) DEFAULT 50.00,
  comissao_valor DECIMAL(10,2),
  pode_ter_auxiliar BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_servico_etapa_ordem UNIQUE(servico_id, ordem)
);

CREATE INDEX idx_servico_etapas_servico ON servico_etapas(servico_id);
```

#### Atualizar Tabela: `servicos`

```sql
ALTER TABLE servicos 
ADD COLUMN tem_etapas BOOLEAN DEFAULT false,
ADD COLUMN duracao_calculada BOOLEAN DEFAULT false;

COMMENT ON COLUMN servicos.tem_etapas IS 'Se true, duração vem da soma das etapas';
COMMENT ON COLUMN servicos.duracao_calculada IS 'Se true, duracao_minutos é calculado automaticamente';
```

#### Nova Tabela: `comanda_item_etapas`

```sql
CREATE TABLE comanda_item_etapas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comanda_item_id BIGINT NOT NULL REFERENCES comanda_itens(id) ON DELETE CASCADE,
  servico_etapa_id UUID NOT NULL REFERENCES servico_etapas(id),
  ordem INTEGER NOT NULL,
  nome VARCHAR(100) NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  profissional_id UUID REFERENCES profissionais(id),
  auxiliar_id UUID REFERENCES profissionais(id),
  comissao_percentual DECIMAL(5,2),
  comissao_valor DECIMAL(10,2),
  valor_item DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pendente', -- pendente, em_andamento, concluida
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_comanda_item_etapa_ordem UNIQUE(comanda_item_id, ordem)
);

CREATE INDEX idx_comanda_item_etapas_item ON comanda_item_etapas(comanda_item_id);
CREATE INDEX idx_comanda_item_etapas_profissional ON comanda_item_etapas(profissional_id);
CREATE INDEX idx_comanda_item_etapas_auxiliar ON comanda_item_etapas(auxiliar_id);
```

---

### 2. Exemplo Prático

#### Serviço: MEGA HAIR

**Duração Total:** 180 minutos

| Etapa | Nome | Duração | Profissional | Comissão |
|-------|------|---------|-------------|----------|
| 1 | Lavagem | 15 min | Auxiliar | R$ 10,00 fixo |
| 2 | Aplicação | 120 min | Profissional Principal | 60% do valor |
| 3 | Secagem e Finalização | 45 min | Auxiliar ou Profissional | 30% restante |

**Valor Total:** R$ 800,00

**Distribuição:**
- Lavagem (Auxiliar): R$ 10,00
- Aplicação (Profissional): R$ 480,00 (60% de R$ 800)
- Finalização (Auxiliar): R$ 240,00 (30% de R$ 800)
- Salão: R$ 70,00 (diferença)

---

### 3. Interface - Modal de Serviço

#### Componente: `ServicoModal.tsx`

**Novo Toggle:**
```tsx
<div className="flex items-center">
  <input
    type="checkbox"
    id="tem_etapas"
    checked={temEtapas}
    onChange={(e) => setTemEtapas(e.target.checked)}
  />
  <label>Este serviço possui etapas</label>
</div>
```

**Seção de Etapas (se `temEtapas === true`):**

```tsx
{temEtapas && (
  <div className="border-t pt-4 mt-4">
    <h3 className="font-semibold mb-3">Etapas do Serviço</h3>
    
    <div className="space-y-3">
      {etapas.map((etapa, index) => (
        <div key={index} className="p-3 border rounded-lg">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-1">
              <span className="font-bold">#{index + 1}</span>
            </div>
            <div className="col-span-5">
              <Input
                placeholder="Nome da etapa"
                value={etapa.nome}
                onChange={(e) => updateEtapa(index, 'nome', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                placeholder="Min"
                value={etapa.duracao_minutos}
                onChange={(e) => updateEtapa(index, 'duracao_minutos', e.target.value)}
              />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                placeholder="Comissão %"
                value={etapa.comissao_percentual}
                onChange={(e) => updateEtapa(index, 'comissao_percentual', e.target.value)}
              />
            </div>
            <div className="col-span-1">
              <Button onClick={() => removerEtapa(index)}>
                <Trash2 />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
    
    <Button onClick={adicionarEtapa}>
      <Plus /> Adicionar Etapa
    </Button>
    
    <div className="mt-3 p-3 bg-blue-50 rounded">
      <p className="text-sm">
        <strong>Duração Total:</strong> {calcularDuracaoTotal()} minutos
      </p>
    </div>
  </div>
)}
```

---

### 4. Interface - Modal de Comanda

#### Componente: `ComandaModal.tsx`

**Ao selecionar um serviço com etapas:**

```tsx
{itemSelecionado.tem_etapas && (
  <div className="mt-4 border-t pt-4">
    <h4 className="font-semibold mb-2">Atribuir Profissionais às Etapas</h4>
    
    <div className="space-y-2">
      {itemSelecionado.etapas.map((etapa, index) => (
        <div key={index} className="flex items-center gap-2 p-2 bg-neutral-50 rounded">
          <span className="font-medium w-32">{etapa.nome}</span>
          <span className="text-sm text-neutral-600 w-20">{etapa.duracao_minutos}min</span>
          
          <select
            value={etapasAtribuicoes[index]?.profissional_id || ''}
            onChange={(e) => atribuirProfissionalEtapa(index, e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
          >
            <option value="">Selecione profissional/auxiliar</option>
            {profissionais.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
          
          <span className="text-sm font-medium w-20">
            {etapa.comissao_percentual}%
          </span>
        </div>
      ))}
    </div>
  </div>
)}
```

---

### 5. Interface - Agenda

#### Visualização de Etapas na Timeline

```tsx
// Cada agendamento com etapas mostra barras empilhadas

<div className="agendamento" style={{ backgroundColor: grupoCor }}>
  <div className="etapas-stack">
    {agendamento.etapas.map((etapa, idx) => (
      <div 
        key={idx}
        className="etapa-bar"
        style={{
          height: `${(etapa.duracao / agendamento.duracao_total) * 100}%`,
          borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.3)' : 'none'
        }}
      >
        <span className="etapa-info">
          {etapa.nome} - {etapa.profissional_nome || etapa.auxiliar_nome}
        </span>
      </div>
    ))}
  </div>
</div>
```

---

### 6. ComandaViewDrawer - Detalhes Expandidos

#### Mostrar Etapas no Drawer

```tsx
{item.etapas && item.etapas.length > 0 && (
  <div className="ml-6 mt-2 space-y-1">
    {item.etapas.map((etapa, idx) => (
      <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-600">
            {idx + 1}. {etapa.nome}
          </span>
          <span className="text-neutral-500">({etapa.duracao_minutos}min)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-600">
            {etapa.profissional_nome || etapa.auxiliar_nome || 'Não atribuído'}
          </span>
          <span className="font-medium text-neutral-700">
            {etapa.comissao_percentual}%
          </span>
        </div>
      </div>
    ))}
  </div>
)}
```

---

## 🎨 Visual da Agenda (Imagem 3)

```
┌─────────────────────────────────────────┐
│ Bianca Magalhães Feliciano Lima         │
│ ┌─────────────────────────────────────┐ │
│ │ MEGA HAIR LOIRO (180min) R$ 800,00  │ │
│ ├─────────────────────────────────────┤ │
│ │ 1. Lavagem (15min) - Ana Paula      │ │
│ │ 2. Aplicação (120min) - Joelma      │ │
│ │ 3. Finalização (45min) - Ana Paula  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📊 Funções SQL Necessárias

### Calcular Duração Total do Serviço

```sql
CREATE OR REPLACE FUNCTION calcular_duracao_servico(p_servico_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_duracao INTEGER;
BEGIN
  SELECT COALESCE(SUM(duracao_minutos), 0)
  INTO v_duracao
  FROM servico_etapas
  WHERE servico_id = p_servico_id;
  
  RETURN v_duracao;
END;
$$ LANGUAGE plpgsql;
```

### Trigger para Atualizar Duração

```sql
CREATE OR REPLACE FUNCTION trigger_atualizar_duracao_servico()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE servicos
  SET 
    duracao_minutos = calcular_duracao_servico(NEW.servico_id),
    updated_at = NOW()
  WHERE id = NEW.servico_id
    AND duracao_calculada = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_etapa_atualizar_duracao
AFTER INSERT OR UPDATE OR DELETE ON servico_etapas
FOR EACH ROW
EXECUTE FUNCTION trigger_atualizar_duracao_servico();
```

---

## ✅ Checklist de Implementação

### Banco de Dados
- [ ] Criar tabela `servico_etapas`
- [ ] Alterar tabela `servicos` (adicionar `tem_etapas`, `duracao_calculada`)
- [ ] Criar tabela `comanda_item_etapas`
- [ ] Criar função `calcular_duracao_servico()`
- [ ] Criar trigger para atualizar duração
- [ ] Criar view `vw_servicos_completos` (incluindo etapas)
- [ ] Criar view `vw_comanda_itens_completos` (incluindo etapas)

### Backend/Serviços
- [ ] Criar queries para CRUD de etapas
- [ ] Atualizar lógica de cálculo de comissões
- [ ] Atualizar criação de agendamentos (incluir etapas)

### Frontend - ServicoModal
- [ ] Adicionar toggle "Possui etapas"
- [ ] Criar componente de lista de etapas
- [ ] Implementar adicionar/remover etapas
- [ ] Calcular e mostrar duração total
- [ ] Salvar etapas ao salvar serviço

### Frontend - ComandaModal
- [ ] Detectar se serviço tem etapas
- [ ] Mostrar lista de etapas para atribuição
- [ ] Permitir selecionar profissional/auxiliar por etapa
- [ ] Mostrar preview de comissões por etapa
- [ ] Salvar atribuições ao criar comanda

### Frontend - Agenda
- [ ] Carregar etapas dos agendamentos
- [ ] Renderizar barras empilhadas para etapas
- [ ] Mostrar tooltip com detalhes da etapa ao hover
- [ ] Colorir etapas diferentemente (opacidade ou gradiente)

### Frontend - ComandaViewDrawer
- [ ] Expandir visualização de itens com etapas
- [ ] Mostrar cada etapa com profissional atribuído
- [ ] Mostrar duração e comissão por etapa
- [ ] Adicionar indicador visual de progresso das etapas

---

## 🚀 Ordem de Implementação

### Fase 1: Base de Dados (1-2 dias)
1. Criar todas as tabelas
2. Criar funções e triggers
3. Criar views
4. Testar com dados de exemplo

### Fase 2: CRUD de Etapas (2-3 dias)
1. Atualizar ServicoModal
2. Implementar adicionar/editar/remover etapas
3. Testar salvamento

### Fase 3: Atribuição na Comanda (2-3 dias)
1. Atualizar ComandaModal
2. Implementar atribuição de profissionais
3. Implementar cálculo de comissões
4. Testar criação de comandas com etapas

### Fase 4: Visualização na Agenda (3-4 dias)
1. Carregar etapas nos agendamentos
2. Implementar renderização empilhada
3. Adicionar interatividade (hover, click)
4. Testar responsividade

### Fase 5: Detalhamento no Drawer (1-2 dias)
1. Expandir ComandaViewDrawer
2. Mostrar todas as etapas
3. Adicionar informações de profissionais
4. Testar usabilidade

### Fase 6: Testes e Ajustes (2-3 dias)
1. Testar fluxo completo
2. Ajustar UX/UI
3. Otimizar queries
4. Documentar

**TOTAL ESTIMADO:** 11-17 dias de desenvolvimento

---

## 💡 Considerações Importantes

### Performance
- Usar eager loading para carregar etapas
- Indexar corretamente foreign keys
- Cachear cálculos de duração quando possível

### UX/UI
- Drag & drop para reordenar etapas
- Validação de soma de comissões (não pode ultrapassar 100%)
- Preview visual das etapas na agenda
- Cores diferenciadas por profissional

### Regras de Negócio
- Permitir editar etapas apenas se serviço não tem comandas ativas
- Ao editar serviço com etapas, atualizar comandas futuras
- Validar se profissionais selecionados estão disponíveis no horário

---

## 📝 Notas Adicionais

- Sistema é retrocompatível: serviços sem etapas continuam funcionando normalmente
- Serviços podem ser convertidos para ter etapas (e vice-versa)
- Etapas podem ter valores fixos OU percentuais de comissão
- Na agenda, etapas são empilhadas verticalmente dentro do mesmo card
