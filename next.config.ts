import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/erocat-homepage" : "";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // GitHub Pages: set to "/repo-name" if deploying to username.github.io/repo-name
  // Set to "" if using a custom domain or deploying to username.github.io
  basePath,
  assetPrefix: isProd ? "/erocat-homepage/" : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
