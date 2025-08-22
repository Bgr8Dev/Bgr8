import { useState, useEffect } from 'react';
import { MentorMenteeProfile, MentorAvailability } from './mentorTypes';
import skillsByCategory from '../../../constants/skillsByCategory';
import industriesList from '../../../constants/industries';
import ukEducationLevels from '../../../constants/ukEducationLevels';
import ukCounties from '../../../constants/ukCounties';

export const useMentorSearch = (
  mentors: MentorMenteeProfile[],
  mentorAvailability: MentorAvailability
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<MentorMenteeProfile[]>([]);

  const generateSearchSuggestions = (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSearchDropdown(false);
      return;
    }

    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    // Add mentor names
    mentors.forEach(mentor => {
      if (String(mentor.name || '').toLowerCase().includes(queryLower)) {
        suggestions.add(`Name: ${mentor.name}`);
      }
      if (String(mentor.profession || '').toLowerCase().includes(queryLower)) {
        suggestions.add(`Profession: ${mentor.profession}`);
      }
      if (String(mentor.county || '').toLowerCase().includes(queryLower)) {
        suggestions.add(`Location: ${mentor.county}`);
      }
      if (String(mentor.educationLevel || '').toLowerCase().includes(queryLower)) {
        suggestions.add(`Education: ${mentor.educationLevel}`);
      }
    });

    // Add skills
    Object.values(skillsByCategory).flat().forEach(skill => {
      if (skill.toLowerCase().includes(queryLower)) {
        suggestions.add(`Skill: ${skill}`);
      }
    });

    // Add industries
    industriesList.forEach(industry => {
      if (industry.toLowerCase().includes(queryLower)) {
        suggestions.add(`Industry: ${industry}`);
      }
    });

    // Add education levels
    ukEducationLevels.forEach(level => {
      if (level.toLowerCase().includes(queryLower)) {
        suggestions.add(`Education: ${level}`);
      }
    });

    // Add counties
    ukCounties.forEach(county => {
      if (county.toLowerCase().includes(queryLower)) {
        suggestions.add(`Location: ${county}`);
      }
    });

    const suggestionsArray = Array.from(suggestions).slice(0, 8);
    setSearchSuggestions(suggestionsArray);
    setShowSearchDropdown(suggestionsArray.length > 0);
  };

  const filterMentors = () => {
    let filtered = mentors;

    if (searchTerm) {
      filtered = filtered.filter(mentor =>
        String(mentor.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.profession || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.pastProfessions || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.degree || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.educationLevel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.county || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.ethnicity || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.religion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(mentor.linkedin || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(mentor.skills) && mentor.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (Array.isArray(mentor.hobbies) && mentor.hobbies.some(hobby => hobby.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (Array.isArray(mentor.industries) && mentor.industries.some(industry => industry.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (Array.isArray(mentor.lookingFor) && mentor.lookingFor.some(item => item.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Apply additional filters
    if (selectedFilter) {
      switch (selectedFilter) {
        case 'Available now':
          filtered = filtered.filter(mentor => {
            const availability = mentorAvailability[mentor.uid];
            return availability?.available || false;
          });
          break;
        case 'Experienced mentors':
          filtered = filtered.filter(mentor => {
            const educationLevel = String(mentor.educationLevel || '');
            return ['Master\'s Degree', 'Doctorate/PhD'].includes(educationLevel) ||
                   (Array.isArray(mentor.pastProfessions) && mentor.pastProfessions.length > 1);
          });
          break;
        case 'Video calls':
          filtered = filtered.filter(mentor => mentor.calCom);
          break;
        case 'In-person':
          filtered = filtered.filter(mentor => String(mentor.county || '').trim() !== '');
          break;
        case 'Free sessions':
          break;
        default:
          break;
      }
    }

    setFilteredMentors(filtered);
  };

  const getFilterCount = (filterType: string) => {
    if (!filterType) return mentors.length;
    
    switch (filterType) {
      case 'Available now':
        return mentors.filter(mentor => {
          const availability = mentorAvailability[mentor.uid];
          return availability?.available || false;
        }).length;
      case 'Experienced mentors':
        return mentors.filter(mentor => {
          const educationLevel = String(mentor.educationLevel || '');
          return ['Master\'s Degree', 'Doctorate/PhD'].includes(educationLevel) ||
                 (Array.isArray(mentor.pastProfessions) && mentor.pastProfessions.length > 1);
        }).length;
      case 'Video calls':
        return mentors.filter(mentor => mentor.calCom).length;
      case 'In-person':
        return mentors.filter(mentor => String(mentor.county || '').trim() !== '').length;
      case 'Free sessions':
        return mentors.length;
      default:
        return 0;
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    generateSearchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const value = suggestion.split(': ')[1] || suggestion;
    setSearchTerm(value);
    setShowSearchDropdown(false);
  };

  useEffect(() => {
    filterMentors();
  }, [mentors, searchTerm, selectedFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return {
    searchTerm,
    selectedFilter,
    setSelectedFilter,
    showSearchDropdown,
    searchSuggestions,
    filteredMentors,
    handleSearchChange,
    handleSuggestionClick,
    getFilterCount
  };
};
