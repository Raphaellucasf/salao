import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/api-auth';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const optionalText = (value: unknown, max: number) => value == null || value === '' ? '' : typeof value === 'string' && value.trim().length <= max ? value.trim() : null;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const supabaseAdmin = createServerSupabase(auth.unitId);
  let authId: string | null = null;
  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    const name = typeof body.nome === 'string' ? body.nome.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.senha === 'string' ? body.senha : '';
    const phone = optionalText(body.telefone, 30), cpf = optionalText(body.cpf, 20), notes = optionalText(body.observacoes, 2000);
    const roleId = body.role_id == null || body.role_id === '' ? '' : typeof body.role_id === 'string' && UUID.test(body.role_id) ? body.role_id : null;
    const birthDate = body.data_nascimento == null || body.data_nascimento === '' ? '' : typeof body.data_nascimento === 'string' && DATE.test(body.data_nascimento) ? body.data_nascimento : null;
    const level = Number(body.roleNivel);
    const roleName = typeof body.roleName === 'string' ? body.roleName.toLowerCase() : '';
    if (!name || name.length > 160 || !EMAIL.test(email) || email.length > 254 || password.length < 8 || password.length > 128
      || phone === null || cpf === null || notes === null || roleId === null || birthDate === null || !Number.isFinite(level))
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    const role: 'admin' | 'professional' = level >= 80 || roleName.includes('admin') ? 'admin' : 'professional';

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: name, must_change_password: body.senha_temporaria === true },
    });
    if (authError) return NextResponse.json({ error: 'Não foi possível criar o acesso do usuário' }, { status: 400 });
    authId = authData.user.id;

    const { data, error } = await supabaseAdmin.rpc('provision_app_user_atomic', {
      p_auth_id: authId, p_email: email, p_name: name, p_phone: phone, p_role: role,
      p_role_id: (roleId || null) as string, p_cpf: cpf, p_birth_date: (birthDate || null) as string,
      p_active: body.ativo !== false, p_notes: notes, p_temporary_password: body.senha_temporaria === true,
      p_actor_id: auth.id, p_unit_id: auth.unitId,
    });
    if (error) {
      await supabaseAdmin.auth.admin.deleteUser(authId);
      return NextResponse.json({ error: 'Não foi possível concluir o cadastro do usuário' }, { status: 400 });
    }
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    if (authId) await supabaseAdmin.auth.admin.deleteUser(authId).catch(() => undefined);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
