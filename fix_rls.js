const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://woshbfbqgfxkenzylfub.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvc2hiZmJxZ2Z4a2VuenlsZnViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA1MjYxNywiZXhwIjoyMDkyNjI4NjE3fQ.hnQAtqEsZcecpCBBIdf73kGCOxMPo4mWScflj1tq_DA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRls() {
  const sql = `
    DROP POLICY IF EXISTS "Admins gerenciam pacotes_servicos" ON pacotes_servicos;
    CREATE POLICY "Autenticados gerenciam pacotes_servicos" ON pacotes_servicos FOR ALL USING (auth.uid() IS NOT NULL);

    DROP POLICY IF EXISTS "Admins gerenciam servicos" ON servicos;
    CREATE POLICY "Autenticados gerenciam servicos" ON servicos FOR ALL USING (auth.uid() IS NOT NULL);

    DROP POLICY IF EXISTS "Admins gerenciam grupos_servicos" ON grupos_servicos;
    CREATE POLICY "Autenticados gerenciam grupos_servicos" ON grupos_servicos FOR ALL USING (auth.uid() IS NOT NULL);
    
    DROP POLICY IF EXISTS "Admins gerenciam pacotes_servicos_itens" ON pacotes_servicos_itens;
    CREATE POLICY "Autenticados gerenciam pacotes_servicos_itens" ON pacotes_servicos_itens FOR ALL USING (auth.uid() IS NOT NULL);
    
    ALTER TABLE pacotes_servicos_itens ENABLE ROW LEVEL SECURITY;
  `;
  
  // Since we can't run raw SQL easily without rpc setup, we can't execute raw sql like this using supabase-js standard client
  // Wait, supabase-js doesn't have a direct raw SQL execution method unless there's an RPC.
  console.log("Cannot run raw SQL from client. Use a postgres driver or psql.");
}

fixRls();
