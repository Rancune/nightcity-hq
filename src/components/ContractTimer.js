// src/components/ContractTimer.js
'use client';
import { useState, useEffect } from 'react';

// Fonction pour formater les secondes en MM:SS
const formatTime = (totalSeconds) => {
  if (totalSeconds <= 0) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `<span class="math-inline">\{String\(minutes\)\.padStart\(2, '0'\)\}\:</span>{String(seconds).padStart(2, '0')}`;
};

export default function ContractTimer({ initialDuration }) {
  const [remainingTime, setRemainingTime] = useState(initialDuration);

  useEffect(() => {
    // On ne lance le minuteur que s'il y a du temps à décompter
    if (remainingTime <= 0) return;

    // On met en place un intervalle qui se déclenche toutes les secondes
    const timerId = setInterval(() => {
      setRemainingTime(prevTime => prevTime - 1);
    }, 1000);

    // Fonction de nettoyage : très important pour arrêter le minuteur si le composant disparaît
    return () => clearInterval(timerId);

  }, [remainingTime]); // Le useEffect dépend de remainingTime

  return (
    <span className="font-mono text-lg text-cyber-yellow animate-pulse">
      {formatTime(remainingTime)}
    </span>
  );
}