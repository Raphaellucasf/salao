-- =====================================================
-- MIGRAÇÃO DE SISTEMA DE USUÁRIOS E PERMISSÕES
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Dropar tabelas antigas (caso existam)
DROP TABLE IF EXISTS usuarios_permissoes CASCADE;
DROP TABLE IF EXISTS permissoes CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- =====================================================
-- TABELA DE ROLES (FUNÇÕES)
-- =====================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  nome VARCHAR(100) UNIQUE NOT NULL,
  descricao TEXT,
  cor VARCHAR(7), -- Hex color para badges
  nivel INTEGER NOT NULL DEFAULT 0, -- 0=básico, 100=admin total
  
  -- Permissões por módulo (JSON para flexibilidade)
  permissoes_agenda JSONB DEFAULT '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  permissoes_clientes JSONB DEFAULT '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  permissoes_profissionais JSONB DEFAULT '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  permissoes_produtos JSONB DEFAULT '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  permissoes_servicos JSONB DEFAULT '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  permissoes_financeiro JSONB DEFAULT '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  permissoes_relatorios JSONB DEFAULT '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  permissoes_configuracoes JSONB DEFAULT '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  permissoes_usuarios JSONB DEFAULT '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  
  -- Permissões especiais
  pode_abrir_caixa BOOLEAN DEFAULT false,
  pode_fechar_caixa BOOLEAN DEFAULT false,
  pode_dar_desconto BOOLEAN DEFAULT false,
  desconto_maximo_percentual DECIMAL(5, 2) DEFAULT 0,
  pode_cancelar_venda BOOLEAN DEFAULT false,
  pode_editar_comissao BOOLEAN DEFAULT false,
  pode_acessar_todos_profissionais BOOLEAN DEFAULT false, -- Ver agenda de todos
  
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_roles_ativo ON roles(ativo);
CREATE INDEX idx_roles_nivel ON roles(nivel DESC);

-- =====================================================
-- TABELA DE USUÁRIOS
-- =====================================================

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Dados Pessoais
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE,
  data_nascimento DATE,
  
  -- Autenticação
  senha_hash VARCHAR(255), -- Para login interno
  auth_id UUID, -- ID do Supabase Auth (se usar)
  
  -- Role e Permissões
  role_id UUID REFERENCES roles(id),
  permissoes_customizadas JSONB, -- Permissões específicas que sobrescrevem a role
  
  -- Dados de Acesso
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  ip_ultimo_acesso VARCHAR(45),
  tentativas_login INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMP WITH TIME ZONE,
  
  -- Configurações
  avatar_url TEXT,
  tema VARCHAR(20) DEFAULT 'light', -- light, dark, auto
  idioma VARCHAR(5) DEFAULT 'pt-BR',
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  
  -- Notificações
  notificacoes_email BOOLEAN DEFAULT true,
  notificacoes_push BOOLEAN DEFAULT true,
  notificacoes_sistema BOOLEAN DEFAULT true,
  
  -- Profissional vinculado (se for profissional também)
  profissional_id UUID,
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  primeiro_acesso BOOLEAN DEFAULT true,
  senha_temporaria BOOLEAN DEFAULT false,
  
  -- Observações
  observacoes TEXT,
  
  -- Metadados
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_usuarios_role ON usuarios(role_id);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX idx_usuarios_profissional ON usuarios(profissional_id);
CREATE INDEX idx_usuarios_auth_id ON usuarios(auth_id);

-- =====================================================
-- TABELA DE LOG DE AÇÕES (AUDITORIA)
-- =====================================================

CREATE TABLE usuarios_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  usuario_id UUID REFERENCES usuarios(id),
  
  acao VARCHAR(100) NOT NULL, -- login, logout, create, update, delete, etc
  modulo VARCHAR(100), -- clientes, produtos, agenda, etc
  registro_id UUID, -- ID do registro afetado
  
  dados_anteriores JSONB, -- Estado antes da alteração
  dados_novos JSONB, -- Estado depois da alteração
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usuarios_log_usuario ON usuarios_log(usuario_id);
CREATE INDEX idx_usuarios_log_acao ON usuarios_log(acao);
CREATE INDEX idx_usuarios_log_modulo ON usuarios_log(modulo);
CREATE INDEX idx_usuarios_log_data ON usuarios_log(created_at DESC);

-- =====================================================
-- TABELA DE SESSÕES ATIVAS
-- =====================================================

CREATE TABLE usuarios_sessoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  
  token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255) UNIQUE,
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  dispositivo VARCHAR(100), -- desktop, mobile, tablet
  navegador VARCHAR(100),
  
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  ultima_atividade TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessoes_usuario ON usuarios_sessoes(usuario_id);
CREATE INDEX idx_sessoes_token ON usuarios_sessoes(token);
CREATE INDEX idx_sessoes_ativo ON usuarios_sessoes(ativo);
CREATE INDEX idx_sessoes_expira ON usuarios_sessoes(expira_em);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER roles_updated_at BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER usuarios_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÃO PARA VERIFICAR PERMISSÃO
-- =====================================================

CREATE OR REPLACE FUNCTION verificar_permissao(
  p_usuario_id UUID,
  p_modulo VARCHAR,
  p_acao VARCHAR -- visualizar, criar, editar, excluir
) RETURNS BOOLEAN AS $$
DECLARE
  v_permissao BOOLEAN;
  v_nivel_role INTEGER;
