# 🔄 Guia de Atualização dos Serviços

## 📋 Arquivos Criados

✅ **atualizar_servicos_completo.sql** - Contém TODOS os novos grupos e serviços  
✅ **adicionar_subgrupos.sql** - Adiciona suporte a subgrupos (opcional, já incluído no script principal)

## 🆕 NOVA FUNCIONALIDADE: Subgrupos

Agora é possível criar **subgrupos/categorias** dentro de cada grupo de serviços!

### Exemplo:
- **TRATAMENTOS E TERAPIAS**
  - Subgrupo: Química
  - Subgrupo: Hidratação

### Como usar:
1. Ao criar ou editar um grupo, você pode adicionar subgrupos
2. Os subgrupos aparecem como tags removíveis
3. Ao criar um serviço, você pode associá-lo a um subgrupo específico

## 🗂️ Estrutura de Grupos Atualizada

1. **TRATAMENTOS E TERAPIAS (Química)** - 20 serviços
   - Subgrupo: **Hidratação** - 4 serviços
2. **CABELO** - 13 serviços
3. **APLICAÇAO PROCEDIMENTO** - 3 serviços
4. **MEGA (MegaHair)** - 4 serviços
5. **MAQUIAGEM** - 4 serviços
6. **ESTÉTICA** - 8 serviços
7. **CABELO FESTA (Penteados)** - 2 serviços

**TOTAL: 58 serviços**

## 🚀 Como Aplicar no Supabase

### Opção 1: Via SQL Editor (Recomendado)

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `atualizar_servicos_completo.sql`
5. Cole no editor
6. Clique em **Run** ou pressione `Ctrl+Enter`
7. Aguarde a confirmação de execução

### Opção 2: Via Linha de Comando (Avançado)

```bash
# Se você tiver o psql instalado e as credenciais do banco
psql "postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DATABASE]" -f database/atualizar_servicos_completo.sql
```

## ⚠️ IMPORTANTE

### Backup antes de executar!

Este script irá:
- ❌ **DELETAR todos os serviços existentes** (`DELETE FROM servicos`)
- ✅ Inserir todos os novos serviços com a estrutura atualizada

**Recomendação**: Se você tiver dados importantes, faça backup antes!

### Fazer Backup no Supabase:

1. Vá em **SQL Editor**
2. Execute este comando para exportar os dados atuais:

```sql
-- Exportar dados atuais (copie o resultado antes de prosseguir)
SELECT * FROM servicos ORDER BY codigo;
```

## 📊 Verificação Pós-Execução

Após executar o script, ele automaticamente mostrará:

1. **Resumo por Grupo**:
   - Total de serviços por grupo
   - Quantos estão ativos

2. **Lista Completa**:
   - Todos os serviços ordenados por grupo
   - Com código, nome, tempo, valor e custo

## 🔍 Principais Mudanças

### Novos Serviços Adicionados:
- Hidrocicatrização (código 274)
- Hidratação Wella Blonder (código 270)
- Tratamento Detox (código 267)
- Spa das Sobrancelhas (código 268)
- 4 variações de Mega Hair (MH1, MH2, MH3, código 130)

### Valores Atualizados:
- Luzes + Tonalizante - Longo: R$ 830,00 (era R$ 859,00)
- Luzes + Tonalizante - Médio: R$ 550,00 (era R$ 569,00)
- Luzes + Tonalizante - Curto: R$ 430,00 (era R$ 433,00)
- E outros ajustes conforme sua lista

### Observações Importantes:
- Serviços de hidratação marcados com observação sobre não especificar preço
- MegaHair com observação sobre método das fitas
- Categorias organizadas por grupo e subgrupo

## 💡 Dicas

- Os códigos mantêm o padrão numérico original
- Novos serviços de MegaHair usam códigos MH1, MH2, MH3
- Categoria "Química" e "Hidratação" como subgrupos de "TRATAMENTOS E TERAPIAS"
- Todos os serviços marcados como `ativo = true` por padrão

## 🆘 Problemas?

Se encontrar erros ao executar:
1. Verifique se a tabela `servicos` existe
2. Confirme que você tem permissões de DELETE e INSERT
3. Verifique se existe constraint de chave estrangeira bloqueando a exclusão

## 📞 Próximos Passos

Após aplicar o script:
1. ✅ Verifique os dados no painel do Supabase
2. ✅ Teste o sistema para garantir que os serviços aparecem corretamente
3. ✅ Atualize a interface se necessário para refletir novos grupos
