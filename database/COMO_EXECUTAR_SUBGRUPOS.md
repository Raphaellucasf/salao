# Como Adicionar Subgrupos aos Grupos de Serviços

## Problema
Os subgrupos não estão aparecendo no modal de edição porque precisam ser adicionados ao banco de dados.

## Estrutura
- **GRUPOS** (7 categorias principais): TRATAMENTOS E TERAPIAS, CABELO, APLICAÇAO PROCEDIMENTO, etc.
- **SUBGRUPOS** (subcategorias dentro dos grupos): Química, Hidratação, etc.
- **SERVIÇOS** (itens individuais): COLORACAO 10GR, ESCOVA CURTA, etc.

## Passo a Passo

### 1. Executar Script de Verificação

Vá ao Supabase SQL Editor e execute o arquivo:
```
database/verificar_e_atualizar_subgrupos.sql
```

Este script vai:
- ✅ Adicionar a coluna `subgrupos` na tabela `grupos_servicos`
- ✅ Criar índice para buscas eficientes
- ✅ Adicionar os subgrupos "Química" e "Hidratação" ao grupo TRATAMENTOS E TERAPIAS
- ✅ Mostrar os resultados

### 2. Verificar no Banco

Execute esta query para confirmar:
```sql
SELECT nome, subgrupos 
FROM grupos_servicos 
WHERE nome = 'TRATAMENTOS E TERAPIAS';
```

Deve retornar:
```
nome: TRATAMENTOS E TERAPIAS
subgrupos: ["Química", "Hidratação"]
```

### 3. Testar na Interface

1. Recarregue a página do sistema (F5)
2. Vá em **Serviços** > Aba **Grupos**
3. Clique em **Editar** no grupo "TRATAMENTOS E TERAPIAS"
4. Os subgrupos "Química" e "Hidratação" devem aparecer na seção "Subgrupos Atuais"

### 4. Adicionar Mais Subgrupos

Você pode adicionar subgrupos para outros grupos:

**Pelo SQL:**
```sql
-- Exemplo: adicionar subgrupos ao grupo CABELO
UPDATE grupos_servicos 
SET subgrupos = '["Corte Feminino", "Corte Masculino", "Escova", "Penteado"]'::jsonb
WHERE nome = 'CABELO';

-- Exemplo: adicionar subgrupos ao grupo ESTÉTICA
UPDATE grupos_servicos 
SET subgrupos = '["Depilação", "Design de Sobrancelhas"]'::jsonb
WHERE nome = 'ESTÉTICA';
```

**Pela Interface:**
1. Edite o grupo desejado
2. Digite o nome do subgrupo no campo "Adicionar Subgrupo"
3. Clique no botão **+** ou pressione Enter
4. Clique em **Atualizar Grupo**

## Importante

⚠️ **Não confunda:**
- **Categoria** (campo `categoria` na tabela `servicos`) = usado para organizar serviços dentro de um grupo
- **Subgrupos** (campo `subgrupos` na tabela `grupos_servicos`) = lista de opções para categorizar serviços

Exemplo:
- **Grupo**: TRATAMENTOS E TERAPIAS
- **Subgrupos disponíveis**: ["Química", "Hidratação"]
- **Serviços**:
  - COLORACAO 10GR → categoria = "Química"
  - HIDRATAÇÃO SEM ESCOVA → categoria = "Hidratação"

## Próximos Passos

Depois de adicionar os subgrupos aos grupos, você pode:

1. **Na criação de serviços**: Selecionar o subgrupo/categoria do serviço
2. **Nos relatórios**: Filtrar serviços por grupo e subgrupo
3. **Na agenda**: Organizar melhor os profissionais por suas especialidades
