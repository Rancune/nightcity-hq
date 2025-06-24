// src/middleware.js
// Désactivé temporairement pour diagnostiquer les erreurs 404
export default function middleware() {
  return;
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};