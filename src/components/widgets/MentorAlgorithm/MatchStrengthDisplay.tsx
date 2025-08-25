import React from 'react';
import MatchStrengthRing from './MatchStrengthRing';

interface MatchStrengthDisplayProps {
  score: number; // 0-100
  size?: number;
  showLabel?: boolean;
  className?: string;
}

const MatchStrengthDisplay: React.FC<MatchStrengthDisplayProps> = ({
  score,
  size = 50,
  showLabel = true,
  className = ''
}) => {
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 80) return '#f59e0b'; // Amber
    if (score >= 70) return '#3b82f6'; // Blue
    if (score >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className={`match-strength-display ${className}`} style={{ textAlign: 'center' }}>
      <MatchStrengthRing
        score={score}
        size={size}
        strokeWidth={4}
        showTooltip={false}
        className="match-ring"
      />
      {showLabel && (
        <div 
          className="match-label" 
          style={{ 
            marginTop: '4px',
            fontSize: '12px',
            fontWeight: '600',
            color: getScoreColor(score)
          }}
        >
          {getScoreLabel(score)} Match
        </div>
      )}
    </div>
  );
};

export default MatchStrengthDisplay;
