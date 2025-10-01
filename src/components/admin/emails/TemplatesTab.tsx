import React from 'react';
import { 
  FaSearch, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCopy
} from 'react-icons/fa';
import { EmailTemplate } from '../../../services/emailService';

interface TemplatesTabProps {
  templates: EmailTemplate[];
  searchTerm: string;
  selectedCategory: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCreateTemplate: () => void;
  onEditTemplate: (template: EmailTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onLoadTemplate: (template: EmailTemplate) => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  templates,
  searchTerm,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onLoadTemplate
}) => {
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="email-templates-section">
      <div className="email-templates-header">
        <div className="email-templates-controls">
          <div className="email-search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="email-category-filter"
          >
            <option value="all">All Categories</option>
            <option value="announcement">Announcements</option>
            <option value="newsletter">Newsletters</option>
            <option value="notification">Notifications</option>
            <option value="invitation">Invitations</option>
            <option value="reminder">Reminders</option>
            <option value="custom">Custom</option>
          </select>
          <button
            className="email-create-template-btn"
            onClick={onCreateTemplate}
          >
            <FaPlus />
            Create Template
          </button>
        </div>
      </div>

      <div className="email-templates-grid">
        {filteredTemplates.map(template => (
          <div key={template.id} className="email-template-card">
            <div className="email-template-header">
              <h3>{template.name}</h3>
              <div className="email-template-actions">
                <button
                  className="email-template-action-btn"
                  onClick={() => onLoadTemplate(template)}
                  title="Use Template"
                >
                  <FaCopy />
                </button>
                <button
                  className="email-template-action-btn"
                  onClick={() => onEditTemplate(template)}
                  title="Edit Template"
                >
                  <FaEdit />
                </button>
                <button
                  className="email-template-action-btn email-delete"
                  onClick={() => onDeleteTemplate(template.id)}
                  title="Delete Template"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <div className="email-template-content">
              <div className="email-template-subject">
                <strong>Subject:</strong> {template.subject}
              </div>
              <div className="email-template-preview">
                {template.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
              </div>
            </div>
            <div className="email-template-footer">
              <span className="email-template-category">{template.category}</span>
              <span className="email-template-date">
                Updated {template.updatedAt.toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplatesTab;
