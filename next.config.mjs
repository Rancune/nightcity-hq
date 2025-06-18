/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // On dit à Next.js de ne pas essayer d'être trop malin avec les dépendances de Clerk,
    // car elles ont besoin d'accéder directement aux API de cryptographie de Node.js.
    serverComponentsExternalPackages: [
      '@clerk/clerk-sdk-node',
    ],
  },
};

export default nextConfig;