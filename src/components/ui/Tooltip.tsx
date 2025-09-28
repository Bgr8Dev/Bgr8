import React, { useState, useRef, useEffect } from 'react';
import { FaInfoCircle, FaQuestionCircle } from 'react-icons/fa';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: 'info' | 'question';
  className?: string;
  maxWidth?: string;
  delay?: number;
  disabled?: boolean;
}

export default function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  icon = 'info',
  className = '',
  maxWidth = '280px',
  delay = 500,
  disabled = false
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
        setShowTooltip(false);
      }
    };
    
    const handleResize = () => {
      if (isVisible) {
        checkPosition();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible]);

  const checkPosition = () => {
    if (!tooltipRef.current || !triggerRef.current) return;
    
    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Check if tooltip would go off the right edge
    if (position === 'right' && rect.right + tooltipRect.width > viewportWidth - 20) {
      setUseFallback(true);
    } else {
      setUseFallback(false);
    }
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setTimeout(() => {
        setShowTooltip(true);
        checkPosition();
      }, 50);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setShowTooltip(false);
  };

  const handleClick = () => {
    if (disabled) return;
    setIsVisible(!isVisible);
    if (!isVisible) {
      setTimeout(() => setShowTooltip(true), 50);
    } else {
      setShowTooltip(false);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full';
      case 'bottom':
        return 'top-full';
      case 'left':
        return 'left-full';
      case 'right':
        return 'right-full';
      default:
        return 'bottom-full';
    }
  };

  const getArrowClasses = () => {
    // Arrow positioning is handled by CSS, so we don't need to return specific classes
    return '';
  };

  return (
    <div className={`tooltip-container ${className}`}>
      <div
        ref={triggerRef}
        className="tooltip-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
        <span className="tooltip-icon">
          {icon === 'question' ? <FaQuestionCircle size={12} /> : <FaInfoCircle size={12} />}
        </span>
        
        {isVisible && (
          <div
            ref={tooltipRef}
            className={`tooltip-content ${getPositionClasses()} ${
              showTooltip ? 'tooltip-visible' : 'tooltip-hidden'
            } ${useFallback && position === 'right' ? 'fallback-top' : ''}`}
            style={{ maxWidth }}
          >
            <div className="tooltip-arrow"></div>
            <div className="tooltip-text">
              {content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
