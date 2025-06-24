// src/middleware.js
// Désactivé temporairement pour diagnostiquer les erreurs 404
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // Les routes listées ici seront accessibles publiquement
  publicRoutes: [
    // Routes des crons qui ont leur propre authentification
    "/api/crons/(.*)",
  ],

  // Spécifiez l'URL de connexion pour que la redirection automatique
  // fonctionne correctement avec votre sous-domaine Clerk
  signInUrl: "https://accounts.fixer.rancune.games/sign-in",
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};