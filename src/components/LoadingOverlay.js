// src/components/LoadingOverlay.js
'use client';
import React from 'react';

const LoadingOverlay = ({ isVisible, message = "JACK-IN EN COURS..." }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Icône de Jack-in */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto relative">
            {/* Cercle extérieur animé */}
            <div className="absolute inset-0 border-4 border-[--color-neon-cyan] rounded-full animate-spin"></div>
            {/* Cercle intérieur avec effet de pulsation */}
            <div className="absolute inset-2 border-2 border-[--color-neon-pink] rounded-full animate-pulse"></div>
            {/* Point central */}
            <div className="absolute inset-4 bg-[--color-neon-cyan] rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Texte de chargement avec effet typewriter */}
        <div className="text-[--color-neon-cyan] text-2xl font-bold mb-4">
          <span className="inline-block animate-pulse">{message}</span>
        </div>

        {/* Barre de progression */}
        <div className="w-64 h-2 bg-gray-800 rounded-full mx-auto mb-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[--color-neon-cyan] to-[--color-neon-pink] rounded-full animate-pulse" 
               style={{ animation: 'progressBar 2s ease-in-out infinite' }}></div>
        </div>

        {/* Messages de statut */}
        <div className="text-[--color-text-secondary] text-sm space-y-1">
          <div className="animate-pulse">Initialisation du système...</div>
          <div className="animate-pulse" style={{ animationDelay: '0.5s' }}>Connexion au réseau...</div>
          <div className="animate-pulse" style={{ animationDelay: '1s' }}>Accès aux données...</div>
        </div>

        {/* Effet de scanlines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-[--color-neon-cyan]/10 to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;