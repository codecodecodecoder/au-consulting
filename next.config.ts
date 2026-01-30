import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/au-consulting",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
