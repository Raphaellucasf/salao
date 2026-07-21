import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // desabilita double-mount em dev (evita 2x queries Supabase)
};

export default nextConfig;
