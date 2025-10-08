import React, { useState } from 'react';
import { FaBook, FaDownload, FaExternalLinkAlt, FaSearch, FaFilter, FaPlus, FaFilePdf, FaFileWord, FaFilePowerpoint, FaVideo, FaImage } from 'react-icons/fa';
import BannerWrapper from '../ui/BannerWrapper';
import './ResourcesLibrary.css';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'doc' | 'ppt' | 'video' | 'image' | 'link';
  category: string;
  url: string;
  size?: string;
  uploadDate: string;
  author: string;
}

const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'Mentoring Best Practices Guide',
    description: 'A comprehensive guide to effective mentoring techniques and strategies.',
    type: 'pdf',
    category: 'Guides',
    url: '#',
    size: '2.4 MB',
    uploadDate: '2024-01-15',
    author: 'Admin Team'
  },
  {
    id: '2',
    title: 'Goal Setting Template',
    description: 'Template for setting and tracking mentee goals and objectives.',
    type: 'doc',
    category: 'Templates',
    url: '#',
    size: '156 KB',
    uploadDate: '2024-01-10',
    author: 'Admin Team'
  },
  {
    id: '3',
    title: 'Communication Skills Workshop',
    description: 'Video workshop on improving communication skills for mentors.',
    type: 'video',
    category: 'Workshops',
    url: '#',
    size: '45.2 MB',
    uploadDate: '2024-01-08',
    author: 'Admin Team'
  },
  {
    id: '4',
    title: 'Progress Tracking Spreadsheet',
    description: 'Excel template for tracking mentee progress over time.',
    type: 'ppt',
    category: 'Templates',
    url: '#',
    size: '892 KB',
    uploadDate: '2024-01-05',
    author: 'Admin Team'
  },
  {
    id: '5',
    title: 'Industry Insights Report',
    description: 'Latest industry trends and insights for career development.',
    type: 'pdf',
    category: 'Reports',
    url: '#',
    size: '3.1 MB',
    uploadDate: '2024-01-03',
    author: 'Admin Team'
  }
];

const CATEGORIES = ['All', 'Guides', 'Templates', 'Workshops', 'Reports', 'Tools'];

const ResourcesLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredResources = MOCK_RESOURCES.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FaFilePdf className="file-icon pdf" />;
      case 'doc': return <FaFileWord className="file-icon doc" />;
      case 'ppt': return <FaFilePowerpoint className="file-icon ppt" />;
      case 'video': return <FaVideo className="file-icon video" />;
      case 'image': return <FaImage className="file-icon image" />;
      default: return <FaFilePdf className="file-icon default" />;
    }
  };

  const handleResourceClick = (resource: Resource) => {
    // In a real implementation, this would open/download the resource
    console.log('Opening resource:', resource.title);
    // For now, just show an alert
    alert(`Opening: ${resource.title}\n\nThis feature is coming soon!`);
  };

  return (
    <BannerWrapper sectionId="resources-library" bannerType="element">
      <div className="resources-library-widget">
        <div className="resources-header">
          <div className="resources-title">
            <FaBook className="resources-icon" />
            <h3>Resources Library</h3>
          </div>
          <button 
            className="expand-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse resources" : "Expand resources"}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {isExpanded && (
          <div className="resources-content">
            {/* Search and Filter */}
            <div className="resources-controls">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="category-filter">
                <FaFilter className="filter-icon" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resources List */}
            <div className="resources-list">
              {filteredResources.length === 0 ? (
                <div className="no-resources">
                  <FaBook className="no-resources-icon" />
                  <p>No resources found matching your criteria.</p>
                </div>
              ) : (
                filteredResources.map(resource => (
                  <div key={resource.id} className="resource-item">
                    <div className="resource-icon">
                      {getFileIcon(resource.type)}
                    </div>
                    <div className="resource-info">
                      <h4 className="resource-title">{resource.title}</h4>
                      <p className="resource-description">{resource.description}</p>
                      <div className="resource-meta">
                        <span className="resource-category">{resource.category}</span>
                        <span className="resource-size">{resource.size}</span>
                        <span className="resource-date">{resource.uploadDate}</span>
                      </div>
                    </div>
                    <div className="resource-actions">
                      <button
                        className="resource-download-btn"
                        onClick={() => handleResourceClick(resource)}
                        title="Download resource"
                      >
                        <FaDownload />
                      </button>
                      <button
                        className="resource-preview-btn"
                        onClick={() => handleResourceClick(resource)}
                        title="Preview resource"
                      >
                        <FaExternalLinkAlt />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Resource Button */}
            <div className="add-resource-section">
              <button className="add-resource-btn">
                <FaPlus />
                Add New Resource
              </button>
            </div>
          </div>
        )}
      </div>
    </BannerWrapper>
  );
};

export default ResourcesLibrary;
