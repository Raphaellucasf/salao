import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServerSupabase } from '@/lib/supabase-server';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createServerSupabase(authResult.unitId);
  const { data, error } = await supabase
    .from('cadastros_excluidos')
    .select('id,tipo_cadastro,dados_originais,motivo_exclusao,data_exclusao,usuario_exclusao_id,pode_recuperar,data_expiracao')
    .eq('unit_id', authResult.unitId)
    .order('data_exclusao', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Não foi possível carregar os cadastros excluídos' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body: unknown = await req.json();
    const id = typeof body === 'object' && body !== null && 'id' in body ? body.id : null;
    if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
    }

    const supabase = createServerSupabase(authResult.unitId);
    const { data: ownedArchive, error: ownershipError } = await supabase
      .from('cadastros_excluidos').select('id').eq('id', id).eq('unit_id', authResult.unitId).maybeSingle();
    if (ownershipError) return NextResponse.json({ error: 'Não foi possível validar o cadastro' }, { status: 500 });
    if (!ownedArchive) return NextResponse.json({ error: 'Cadastro excluído não encontrado' }, { status: 404 });
    const { data, error } = await supabase.rpc('restore_deleted_record_atomic', {
      p_archive_id: id,
      p_actor_id: authResult.id,
    });

    if (error) {
      if (error.code === 'P0002') {
        return NextResponse.json({ error: 'Cadastro excluído não encontrado' }, { status: 404 });
      }
      if (error.code === '23505') {
        return NextResponse.json({ error: 'O cadastro já existe e não foi sobrescrito' }, { status: 409 });
      }
      if (error.code === '55000') {
        return NextResponse.json({ error: 'Este cadastro não pode mais ser recuperado' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Não foi possível recuperar o cadastro' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const id = req.nextUrl.searchParams.get('id');
  if (!id || !UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 });
  }

  const supabase = createServerSupabase(authResult.unitId);
  const { data, error } = await supabase
    .from('cadastros_excluidos')
    .delete()
    .eq('id', id)
    .eq('unit_id', authResult.unitId)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Não foi possível excluir o cadastro' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Cadastro excluído não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
