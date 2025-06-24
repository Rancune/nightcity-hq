import React from 'react';

const ButtonWithLoading = ({ 
  children, 
  onClick, 
  isLoading = false, 
  loadingText = "Chargement...",
  disabled = false,
  className = "",
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${className} transition-all duration-200 glitch-on-hover ${
        isLoading ? 'opacity-75 cursor-not-allowed' : ''
      }`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          {/* Icône de loading */}
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>{loadingText}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default ButtonWithLoading; 