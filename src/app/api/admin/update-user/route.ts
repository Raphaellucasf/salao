import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdmin } from '@/lib/api-auth';

/**
 * PATCH /api/admin/update-user
 * Atualiza dados de um usuário na tabela usuarios + sincroniza Auth se necessário.
 * Requer role 'admin'.
 */
export async function PATCH(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if (authCheck instanceof NextResponse) return authCheck;

  try {
    const body = await req.json();
    const {
      id,           // UUID da tabela usuarios
      auth_id,      // UUID do Supabase Auth (pode ser null para usuários antigos)
      nome,
      email,
      telefone,
      cpf,
      data_nascimento,
      role_id,
      roleName,
      roleNivel,
      ativo,
      observacoes,
      senha_temporaria,
      permissoes_customizadas,
      tema,
      notificacoes_email,
      notificacoes_push,
      notificacoes_sistema,
      nova_senha,   // opcional — só se quiser trocar a senha
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    }

    // 1. Atualiza na tabela usuarios
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({
        nome,
        email,
        telefone: telefone || null,
        cpf: cpf || null,
        data_nascimento: data_nascimento || null,
        role_id: role_id || null,
        ativo,
        observacoes: observacoes || null,
        senha_temporaria: senha_temporaria ?? false,
        permissoes_customizadas: permissoes_customizadas || null,
        tema: tema || 'light',
        notificacoes_email: notificacoes_email ?? true,
        notificacoes_push: notificacoes_push ?? true,
        notificacoes_sistema: notificacoes_sistema ?? true,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // 2. Se tem auth_id, sincroniza role e dados no Supabase Auth
    if (auth_id) {
      const isAdmin = roleNivel >= 80 || roleName?.toLowerCase().includes('admin');
      const authRole: 'admin' | 'professional' = isAdmin ? 'admin' : 'professional';

      // Atualiza user_metadata e status ativo/inativo
      await supabaseAdmin.auth.admin.updateUserById(auth_id, {
        user_metadata: {
          full_name: nome,
          role: authRole,
          must_change_password: senha_temporaria ?? false,
        },
        ...(ativo === false ? { ban_duration: '87600h' } : { ban_duration: 'none' }),
      });

      // Atualiza tabela users
      await supabaseAdmin
        .from('users')
        .upsert({ id: auth_id, email, full_name: nome, role: authRole });

      // Troca senha se informada
      if (nova_senha && nova_senha.length >= 6) {
        await supabaseAdmin.auth.admin.updateUserById(auth_id, {
          password: nova_senha,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
