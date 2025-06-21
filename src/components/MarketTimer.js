import React, { useState, useEffect } from 'react';

const MarketTimer = ({ endTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft(0);
        if (onExpire) onExpire();
        return;
      }

      setTimeLeft(difference);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getColorClass = () => {
    const minutesLeft = timeLeft / (1000 * 60);
    if (minutesLeft < 5) return 'text-red-500 animate-pulse';
    if (minutesLeft < 15) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className={`text-sm font-bold ${getColorClass()}`}>
      ⏰ {formatTime(timeLeft)}
    </div>
  );
};

export default MarketTimer; 