import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: { root: frontendRoot },
  outputFileTracingRoot: frontendRoot,
  async redirects() {
    return [
      ...["libros", "kardex"].map((section) => ({
        source: `/inventario/${section}`,
        destination: "/inventario",
        permanent: false,
      })),
      ...["cuentas", "diario", "mayor"].map((section) => ({
        source: `/contabilidad/${section}`,
        destination: "/contabilidad",
        permanent: false,
      })),
    ];
  },
};

export default nextConfig;
