// src/middleware.js
import { clerkMiddleware } from "@clerk/nextjs/server";

// Ceci est la méthode la plus simple et la plus recommandée par Clerk v5.
// On n'utilise PAS de callback complexe, mais un simple objet de configuration.
export default clerkMiddleware({
  // publicRoutes définit les routes qui NE sont PAS protégées.
  // En laissant ce tableau vide, vous protégez TOUT votre site.
  publicRoutes: [
    // Laissez ici les routes qui doivent absolument être publiques
    // Ex: "/api/webhooks/some-service"
  ]
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};