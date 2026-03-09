# Como Corrigir os Dropdowns de Profissionais e Auxiliares

## Problema
Os profissionais e auxiliares não aparecem nos dropdowns ao editar uma comanda.

## Causa
O campo `é_auxiliar` não existe na tabela `profissionais` no banco de dados.

## Solução

### Opção 1: Pelo Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo do arquivo `FIX_PROFISSIONAIS_DROPDOWN.sql`
6. Clique em **Run** (ou Ctrl+Enter)
7. Aguarde a confirmação de sucesso

### Opção 2: Verificação Rápida

Depois de executar a migração, você pode verificar se funcionou:

```sql
SELECT id, nome, é_auxiliar, ativo 
FROM profissionais 
WHERE ativo = true;
```

## Próximos Passos

Após executar o script SQL:

1. **Recarregue a página** da aplicação (F5)
2. Tente abrir o modal de edição de comanda novamente
3. Os dropdowns devem agora mostrar os profissionais cadastrados

## Definir Profissionais como Auxiliares

Se você quiser marcar profissionais específicos como auxiliares:

```sql
-- Exemplo: Marcar profissional específico como auxiliar
UPDATE profissionais 
SET é_auxiliar = true 
WHERE nome = 'Nome do Profissional';

-- Ou marcar vários de uma vez
UPDATE profissionais 
SET é_auxiliar = true 
WHERE nome IN ('Maria Silva', 'João Santos', 'Ana Costa');
```

## Observações

- Profissionais marcados com `é_auxiliar = true` aparecerão em **ambos** os dropdowns
- Profissionais com `é_auxiliar = false` aparecerão apenas no dropdown de "Profissional Responsável"
- Apenas profissionais com `ativo = true` aparecem nos dropdowns
