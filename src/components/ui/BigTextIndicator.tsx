import React from 'react';
import { FaTextHeight } from 'react-icons/fa';
import { useBigText } from '../../hooks/useBigText';

interface BigTextIndicatorProps {
  className?: string;
  showLabel?: boolean;
  showFontSize?: boolean;
}

export default function BigTextIndicator({ className = '', showLabel = true, showFontSize = true }: BigTextIndicatorProps) {
  const { isBigTextEnabled, fontSize } = useBigText();

  if (!isBigTextEnabled) return null;

  return (
    <div className={`big-text-indicator ${className}`} title={`Big text mode is enabled (${fontSize}px)`}>
      <FaTextHeight />
      {showLabel && <span>Big Text</span>}
      {showFontSize && <span>({fontSize}px)</span>}
    </div>
  );
}
