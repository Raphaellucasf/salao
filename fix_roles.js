/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const targetUserId = process.env.TARGET_ADMIN_USER_ID;

if (!supabaseUrl || !supabaseKey || !targetUserId) {
  console.error(
    'Variáveis obrigatórias: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY e TARGET_ADMIN_USER_ID.'
  );
  process.exitCode = 1;
} else {
  promoteSingleUser().catch((error) => {
    console.error('Falha ao atualizar o usuário solicitado:', error);
    process.exitCode = 1;
  });
}

async function promoteSingleUser() {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  const { data, error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('id', targetUserId)
    .select('id, role')
    .single();

  if (error) throw error;
  console.log('Papel atualizado para o usuário explicitamente informado:', data.id);
}
