// src/middleware.js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Cette fonction nous aide à définir facilement quelles routes sont publiques.
const isPublicRoute = createRouteMatcher([
  // Listez ici toutes les routes qui doivent rester accessibles sans connexion.
  // Par exemple, si vous avez des webhooks :
  // '/api/webhooks(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // On protège toutes les routes qui ne sont PAS définies comme publiques.
  if (!isPublicRoute(req)) {
    auth().protect(); // C'est la nouvelle fonction magique !
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};