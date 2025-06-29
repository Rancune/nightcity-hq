// src/components/MissionTimer.js
'use client';
import { useState, useEffect, useRef } from 'react';

export default function MissionTimer({ totalDuration, startTime, onTimerEnd }) {
  const calculateRemaining = () => {
    if (!startTime || !totalDuration) return 0;
    const elapsedSeconds = Math.floor((new Date() - new Date(startTime)) / 1000);
    return totalDuration - elapsedSeconds;
  };

  const [remainingTime, setRemainingTime] = useState(calculateRemaining());
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (remainingTime <= 0) {
      if (!hasTriggered.current) {
        hasTriggered.current = true;
        if (onTimerEnd) onTimerEnd();
      }
      return;
    }

    const timerId = setInterval(() => {
      setRemainingTime(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [remainingTime, startTime, totalDuration, onTimerEnd]);

  // On calcule les minutes et secondes pour l'affichage directement ici
  const minutes = Math.floor(remainingTime / 60);
  const seconds = Math.floor(remainingTime % 60);

  // Couleur basée sur le temps restant
  const getTimeColor = () => {
    if (remainingTime <= 60) return 'text-red-400 animate-pulse'; // 1 minute ou moins
    if (remainingTime <= 300) return 'text-yellow-400'; // 5 minutes ou moins
    return 'text-[--color-neon-cyan]';
  };

  // LA CORRECTION DÉFINITIVE : On construit l'affichage en morceaux, sans fonction de formatage.
  return (
    <span className={`font-mono text-lg font-bold ${getTimeColor()}`}>
      {remainingTime <= 0 ? '00:00' : (
        <>
          {String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
        </>
      )}
    </span>
  );
}