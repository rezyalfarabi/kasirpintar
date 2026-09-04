import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint belum dikonfigurasi pada scaffold awal; tetap validasi via tsc.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;