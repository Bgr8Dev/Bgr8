import React, { useState, useEffect } from 'react';
import { 
  FaEnvelope, 
  FaPaperPlane, 
  FaSave, 
  FaFolderOpen, 
  FaTrash, 
  FaEdit, 
  FaCopy,
  FaUsers,
  FaUser,
  FaUserTie,
  FaGraduationCap,
  FaSearch,
  FaPlus,
  FaMinus,
  FaEye,
  FaEyeSlash,
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaLink,
  FaImage,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaQuoteLeft,
  FaCode,
  FaUndo,
  FaRedo,
  FaTimes,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import './MobileAdminEmails.css';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  category: 'announcement' | 'newsletter' | 'notification' | 'invitation' | 'reminder' | 'custom';
}

interface RecipientGroup {
  id: string;
  name: string;
  description: string;
  count: number;
  type: 'all' | 'admins' | 'mentors' | 'mentees' | 'students' | 'custom';
}

interface EmailDraft {
  id?: string;
  subject: string;
  content: string;
  recipients: string[];
  recipientGroups: string[];
  templateId?: string;
  isScheduled: boolean;
  scheduledDate?: Date;
  priority: 'low' | 'normal' | 'high';
  trackOpens: boolean;
  trackClicks: boolean;
}

export function MobileAdminEmails() {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'sent' | 'drafts'>('compose');
  const [currentDraft, setCurrentDraft] = useState<EmailDraft>({
    subject: '',
    content: '',
    recipients: [],
    recipientGroups: [],
    isScheduled: false,
    priority: 'normal',
    trackOpens: true,
    trackClicks: true
  });
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState<Partial<EmailTemplate>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Mock recipient groups
  const recipientGroups: RecipientGroup[] = [
    { id: 'all', name: 'All Users', description: 'All registered users', count: 1247, type: 'all' },
    { id: 'admins', name: 'Administrators', description: 'Admin users only', count: 12, type: 'admins' },
    { id: 'mentors', name: 'Mentors', description: 'Active mentors', count: 156, type: 'mentors' },
    { id: 'mentees', name: 'Mentees', description: 'Students with mentors', count: 892, type: 'mentees' },
    { id: 'students', name: 'Students', description: 'All students', count: 1103, type: 'students' }
  ];

  // Mock templates
  useEffect(() => {
    const mockTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Welcome Email',
        subject: 'Welcome to bgr8!',
        content: '<h2>Welcome to bgr8!</h2><p>We\'re excited to have you join our community...</p>',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        category: 'announcement'
      },
      {
        id: '2',
        name: 'Weekly Newsletter',
        subject: 'Weekly Update - {{week}}',
        content: '<h2>Weekly Newsletter</h2><p>Here\'s what happened this week...</p>',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20'),
        category: 'newsletter'
      },
      {
        id: '3',
        name: 'Mentor Reminder',
        subject: 'Upcoming Session Reminder',
        content: '<h2>Session Reminder</h2><p>Don\'t forget about your upcoming session...</p>',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-18'),
        category: 'reminder'
      }
    ];
    setTemplates(mockTemplates);
  }, []);

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.content) {
      alert('Please fill in all required fields');
      return;
    }

    const newTemplate: EmailTemplate = {
      id: selectedTemplate?.id || Date.now().toString(),
      name: templateForm.name,
      subject: templateForm.subject,
      content: templateForm.content,
      category: templateForm.category || 'custom',
      createdAt: selectedTemplate?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (selectedTemplate) {
      setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? newTemplate : t));
    } else {
      setTemplates(prev => [...prev, newTemplate]);
    }

    setShowTemplateModal(false);
    setTemplateForm({});
    setSelectedTemplate(null);
  };

  const handleLoadTemplate = (template: EmailTemplate) => {
    setCurrentDraft(prev => ({
      ...prev,
      subject: template.subject,
      content: template.content,
      templateId: template.id
    }));
    setActiveTab('compose');
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Draft saved successfully!');
  };

  const handleSendEmail = async () => {
    if (!currentDraft.subject || !currentDraft.content) {
      alert('Please fill in subject and content');
      return;
    }

    if (currentDraft.recipients.length === 0 && currentDraft.recipientGroups.length === 0) {
      alert('Please select recipients');
      return;
    }

    alert('Email sent successfully!');
    setCurrentDraft({
      subject: '',
      content: '',
      recipients: [],
      recipientGroups: [],
      isScheduled: false,
      priority: 'normal',
      trackOpens: true,
      trackClicks: true
    });
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTotalRecipients = () => {
    let total = currentDraft.recipients.length;
    currentDraft.recipientGroups.forEach(groupId => {
      const group = recipientGroups.find(g => g.id === groupId);
      if (group) total += group.count;
    });
    return total;
  };

  return (
    <div className="mobile-admin-emails">
      {/* Header Stats */}
      <div className="emails-stats">
        <div className="stat-card templates">
          <div className="stat-icon">
            <FaFolderOpen />
          </div>
          <div className="stat-content">
            <h4>Templates</h4>
            <p>{templates.length}</p>
          </div>
        </div>
        
        <div className="stat-card recipients">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h4>Total Users</h4>
            <p>{recipientGroups.reduce((sum, group) => sum + group.count, 0)}</p>
          </div>
        </div>
        
        <div className="stat-card current">
          <div className="stat-icon">
            <FaEnvelope />
          </div>
          <div className="stat-content">
            <h4>Selected</h4>
            <p>{getTotalRecipients()}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="emails-tabs">
        <button 
          className={`emails-tab ${activeTab === 'compose' ? 'active' : ''}`}
          onClick={() => setActiveTab('compose')}
        >
          <FaEdit />
          <span>Compose</span>
        </button>
        <button 
          className={`emails-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FaFolderOpen />
          <span>Templates</span>
        </button>
        <button 
          className={`emails-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          <FaPaperPlane />
          <span>Sent</span>
        </button>
        <button 
          className={`emails-tab ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          <FaSave />
          <span>Drafts</span>
        </button>
      </div>

      {/* Content */}
      <div className="emails-content">
        {activeTab === 'compose' && (
          <div className="compose-section">
            {/* Subject */}
            <div className="compose-field">
              <label>Subject</label>
              <input
                type="text"
                placeholder="Email subject..."
                value={currentDraft.subject}
                onChange={(e) => setCurrentDraft(prev => ({ ...prev, subject: e.target.value }))}
                className="subject-input"
              />
            </div>

            {/* Content */}
            <div className="compose-field">
              <label>Content</label>
              <div className="editor-toolbar">
                <div className="toolbar-group">
                  <button className="toolbar-btn" title="Bold"><FaBold /></button>
                  <button className="toolbar-btn" title="Italic"><FaItalic /></button>
                  <button className="toolbar-btn" title="Underline"><FaUnderline /></button>
                </div>
                <div className="toolbar-group">
                  <button className="toolbar-btn" title="List"><FaListUl /></button>
                  <button className="toolbar-btn" title="Link"><FaLink /></button>
                  <button className="toolbar-btn" title="Quote"><FaQuoteLeft /></button>
                </div>
              </div>
              <textarea
                placeholder="Start writing your email..."
                value={currentDraft.content}
                onChange={(e) => setCurrentDraft(prev => ({ ...prev, content: e.target.value }))}
                className="content-editor"
                rows={8}
              />
            </div>

            {/* Recipients */}
            <div className="compose-field">
              <div className="field-header">
                <label>Recipients</label>
                <button 
                  className="toggle-btn"
                  onClick={() => setShowRecipients(!showRecipients)}
                >
                  {showRecipients ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              <div className="recipients-summary">
                <span className="recipients-count">{getTotalRecipients()} recipients selected</span>
              </div>
              
              {showRecipients && (
                <div className="recipients-panel">
                  <div className="recipient-groups">
                    <h4>Groups</h4>
                    {recipientGroups.map(group => (
                      <label key={group.id} className="recipient-group-item">
                        <input
                          type="checkbox"
                          checked={currentDraft.recipientGroups.includes(group.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCurrentDraft(prev => ({
                                ...prev,
                                recipientGroups: [...prev.recipientGroups, group.id]
                              }));
                            } else {
                              setCurrentDraft(prev => ({
                                ...prev,
                                recipientGroups: prev.recipientGroups.filter(id => id !== group.id)
                              }));
                            }
                          }}
                        />
                        <div className="group-info">
                          <span className="group-name">{group.name}</span>
                          <span className="group-count">({group.count})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="compose-field">
              <div className="field-header">
                <label>Settings</label>
                <button 
                  className="toggle-btn"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  {showSettings ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              
              {showSettings && (
                <div className="settings-panel">
                  <div className="setting-group">
                    <label className="setting-label">
                      <input
                        type="checkbox"
                        checked={currentDraft.isScheduled}
                        onChange={(e) => setCurrentDraft(prev => ({ ...prev, isScheduled: e.target.checked }))}
                      />
                      Schedule Email
                    </label>
                    {currentDraft.isScheduled && (
                      <input
                        type="datetime-local"
                        className="datetime-input"
                      />
                    )}
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Priority</label>
                    <select
                      value={currentDraft.priority}
                      onChange={(e) => setCurrentDraft(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="priority-select"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">
                      <input
                        type="checkbox"
                        checked={currentDraft.trackOpens}
                        onChange={(e) => setCurrentDraft(prev => ({ ...prev, trackOpens: e.target.checked }))}
                      />
                      Track Opens
                    </label>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">
                      <input
                        type="checkbox"
                        checked={currentDraft.trackClicks}
                        onChange={(e) => setCurrentDraft(prev => ({ ...prev, trackClicks: e.target.checked }))}
                      />
                      Track Clicks
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="email-preview">
                <h4>Preview</h4>
                <div className="preview-content">
                  <div className="preview-header">
                    <strong>Subject:</strong> {currentDraft.subject || 'No subject'}
                  </div>
                  <div className="preview-body">
                    {currentDraft.content ? (
                      <div dangerouslySetInnerHTML={{ __html: currentDraft.content.replace(/\n/g, '<br>') }} />
                    ) : (
                      <p>No content yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="compose-actions">
              <button 
                className="action-btn preview"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <FaEyeSlash /> : <FaEye />}
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
              <button 
                className="action-btn save"
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                <FaSave />
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button 
                className="action-btn send"
                onClick={handleSendEmail}
              >
                <FaPaperPlane />
                Send Email
              </button>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-section">
            <div className="templates-controls">
              <div className="search-box">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-filter"
              >
                <option value="all">All Categories</option>
                <option value="announcement">Announcements</option>
                <option value="newsletter">Newsletters</option>
                <option value="notification">Notifications</option>
                <option value="invitation">Invitations</option>
                <option value="reminder">Reminders</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <button
              className="create-template-btn"
              onClick={() => {
                setTemplateForm({});
                setSelectedTemplate(null);
                setShowTemplateModal(true);
              }}
            >
              <FaPlus />
              Create Template
            </button>

            <div className="templates-list">
              {filteredTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <div className="template-header">
                    <h4>{template.name}</h4>
                    <div className="template-actions">
                      <button
                        className="template-action-btn"
                        onClick={() => handleLoadTemplate(template)}
                        title="Use Template"
                      >
                        <FaCopy />
                      </button>
                      <button
                        className="template-action-btn"
                        onClick={() => {
                          setTemplateForm(template);
                          setSelectedTemplate(template);
                          setShowTemplateModal(true);
                        }}
                        title="Edit Template"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="template-action-btn delete"
                        title="Delete Template"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="template-content">
                    <div className="template-subject">
                      <strong>Subject:</strong> {template.subject}
                    </div>
                    <div className="template-preview">
                      {template.content.replace(/<[^>]*>/g, '').substring(0, 80)}...
                    </div>
                  </div>
                  <div className="template-footer">
                    <span className="template-category">{template.category}</span>
                    <span className="template-date">
                      {template.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sent' && (
          <div className="sent-section">
            <div className="sent-placeholder">
              <FaPaperPlane className="placeholder-icon" />
              <h3>Sent Emails</h3>
              <p>Your sent emails will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="drafts-section">
            <div className="drafts-placeholder">
              <FaSave className="placeholder-icon" />
              <h3>Draft Emails</h3>
              <p>Your saved drafts will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="template-modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedTemplate ? 'Edit Template' : 'Create Template'}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowTemplateModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Template Name</label>
                <input
                  type="text"
                  value={templateForm.name || ''}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name..."
                />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  value={templateForm.category || 'custom'}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as any }))}
                >
                  <option value="announcement">Announcement</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="notification">Notification</option>
                  <option value="invitation">Invitation</option>
                  <option value="reminder">Reminder</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={templateForm.subject || ''}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject..."
                />
              </div>
              
              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={templateForm.content || ''}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter email content..."
                  rows={8}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setShowTemplateModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn save"
                onClick={handleSaveTemplate}
              >
                {selectedTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
