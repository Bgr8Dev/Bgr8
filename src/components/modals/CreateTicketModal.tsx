import React, { useState } from 'react';
import { FaPlus, FaTimes, FaTag } from 'react-icons/fa';
import { FeedbackCategory, FeedbackPriority } from '../../types/feedback';
import './CreateTicketModal.css';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketData: CreateTicketData) => void;
}

interface CreateTicketData {
  title: string;
  description: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  tags: string[];
  attachments: File[];
  urlToPage?: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  screenResolution?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  severity: 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker';
  environment: 'development' | 'staging' | 'production';
  testCaseId?: string;
  regression: boolean;
  workaround?: string;
}

interface FormData extends CreateTicketData {
  tagInput: string;
}

const CATEGORY_OPTIONS: FeedbackCategory[] = ['bug', 'feature_request', 'ui_issue', 'performance', 'security', 'accessibility', 'other'];
const PRIORITY_OPTIONS: FeedbackPriority[] = ['low', 'medium', 'high', 'critical'];

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: 'bug',
    priority: 'medium',
    tags: [],
    tagInput: '',
    attachments: [],
    urlToPage: '',
    browser: '',
    browserVersion: '',
    operatingSystem: '',
    deviceType: 'desktop',
    screenResolution: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: '',
    severity: 'minor',
    environment: 'production',
    testCaseId: '',
    regression: false,
    workaround: ''
  });

  const handleAddTag = () => {
    const tag = formData.tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, index) => index !== indexToRemove)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    const { tagInput, ...ticketData } = formData;
    onSubmit(ticketData);
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      category: 'bug',
      priority: 'medium',
      tags: [],
      tagInput: '',
      attachments: [],
      urlToPage: '',
      browser: '',
      browserVersion: '',
      operatingSystem: '',
      deviceType: 'desktop',
      screenResolution: '',
      stepsToReproduce: '',
      expectedBehavior: '',
      actualBehavior: '',
      severity: 'minor',
      environment: 'production',
      testCaseId: '',
      regression: false,
      workaround: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Ticket</h3>
          <button 
            className="modal-close"
            onClick={onClose}
            title="Close modal"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="ticket-title">Title *</label>
            <input
              id="ticket-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ticket-description">Description *</label>
            <textarea
              id="ticket-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the issue or feature request"
              className="form-textarea"
              rows={4}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticket-category">Category</label>
              <select
                id="ticket-category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as FeedbackCategory }))}
                className="form-select"
              >
                {CATEGORY_OPTIONS.map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="ticket-priority">Priority</label>
              <select
                id="ticket-priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as FeedbackPriority }))}
                className="form-select"
              >
                {PRIORITY_OPTIONS.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="ticket-tags">Tags</label>
            <div className="tag-input-container">
              <input
                id="ticket-tags"
                type="text"
                value={formData.tagInput}
                onChange={(e) => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add a tag and press Enter"
                className="form-input"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="tag-add-btn"
                title="Add tag"
                aria-label="Add tag"
              >
                <FaPlus />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="tag-list">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag">
                    <FaTag /> {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                      title="Remove tag"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <FaTimes />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ticket-attachments">Attachments</label>
            <div className="file-input-container">
              <input
                id="ticket-attachments"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="file-input"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
              />
              <label htmlFor="ticket-attachments" className="file-input-label">
                <FaPlus /> Choose Files
              </label>
              <span className="file-input-hint">
                Images, videos, documents (max 10MB each)
              </span>
            </div>
            {formData.attachments.length > 0 && (
              <div className="file-list">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="file-remove"
                      title="Remove file"
                      aria-label={`Remove ${file.name}`}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Testing-Specific Fields */}
          <div className="form-section-divider">
            <h4>Testing Information</h4>
          </div>

          <div className="form-group">
            <label htmlFor="ticket-url">URL to Page</label>
            <input
              id="ticket-url"
              type="url"
              value={formData.urlToPage}
              onChange={(e) => setFormData(prev => ({ ...prev, urlToPage: e.target.value }))}
              placeholder="https://example.com/page"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticket-browser">Browser</label>
              <select
                id="ticket-browser"
                value={formData.browser}
                onChange={(e) => setFormData(prev => ({ ...prev, browser: e.target.value }))}
                className="form-select"
              >
                <option value="">Select Browser</option>
                <option value="Chrome">Chrome</option>
                <option value="Firefox">Firefox</option>
                <option value="Safari">Safari</option>
                <option value="Edge">Edge</option>
                <option value="Opera">Opera</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="ticket-browser-version">Browser Version</label>
              <input
                id="ticket-browser-version"
                type="text"
                value={formData.browserVersion}
                onChange={(e) => setFormData(prev => ({ ...prev, browserVersion: e.target.value }))}
                placeholder="e.g., 120.0.6099.109"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticket-os">Operating System</label>
              <select
                id="ticket-os"
                value={formData.operatingSystem}
                onChange={(e) => setFormData(prev => ({ ...prev, operatingSystem: e.target.value }))}
                className="form-select"
              >
                <option value="">Select OS</option>
                <option value="Windows 11">Windows 11</option>
                <option value="Windows 10">Windows 10</option>
                <option value="macOS">macOS</option>
                <option value="Linux">Linux</option>
                <option value="iOS">iOS</option>
                <option value="Android">Android</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="ticket-device">Device Type</label>
              <select
                id="ticket-device"
                value={formData.deviceType}
                onChange={(e) => setFormData(prev => ({ ...prev, deviceType: e.target.value as 'desktop' | 'mobile' | 'tablet' }))}
                className="form-select"
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ticket-resolution">Screen Resolution</label>
            <input
              id="ticket-resolution"
              type="text"
              value={formData.screenResolution}
              onChange={(e) => setFormData(prev => ({ ...prev, screenResolution: e.target.value }))}
              placeholder="e.g., 1920x1080"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ticket-steps">Steps to Reproduce</label>
            <textarea
              id="ticket-steps"
              value={formData.stepsToReproduce}
              onChange={(e) => setFormData(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
              placeholder="1. Go to the page...&#10;2. Click on the button...&#10;3. Observe the issue..."
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ticket-expected">Expected Behavior</label>
            <textarea
              id="ticket-expected"
              value={formData.expectedBehavior}
              onChange={(e) => setFormData(prev => ({ ...prev, expectedBehavior: e.target.value }))}
              placeholder="What should happen when following the steps?"
              className="form-textarea"
              rows={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ticket-actual">Actual Behavior</label>
            <textarea
              id="ticket-actual"
              value={formData.actualBehavior}
              onChange={(e) => setFormData(prev => ({ ...prev, actualBehavior: e.target.value }))}
              placeholder="What actually happens instead?"
              className="form-textarea"
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticket-severity">Severity</label>
              <select
                id="ticket-severity"
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as 'cosmetic' | 'minor' | 'major' | 'critical' | 'blocker' }))}
                className="form-select"
              >
                <option value="cosmetic">Cosmetic</option>
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
                <option value="blocker">Blocker</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="ticket-environment">Environment</label>
              <select
                id="ticket-environment"
                value={formData.environment}
                onChange={(e) => setFormData(prev => ({ ...prev, environment: e.target.value as 'development' | 'staging' | 'production' }))}
                className="form-select"
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ticket-testcase">Test Case ID</label>
            <input
              id="ticket-testcase"
              type="text"
              value={formData.testCaseId}
              onChange={(e) => setFormData(prev => ({ ...prev, testCaseId: e.target.value }))}
              placeholder="e.g., TC-001, Test-123"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.regression}
                onChange={(e) => setFormData(prev => ({ ...prev, regression: e.target.checked }))}
                className="checkbox-input"
              />
              <span className="checkbox-text">This is a regression bug</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="ticket-workaround">Workaround</label>
            <textarea
              id="ticket-workaround"
              value={formData.workaround}
              onChange={(e) => setFormData(prev => ({ ...prev, workaround: e.target.value }))}
              placeholder="Any temporary workaround or solution?"
              className="form-textarea"
              rows={2}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
          >
            <FaPlus /> Create Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
