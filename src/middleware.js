// src/middleware.js
import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
  // Les routes listées ici seront accessibles publiquement.
  // Toutes les autres routes nécessiteront une authentification.
  // Si votre page d'accueil (/) doit être privée, ne la mettez PAS dans cette liste.
  publicRoutes: [
    // Si vous utilisez des webhooks, leur route doit être publique.
    // Par exemple: "/api/webhooks/clerk"
  ],

  // Spécifiez l'URL de connexion pour que la redirection automatique
  // fonctionne correctement avec votre sous-domaine Clerk.
  signInUrl: "https://accounts.fixer.rancune.games/sign-in",
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};