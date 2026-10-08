import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: { root: frontendRoot },
  outputFileTracingRoot: frontendRoot,
};

export default nextConfig;
