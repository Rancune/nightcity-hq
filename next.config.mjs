import 'dotenv/config'; // ON FORCE LE CHARGEMENT DES VARIABLES D'ENVIRONNEMENT ICI

console.log('TEST_VARIABLE:', process.env.TEST_VARIABLE);
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

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