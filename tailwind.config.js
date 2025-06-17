/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ... ta section 'colors'

      animation: {
        scanline: 'scanline 10s linear infinite',
        // On ajoute notre nouvelle animation complexe
        typing: 'typing 2s steps(30, end), blink .75s step-end infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        // Les étapes clés pour l'effet de frappe
        typing: {
          from: { width: '0' },
          to: { width: '100%' }
        },
        // Les étapes clés pour le clignotement du curseur
        blink: {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: 'var(--color-neon-lime)' }, // On utilise nos variables CSS !
        }
      }
    },
  },
  plugins: [],
};

