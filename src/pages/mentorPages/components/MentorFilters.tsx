import React from 'react';
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
  return (
    <div className="mf-filters-section">
      <div className="mf-filters-container">
        <button 
          className={`mf-filter-pill ${!selectedFilter ? 'active' : ''}`}
          onClick={() => onFilterChange('')}
        >
          All mentors
          <span className="mf-filter-count">{totalMentors}</span>
        </button>
        {filterTypes.map(type => (
          <button
            key={type}
            className={`mf-filter-pill ${selectedFilter === type ? 'active' : ''}`}
            onClick={() => onFilterChange(type)}
          >
            {type}
            <span className="mf-filter-count">{getFilterCount(type)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
