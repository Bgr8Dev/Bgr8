import React, { useState, useEffect } from 'react';
import { filterTypes } from '../types/mentorConstants';
import '../styles/MentorFilters.css';

interface MentorFiltersProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  getFilterCount: (filterType: string) => number;
  totalMentors: number;
}

export const MentorFilters: React.FC<MentorFiltersProps> = ({
  selectedFilter,
  onFilterChange,
  getFilterCount,
  totalMentors
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousFilter, setPreviousFilter] = useState(selectedFilter);

  // Handle filter change with animation
  const handleFilterChange = (filter: string) => {
    if (isAnimating || filter === selectedFilter) return;
    
    setIsAnimating(true);
    setPreviousFilter(selectedFilter);
    
    // Add a small delay to allow the animation to complete
    setTimeout(() => {
      onFilterChange(filter);
      setIsAnimating(false);
    }, 150);
  };

  // Reset animation state when filter changes externally
  useEffect(() => {
    if (selectedFilter !== previousFilter) {
      setIsAnimating(false);
    }
  }, [selectedFilter, previousFilter]);

  return (
    <div className="mf-filters-section">
      <div className={`mf-filters-container ${isAnimating ? 'animating' : ''}`}>
        <button 
          className={`mf-filter-pill ${!selectedFilter ? 'active' : ''} ${isAnimating ? 'transitioning' : ''}`}
          onClick={() => handleFilterChange('')}
          disabled={isAnimating}
          aria-label={`Show all mentors (${totalMentors} total)`}
        >
          <span className="filter-text">All mentors</span>
          <span className="mf-filter-count">{totalMentors}</span>
        </button>
        
        {filterTypes.map(type => (
          <button
            key={type}
            className={`mf-filter-pill ${selectedFilter === type ? 'active' : ''} ${isAnimating ? 'transitioning' : ''}`}
            onClick={() => handleFilterChange(type)}
            disabled={isAnimating}
            aria-label={`Show ${type} mentors (${getFilterCount(type)} available)`}
          >
            <span className="filter-text">{type}</span>
            <span className="mf-filter-count">{getFilterCount(type)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
