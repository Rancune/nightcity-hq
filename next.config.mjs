import 'dotenv/config'; // ON FORCE LE CHARGEMENT DES VARIABLES D'ENVIRONNEMENT ICI

/** @type {import('next').NextConfig} */
const nextConfig = {
  // On dit à Next.js de ne pas essayer d'être trop malin avec les dépendances de Clerk,
  // car elles ont besoin d'accéder directement aux API de cryptographie de Node.js.
  serverExternalPackages: [
    '@clerk/clerk-sdk-node',
  ],
};

export default nextConfig;