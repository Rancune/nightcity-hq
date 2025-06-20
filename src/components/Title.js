import React from 'react';

const HeroTitle = ({ text }) => {
  return (
    <h1 className="text-4xl md:text-6xl font-glitch-display text-neon-vert mb-4 text-center typewriter">
      {text}
    </h1>
  );
};

export default HeroTitle;