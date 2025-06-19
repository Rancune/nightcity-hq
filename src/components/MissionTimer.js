// src/components/MissionTimer.js
'use client';
import { useState, useEffect, useCallback } from 'react';

export default function MissionTimer({ totalDuration, startTime }) {
  const calculateRemaining = useCallback(() => {
    if (!startTime || !totalDuration) return 0;
    const elapsedSeconds = Math.floor((new Date() - new Date(startTime)) / 1000);
    return totalDuration - elapsedSeconds;
  }, [startTime, totalDuration]);

  const [remainingTime, setRemainingTime] = useState(calculateRemaining());

  useEffect(() => {
    // On met à jour l'état toutes les secondes
    const timerId = setInterval(() => {
      setRemainingTime(calculateRemaining());
    }, 1000);

    // On nettoie l'intervalle
    return () => clearInterval(timerId);
  }, [calculateRemaining]);

  // On calcule les minutes et secondes pour l'affichage
  const minutes = Math.floor(remainingTime / 60);
  const seconds = Math.floor(remainingTime % 60);

  // --- LA CORRECTION FINALE EST ICI ---
  return (
    <span className="font-mono text-lg text-red-500 animate-pulse">
      {remainingTime <= 0 ? (
        "00:00"
      ) : (
        // Au lieu d'une chaîne formatée, on renvoie des morceaux de JSX
        <>
          {String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
        </>
      )}
    </span>
  );
}