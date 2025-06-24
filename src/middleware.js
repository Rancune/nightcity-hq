// src/middleware.js
import { clerkMiddleware } from "@clerk/nextjs/server";

// C'est la méthode la plus simple et la plus recommandée par Clerk v5.
export default clerkMiddleware({
  // En laissant ce tableau vide, vous protégez TOUT votre site par défaut.
  publicRoutes: [] 
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};