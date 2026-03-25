import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      if (idx === -1) return null;
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
    .filter(Boolean)
);

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchLatest() {
  const req = (table) => fetch(`${url}/rest/v1/${table}?select=*&order=created_at.desc&limit=3`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  }).then(r => r.json());

  const comandas = await req('comandas');
  console.log('--- LATEST 3 COMANDAS ---');
  console.log(comandas.map(c => ({ id: c.id, status: c.status, p_id: c.profissional_id, data: c.data_agendamento, hora: c.hora_inicio })));
  
  const etapas = await req('comanda_item_etapas');
  console.log('--- LATEST 3 ETAPAS ---');
  console.log(etapas.map(e => ({ id: e.id, c_item_id: e.comanda_item_id, p_id: e.profissional_id, aux_id: e.auxiliar_id, nome: e.nome })));

  const agendamentos = await req('agendamentos');
  console.log('--- LATEST 3 AGENDAMENTOS ---');
  console.log(agendamentos.map(a => ({ id: a.id, c_id: a.comanda_id, data: a.data_agendamento })));

  const servico_etapas = await req('servico_etapas');
  console.log('--- LATEST 3 SERVICO_ETAPAS ---');
  console.log(servico_etapas.map(s => ({ id: s.id, exige: s.exige_profissional })));
}

fetchLatest().catch(console.error);
