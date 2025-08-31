import React, { useState, useEffect } from 'react';

interface MatchStrengthRingProps {
  score: number; // 0-100
  size?: number; // px
  strokeWidth?: number; // px
  color?: string; // CSS color
  bgColor?: string; // CSS color
  label?: string;
  showTooltip?: boolean;
  className?: string;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

const MatchStrengthRing: React.FC<MatchStrengthRingProps> = ({
  score,
  size = 60,
  strokeWidth = 6,
  bgColor = '#333',
  label = 'Match Strength',
  showTooltip = true,
  className = ''
}) => {
  const [hovered, setHovered] = useState(false);
  const [animatedOffset, setAnimatedOffset] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = clamp(score, 0, 100) / 100;
  const offset = circumference * (1 - pct);
  const tooltip = `${label}: ${score}/100`;

  // Animate the arc on mount
  useEffect(() => {
    setAnimatedOffset(circumference); // Start empty
    const timeout = setTimeout(() => {
      setAnimatedOffset(offset); // Animate to score
    }, 30); // Small delay to trigger transition
    return () => clearTimeout(timeout);
  }, [circumference, offset]);

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 80) return '#f59e0b'; // Amber
    if (score >= 70) return '#3b82f6'; // Blue
    if (score >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const scoreColor = getScoreColor(score);

  return (
    <div
      className={`match-strength-ring ${className}`}
      style={{
        display: 'inline-block',
        position: 'relative',
        width: size,
        height: size,
        transition: 'transform 0.18s cubic-bezier(0.77,0,0.175,1), box-shadow 0.18s',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        boxShadow: hovered ? `0 0 16px 2px ${scoreColor}55, 0 2px 8px #0008` : 'none',
        cursor: showTooltip ? 'pointer' : 'default',
      }}
      aria-label={tooltip}
      tabIndex={showTooltip ? 0 : -1}
      onMouseEnter={() => showTooltip && setHovered(true)}
      onMouseLeave={() => showTooltip && setHovered(false)}
      onFocus={() => showTooltip && setHovered(true)}
      onBlur={() => showTooltip && setHovered(false)}
    >
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          style={{ opacity: 0.25 }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.77,0,0.175,1)',
            filter: 'drop-shadow(0 0 6px ' + scoreColor + '55)',
          }}
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: size * 0.32,
          color: scoreColor,
          textShadow: '0 1px 6px #000, 0 0 2px #fff8',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        aria-hidden="true"
      >
        {score}
      </span>
      {showTooltip && hovered && (
        <div
          style={{
            position: 'absolute',
            left: -100,
            right: 'auto',
            bottom: '110%',
            transform: 'translateY(-8px)',
            background: 'rgba(24,24,24,0.98)',
            color: '#fff',
            padding: '0.7em 1.1em',
            borderRadius: 8,
            fontSize: '0.98rem',
            fontWeight: 500,
            boxShadow: `0 4px 18px ${scoreColor}33, 0 2px 12px #000b` ,
            whiteSpace: 'pre-line',
            zIndex: 100,
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity 0.18s, transform 0.18s',
            marginBottom: '0.4em',
            minWidth: 120,
            maxWidth: 180,
            textAlign: 'left',
            overflowWrap: 'break-word',
          }}
          role="tooltip"
        >
          {tooltip}
          <span
            style={{
              position: 'absolute',
              left: 110,
              top: '100%',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `8px solid rgba(24,24,24,0.98)`,
              filter: `drop-shadow(0 2px 4px ${scoreColor}33)`,
              zIndex: 101,
            }}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

export default MatchStrengthRing; 