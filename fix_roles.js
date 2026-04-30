const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://woshbfbqgfxkenzylfub.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indvc2hiZmJxZ2Z4a2VuenlsZnViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA1MjYxNywiZXhwIjoyMDkyNjI4NjE3fQ.hnQAtqEsZcecpCBBIdf73kGCOxMPo4mWScflj1tq_DA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRoles() {
  // Get all users
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  console.log('Found users:', users);
  
  for (const user of users) {
    if (user.role !== 'admin') {
      const { error: updateError } = await supabase.from('users').update({ role: 'admin' }).eq('id', user.id);
      if (updateError) {
        console.error('Error updating user:', updateError);
      } else {
        console.log(`Updated user ${user.email} to admin role.`);
      }
    } else {
      console.log(`User ${user.email} is already admin.`);
    }
  }
}

fixRoles();
