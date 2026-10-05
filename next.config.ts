import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salida autocontenida para la imagen Docker (deploy/frontend).
  output: "standalone",
};

export default nextConfig;
