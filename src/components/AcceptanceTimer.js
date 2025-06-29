// src/components/AcceptanceTimer.js
'use client';
import { useState, useEffect } from 'react';

export default function AcceptanceTimer({ duration }) {
  const [remainingTime, setRemainingTime] = useState(Math.floor(duration));

  useEffect(() => {
    if (remainingTime <= 0) return;
    const timerId = setInterval(() => setRemainingTime(p => p - 1), 1000);
    return () => clearInterval(timerId);
  }, [remainingTime]);

  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = Math.floor(remainingTime % 60);

  // Couleur basée sur le temps restant
  const getTimeColor = () => {
    if (remainingTime <= 300) return 'text-red-400 animate-pulse'; // 5 minutes ou moins
    if (remainingTime <= 900) return 'text-yellow-400'; // 15 minutes ou moins
    return 'text-[--color-neon-cyan]';
  };

  return (
    <span className={`font-mono text-lg font-bold ${getTimeColor()}`}>
      {String(hours).padStart(2, '0')}:
      {String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </span>
  );
}