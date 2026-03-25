const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Fetching latest comanda...');
  const { data: comanda, error: errC } = await supabase
    .from('comandas')
    .select('*, comanda_itens(id, *), comanda_item_etapas(*)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (errC) console.error('Error fetching comanda:', errC.message);
  else {
    console.log('LATEST COMANDA:');
    console.log('ID:', comanda.id);
    console.log('Profissional ID:', comanda.profissional_id);
    console.log('Data:', comanda.data_agendamento, 'Hora:', comanda.hora_inicio);
    console.log('Status:', comanda.status);
    console.log('Itens:', comanda.comanda_itens?.length);
    console.log('Etapas:', comanda.comanda_item_etapas?.length);
    console.log('Comanda Item Etapas Data:', comanda.comanda_item_etapas);
  }

  console.log('\nFetching latest agendamento...');
  const { data: agendamento, error: errA } = await supabase
    .from('agendamentos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (errA) console.error('Error fetching agendamento:', errA.message);
  else {
    console.log('LATEST AGENDAMENTO:');
    console.log('ID:', agendamento.id);
    console.log('Comanda ID:', agendamento.comanda_id);
    console.log('Profissional:', agendamento.profissional_id);
    console.log('Data:', agendamento.data_agendamento, 'Hora:', agendamento.hora_inicio);
  }
}

main();
