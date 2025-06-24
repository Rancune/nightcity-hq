// src/app/template.js
'use client'; // Ce fichier DOIT être un composant client car il gère une animation

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Template({ children }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ 
          opacity: 0,
          filter: 'hue-rotate(0deg) saturate(1) brightness(1) contrast(1)',
          transform: 'scale(1) translateX(0) skew(0deg)',
          clipPath: 'inset(0% 0% 0% 0%)'
        }}
        animate={{ 
          opacity: 1,
          filter: 'hue-rotate(0deg) saturate(1) brightness(1) contrast(1)',
          transform: 'scale(1) translateX(0) skew(0deg)',
          clipPath: 'inset(0% 0% 0% 0%)'
        }}
        exit={{ 
          opacity: 0,
          filter: 'hue-rotate(90deg) saturate(2) brightness(1.5) contrast(1.5)',
          transform: 'scale(1.05) translateX(-10px) skew(-2deg)',
          clipPath: 'inset(10% 0% 10% 0%)'
        }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
          onStart: () => {
            // Effet de glitch au début de la transition
            document.body.style.filter = 'hue-rotate(45deg) saturate(1.5) brightness(1.2) contrast(1.3)';
            // Ajouter un effet de scanlines temporaire
            const scanlines = document.createElement('div');
            scanlines.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 1px,
                rgba(0, 255, 255, 0.1) 1px,
                rgba(0, 255, 255, 0.1) 2px
              );
              pointer-events: none;
              z-index: 9999;
              animation: scanlines 0.4s ease-in-out;
            `;
            document.body.appendChild(scanlines);
            
            // Supprimer l'effet après l'animation
            setTimeout(() => {
              document.body.removeChild(scanlines);
            }, 400);
          },
          onComplete: () => {
            // Restaurer les filtres normaux
            document.body.style.filter = 'none';
          }
        }}
        className={`glitch-transition ${isTransitioning ? 'transitioning' : ''}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}