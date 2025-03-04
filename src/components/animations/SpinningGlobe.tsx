import React from 'react';
import { FaGlobe } from 'react-icons/fa';
import '../../styles/SpinningGlobe.css';

interface SpinningGlobeProps {
  size?: number;
  speed?: number;
  className?: string;
}

const SpinningGlobe: React.FC<SpinningGlobeProps> = ({ 
  size = 80, 
  speed = 10,
  className = ''
}) => {
  const animationDuration = 20 - speed; // Invert speed so higher number = faster

  return (
    <div 
      className={`spinning-globe-container ${className}`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px` 
      }}
    >
      <div 
        className="spinning-globe" 
        style={{ 
          animationDuration: `${animationDuration}s`,
          fontSize: `${size}px`
        }}
      >
        <FaGlobe />
      </div>
      <div className="globe-shadow"></div>
    </div>
  );
};

export default SpinningGlobe; 