BEGIN
  -- Admin total sempre tem permissão
  SELECT r.nivel INTO v_nivel_role
  FROM usuarios u
  JOIN roles r ON r.id = u.role_id
  WHERE u.id = p_usuario_id;
  
  IF v_nivel_role >= 100 THEN
    RETURN true;
  END IF;
  
  -- Verificar permissão específica do módulo
  EXECUTE format(
    'SELECT (u.permissoes_customizadas->>%L)::jsonb->>%L = ''true'' 
     OR (r.permissoes_%s->>%L)::boolean
     FROM usuarios u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1',
    p_modulo, p_acao, p_modulo, p_acao
  ) INTO v_permissao USING p_usuario_id;
  
  RETURN COALESCE(v_permissao, false);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO PARA REGISTRAR LOG DE AÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_log_acao(
  p_usuario_id UUID,
  p_acao VARCHAR,
  p_modulo VARCHAR DEFAULT NULL,
  p_registro_id UUID DEFAULT NULL,
  p_dados_anteriores JSONB DEFAULT NULL,
  p_dados_novos JSONB DEFAULT NULL,
  p_ip_address VARCHAR DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO usuarios_log (
    usuario_id, acao, modulo, registro_id,
    dados_anteriores, dados_novos, ip_address, user_agent
  ) VALUES (
    p_usuario_id, p_acao, p_modulo, p_registro_id,
    p_dados_anteriores, p_dados_novos, p_ip_address, p_user_agent
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNÇÃO PARA LIMPAR SESSÕES EXPIRADAS
-- =====================================================

CREATE OR REPLACE FUNCTION limpar_sessoes_expiradas()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM usuarios_sessoes
  WHERE expira_em < NOW() OR (ultima_atividade < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS DE EXEMPLO - ROLES
-- =====================================================

INSERT INTO roles (nome, descricao, cor, nivel, 
  permissoes_agenda, permissoes_clientes, permissoes_profissionais, permissoes_produtos, 
  permissoes_servicos, permissoes_financeiro, permissoes_relatorios, permissoes_configuracoes, permissoes_usuarios,
  pode_abrir_caixa, pode_fechar_caixa, pode_dar_desconto, desconto_maximo_percentual, 
  pode_cancelar_venda, pode_editar_comissao, pode_acessar_todos_profissionais
) VALUES 
-- Admin Total
(
  'Administrador', 
  'Acesso total ao sistema', 
  '#EF4444', 
  100,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'::jsonb,
  true, true, true, 100.00, true, true, true
),

-- Gerente
(
  'Gerente', 
  'Gerenciamento geral exceto configurações críticas', 
  '#F59E0B', 
  80,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": true}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  true, true, true, 50.00, true, true, true
),

-- Recepcionista
(
  'Recepcionista', 
  'Atendimento, agenda e cadastros básicos', 
  '#3B82F6', 
  50,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  false, false, true, 10.00, false, false, true
),

-- Profissional
(
  'Profissional', 
  'Acesso à própria agenda e clientes', 
  '#10B981', 
  30,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  false, false, false, 0.00, false, false, false
),

-- Caixa/Financeiro
(
  'Caixa', 
  'Operações de caixa e financeiro', 
  '#8B5CF6', 
  60,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": true, "editar": true, "excluir": false}'::jsonb,
  '{"visualizar": true, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  '{"visualizar": false, "criar": false, "editar": false, "excluir": false}'::jsonb,
  true, true, true, 20.00, false, false, false
);

-- =====================================================
-- DADOS DE EXEMPLO - USUÁRIOS
-- =====================================================

-- Senha padrão para todos: "123456" (em produção, usar hash real)
INSERT INTO usuarios (nome, email, telefone, cpf, role_id, ativo, senha_hash) VALUES
(
  'Lucas Administrador',
  'lucas.admin@otimiza.com',
  '(11) 99999-0001',
  '111.111.111-11',
  (SELECT id FROM roles WHERE nome = 'Administrador'),
  true,
  '$2a$10$example.hash.123456' -- Hash fake, substituir por real
),
(
  'Maria Gerente',
  'maria.gerente@otimiza.com',
  '(11) 99999-0002',
  '222.222.222-22',
  (SELECT id FROM roles WHERE nome = 'Gerente'),
  true,
  '$2a$10$example.hash.123456'
),
(
  'João Recepcionista',
  'joao.recepcao@otimiza.com',
  '(11) 99999-0003',
  '333.333.333-33',
  (SELECT id FROM roles WHERE nome = 'Recepcionista'),
  true,
  '$2a$10$example.hash.123456'
);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE roles IS 'Funções/perfis de usuário com permissões por módulo';
COMMENT ON TABLE usuarios IS 'Usuários do sistema com autenticação e permissões';
COMMENT ON TABLE usuarios_log IS 'Log de auditoria de todas as ações dos usuários';
COMMENT ON TABLE usuarios_sessoes IS 'Sessões ativas dos usuários para controle de acesso';

COMMENT ON COLUMN roles.nivel IS 'Nível hierárquico: 0-29=básico, 30-49=operacional, 50-79=gerencial, 80-99=direção, 100=admin total';
COMMENT ON COLUMN usuarios.permissoes_customizadas IS 'Permissões específicas que sobrescrevem as permissões da role';
COMMENT ON COLUMN usuarios.profissional_id IS 'Se o usuário também é um profissional, vincular aqui';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 
  'roles' as tabela,
  COUNT(*) as registros
FROM roles
UNION ALL
SELECT 
  'usuarios' as tabela,
  COUNT(*) as registros
FROM usuarios;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
