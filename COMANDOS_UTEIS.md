# 🛠️ Comandos Úteis - Otimiza Beauty Manager

Guia rápido de comandos para desenvolvimento, manutenção e deploy.

---

## 📦 Gerenciamento de Pacotes

### Instalação
```bash
# Instalar todas as dependências
npm install

# Instalar pacote específico
npm install nome-do-pacote

# Instalar como dev dependency
npm install -D nome-do-pacote

# Atualizar pacotes
npm update

# Verificar pacotes desatualizados
npm outdated
```

---

## 🚀 Desenvolvimento

### Executar Projeto
```bash
# Modo desenvolvimento (hot reload)
npm run dev

# Modo desenvolvimento em porta específica
npm run dev -- -p 3001

# Modo produção
npm run build
npm run start
```

### Lint e Formatação
```bash
# Executar ESLint
npm run lint

# Corrigir erros de lint automaticamente
npm run lint -- --fix
```

---

## 🗄️ Banco de Dados (Supabase)

### Via SQL Editor
1. Acesse https://supabase.com
2. Vá em SQL Editor
3. Cole o conteúdo de `database/schema.sql`
4. Execute

### Via CLI Supabase (Opcional)
```bash
# Instalar CLI
npm install -g supabase

# Fazer login
supabase login

# Inicializar projeto
supabase init

# Aplicar migrations
supabase db push

# Gerar tipos TypeScript
supabase gen types typescript --project-id seu-project-id > src/types/supabase.ts
```

---

## 🔧 TypeScript

### Verificar Tipos
```bash
# Checar erros de tipo sem compilar
npx tsc --noEmit

# Modo watch
npx tsc --noEmit --watch
```

---

## 🎨 Tailwind CSS

### Compilar CSS
```bash
# Já incluído no npm run dev, mas pode executar standalone:
npx tailwindcss -i ./src/app/globals.css -o ./dist/output.css --watch
```

### Gerar Arquivo de Configuração Completo
```bash
npx tailwindcss init --full
```

---

## 🧪 Testes (Quando Implementados)

```bash
# Executar testes
npm test

# Testes em modo watch
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## 📱 PWA

### Instalar next-pwa
```bash
npm install next-pwa
```

### Configurar (next.config.js)
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  // sua configuração existente
});
```

---

## 🚢 Deploy

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### Build Local
```bash
# Criar build de produção
npm run build

# Testar build localmente
npm run start
```

---

## 🐛 Debug

### Logs do Next.js
```bash
# Executar com logs detalhados
DEBUG=* npm run dev

# Logs do Webpack
npm run dev -- --debug
```

### Inspecionar Bundle
```bash
# Instalar analisador
npm install -D @next/bundle-analyzer

# Adicionar ao next.config.js:
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

# Executar análise
ANALYZE=true npm run build
```

---

## 🔐 Variáveis de Ambiente

### Desenvolvimento
```bash
# Editar arquivo
code .env.local

# Verificar se variáveis estão carregadas
npm run dev
# No código: console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### Produção (Vercel)
```bash
# Via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL

# Via Dashboard
# Settings > Environment Variables
```

---

## 📊 Performance

### Lighthouse
```bash
# Instalar
npm install -g lighthouse

# Executar
lighthouse http://localhost:3000 --view
```

### Next.js Bundle Analyzer
```bash
ANALYZE=true npm run build
```

---

## 🔄 Git

### Inicializar
```bash
git init
git add .
git commit -m "Initial commit: Otimiza Beauty Manager"
```

### Conectar com GitHub
```bash
git remote add origin https://github.com/seu-usuario/otimiza-beauty.git
git branch -M main
git push -u origin main
```

### Workflow Recomendado
```bash
# Criar branch para feature
git checkout -b feature/nome-da-feature

# Fazer commits
git add .
git commit -m "feat: adiciona nova funcionalidade"

# Merge na main
git checkout main
git merge feature/nome-da-feature
git push
```

---

## 🧹 Limpeza

### Limpar Cache
```bash
# Remover node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar cache do Next.js
rm -rf .next

# Limpar tudo e reinstalar
npm run clean # (se você adicionar o script)
```

### Script de Limpeza (package.json)
```json
"scripts": {
  "clean": "rm -rf .next node_modules package-lock.json && npm install"
}
```

---

## 📦 Backup

### Exportar Dados do Supabase
```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Via Dashboard
# Database > Backups > Download
```

### Backup de Arquivos
```bash
# Criar arquivo tar
tar -czf otimiza-beauty-backup.tar.gz otimiza-beauty/

# Descompactar
tar -xzf otimiza-beauty-backup.tar.gz
```

---

## 🔍 Inspeção

### Verificar Portas em Uso
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

### Matar Processo na Porta
```bash
# Windows
taskkill /PID numero_do_pid /F

# Linux/Mac
kill -9 PID
```

---

## 📝 Gerar Documentação

### TypeDoc (Para Documentação de Código)
```bash
npm install -D typedoc

npx typedoc --out docs src/
```

---

## 🎯 Comandos Rápidos do Dia a Dia

```bash
# Iniciar desenvolvimento
npm run dev

# Criar novo componente (exemplo manual)
mkdir src/components/NovoComponente
touch src/components/NovoComponente/index.tsx

# Ver logs de build
npm run build > build.log

# Testar API localmente
curl http://localhost:3000/api/appointments

# Verificar versão do Node
node -v

# Verificar versão do npm
npm -v
```

---

## 🔧 Troubleshooting

### Erro: "Port 3000 already in use"
```bash
# Encontrar e matar processo
lsof -ti:3000 | xargs kill -9
# ou usar porta diferente:
npm run dev -- -p 3001
```

### Erro: "Module not found"
```bash
rm -rf node_modules package-lock.json .next
npm install
```

### Erros de TypeScript
```bash
# Reinstalar @types
npm install -D @types/node @types/react @types/react-dom
```

### Cache corrompido
```bash
rm -rf .next
npm run dev
```

---

## 📚 Recursos Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

**Mantenha este arquivo como referência rápida! 🚀**
