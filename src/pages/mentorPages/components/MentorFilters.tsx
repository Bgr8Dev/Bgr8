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
    <div className="filters-section">
      <div className="filters-container">
        <button 
          className={`filter-pill ${!selectedFilter ? 'active' : ''}`}
          onClick={() => onFilterChange('')}
        >
          All mentors
          <span className="filter-count">{totalMentors}</span>
        </button>
        {filterTypes.map(type => (
          <button
            key={type}
            className={`filter-pill ${selectedFilter === type ? 'active' : ''}`}
            onClick={() => onFilterChange(type)}
          >
            {type}
            <span className="filter-count">{getFilterCount(type)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
