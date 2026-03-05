# 📚 Guia de Subgrupos de Serviços

## 🎯 O que são Subgrupos?

Subgrupos (ou categorias) permitem organizar serviços dentro de um grupo principal de forma mais granular.

### Exemplo Prático:

**Grupo Principal: TRATAMENTOS E TERAPIAS**
- 🧪 Subgrupo: Química
  - Coloração 10gr
  - Progressiva
  - Luzes
- 💧 Subgrupo: Hidratação
  - Hidratação Wella
  - Velaterapia
  - Tratamento Anti-Quebra

## ✨ Como Criar Subgrupos

### 1. Via Interface (Recomendado)

1. Acesse **Admin → Serviços**
2. Clique no ícone de **Editar** (lápis) em um grupo
3. Na seção **"Subgrupos/Categorias"**:
   - Digite o nome do subgrupo (ex: "Química")
   - Clique no botão **+** ou pressione **Enter**
   - Repita para adicionar mais subgrupos
4. Para remover um subgrupo, clique no **X** ao lado dele
5. Clique em **"Atualizar Grupo"**

### 2. Via SQL (Avançado)

```sql
-- Adicionar subgrupos a um grupo existente
UPDATE grupos_servicos 
SET subgrupos = '["Química", "Hidratação", "Outro"]'::jsonb
WHERE nome = 'TRATAMENTOS E TERAPIAS';
```

## 🔧 Como Usar Subgrupos nos Serviços

Ao criar ou editar um serviço:

1. Selecione o **Grupo Principal** (ex: TRATAMENTOS E TERAPIAS)
2. No campo **Categoria/Subgrupo**, selecione ou digite o subgrupo (ex: "Química")
3. O serviço ficará organizado dentro desse subgrupo

## 📊 Benefícios dos Subgrupos

✅ **Organização**: Separe serviços similares dentro de um mesmo grupo  
✅ **Busca**: Filtre serviços por categoria específica  
✅ **Relatórios**: Veja dados separados por subgrupo  
✅ **Flexibilidade**: Adicione ou remova subgrupos conforme necessário

## 💡 Exemplos de Uso

### Grupo: CABELO
Subgrupos sugeridos:
- Cortes
- Escovas
- Tratamentos

### Grupo: ESTÉTICA
Subgrupos sugeridos:
- Depilação
- Design de Sobrancelhas
- Procedimentos Faciais

### Grupo: TRATAMENTOS E TERAPIAS
Subgrupos já configurados:
- Química
- Hidratação

## ❓ Perguntas Frequentes

**P: Um grupo precisa ter subgrupos?**  
R: Não! Subgrupos são opcionais. Você pode deixar vazio se não precisar.

**P: Posso alterar os subgrupos de um grupo existente?**  
R: Sim! Basta editar o grupo e adicionar/remover subgrupos.

**P: O que acontece com os serviços se eu remover um subgrupo?**  
R: Os serviços continuarão associados ao grupo principal, apenas o subgrupo será removido da organização.

**P: Quantos subgrupos posso adicionar?**  
R: Não há limite técnico, mas recomendamos até 5 subgrupos por grupo para manter a organização clara.

## 🚀 Próximos Passos

1. Execute o script SQL `atualizar_servicos_completo.sql` no Supabase
2. Acesse a interface de grupos de serviços
3. Edite os grupos para adicionar subgrupos personalizados
4. Organize seus serviços usando os subgrupos criados

---

**Última atualização:** 04/03/2026
