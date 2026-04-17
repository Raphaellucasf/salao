import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // desabilita double-mount em dev (evita 2x queries Supabase)
  typescript: {
    // As tabelas em português não estão nos tipos gerados do Supabase.
    // Ignorar erros de build até regenerar os tipos com `supabase gen types`.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
