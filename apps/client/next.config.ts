import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone", // required for Docker
  transpilePackages: ["@notify/types"], // monorepo packages
};

export default nextConfig;
