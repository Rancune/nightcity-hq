// src/middleware.js
// Désactivé temporairement pour diagnostiquer les erreurs 404
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // Les routes listées ici seront accessibles publiquement
  publicRoutes: [
    // Routes des crons qui ont leur propre authentification
    "/api/crons/(.*)",
    "/landing-page",
    "/api/public-route",
    "/api/auth/callback",
    "/api/auth/sign-in",
    "/api/auth/sign-up",
    "/api/auth/sign-out",
    "/api/auth/sign-in/callback",
  ],

  // Spécifiez l'URL de connexion pour que la redirection automatique
  // fonctionne correctement avec votre sous-domaine Clerk
  signInUrl: "https://accounts.fixer.rancune.games/sign-in",
  frontendApi: process.env.NEXT_PUBLIC_CLERK_FRONTEND_API,
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};


