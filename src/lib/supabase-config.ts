const publicUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = () =>
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabasePublicConfig() {
  const url = publicUrl();
  const key = publishableKey();
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY são obrigatórias.'
    );
  }
  return { url, publishableKey: key };
}
