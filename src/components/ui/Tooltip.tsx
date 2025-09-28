import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const checkPosition = useCallback(() => {
    if (!tooltipRef.current || !triggerRef.current) return;
    
    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // For right-positioned tooltips, calculate position relative to viewport
    if (position === 'right') {
      const tooltipLeft = rect.right + 8; // 8px gap from trigger
      const tooltipTop = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      
      // Check if tooltip would go off the right edge
      if (tooltipLeft + tooltipRect.width > viewportWidth - 20) {
        // Use fallback positioning (below the trigger)
        const fallbackTop = rect.bottom + 8;
        const fallbackLeft = rect.left;
        
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${fallbackLeft}px`;
        tooltip.style.top = `${fallbackTop}px`;
        tooltip.style.transform = 'none';
        setUseFallback(true);
      } else {
        // Normal positioning (to the right of trigger)
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${tooltipLeft}px`;
        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.transform = 'none';
        setUseFallback(false);
      }
    } else {
      setUseFallback(false);
    }
  }, [position]);

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
  }, [isVisible, checkPosition]);

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
