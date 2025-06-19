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

  return (
    <span className="font-mono text-lg text-cyber-yellow">
      {String(hours).padStart(2, '0')}:
      {String(minutes).padStart(2, '0')}:
      {String(seconds).padStart(2, '0')}
    </span>
  );
}