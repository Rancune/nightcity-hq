// src/middleware.js
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';

export default clerkMiddleware((auth, request) => {
  // On log des infos sur chaque requête qui passe
  if (!request.nextUrl.pathname.startsWith('/_next')) {
    console.log('\n--- REQUÊTE INTERCEPTÉE ---');
    console.log('METHODE:', request.method, '| URL:', request.nextUrl.pathname);

    // On vérifie si le cookie de session est bien présent dans les en-têtes
    const cookie = request.headers.get('cookie');
    const hasSessionCookie = cookie ? cookie.includes('__session') : false;
    console.log('Badge de session Clerk présent dans le cookie ?', hasSessionCookie);

    // On demande au gardien d'identifier l'utilisateur à ce stade précis
    const { userId } = await auth();
    console.log('Résultat de auth() DANS LE MIDDLEWARE:', userId);
    console.log('--- FIN INTERCEPTION ---\n');
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};