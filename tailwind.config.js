/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
   theme: {
    extend: {
      // ... colors
      animation: {
        scanline: 'scanline 10s linear infinite',
        typing: 'typing 2s steps(30, end), blink .75s step-end infinite',
        // NOUVELLE ANIMATION DE GLITCH
        glitch: 'glitch 1.5s linear infinite',
      },
      keyframes: {
        // ... scanline, typing, blink
        // NOUVELLES ÉTAPES CLÉS POUR LE GLITCH
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-3px, 3px)' },
          '40%': { transform: 'translate(-3px, -3px)' },
          '60%': { transform: 'translate(3px, 3px)' },
          '80%': { transform: 'translate(3px, -3px)' },
          'to': { transform: 'translate(0)' },
        }
      }
    },
  },
  plugins: [],
};
