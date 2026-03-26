// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/admin/create-user
 * Cria um usuário no Supabase Auth + tabelas users e usuarios.
 * Chamado pela UsuarioModal ao criar novo usuário.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nome,
      email,
      senha,
      telefone,
      cpf,
      data_nascimento,
      role_id,
      roleName,   // nome da role (ex: 'Administrador')
      roleNivel,  // nivel numérico da role
      ativo = true,
      observacoes,
      senha_temporaria = false,
    } = body;

    if (!email || !senha || !nome) {
      return NextResponse.json({ error: 'email, senha e nome são obrigatórios' }, { status: 400 });
    }

    // Determina se este usuário terá acesso administrativo
    // Nivel máximo no seed é 100 (Administrador). Acima de 80 = admin.
    const isAdmin = roleNivel >= 80 || roleName?.toLowerCase().includes('admin');
    const authRole: 'admin' | 'professional' = isAdmin ? 'admin' : 'professional';

    // 1. Cria usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // confirma email automaticamente
      user_metadata: {
        full_name: nome,
        role: authRole,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const authId = authData.user.id;

    // 2. Cria/upsert na tabela users (usada pelo AuthContext)
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authId,
        email,
        full_name: nome,
        phone: telefone || null,
        role: authRole,
      });

    if (usersError) {
      // Não bloqueia — o AuthContext tem fallback para user_metadata
      console.error('Aviso: erro ao criar entrada em users:', usersError.message);
    }

    // 3. Insere na tabela usuarios (gestão interna)
    const { error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .insert([{
        nome,
        email,
        telefone: telefone || null,
        cpf: cpf || null,
        data_nascimento: data_nascimento || null,
        role_id: role_id || null,
        ativo,
        observacoes: observacoes || null,
        senha_temporaria,
        primeiro_acesso: true,
        auth_id: authId,
      }]);

    if (usuariosError) {
      // Tenta limpar o auth user criado
      await supabaseAdmin.auth.admin.deleteUser(authId);
      return NextResponse.json({ error: usuariosError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, authId });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}
