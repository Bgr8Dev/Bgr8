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
  FaSearch,
  FaPlus,
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
  FaRedo
} from 'react-icons/fa';
import '../../styles/adminStyles/AdminEmails.css';

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

const AdminEmails: React.FC = () => {
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
    // Simulate API call
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

    // Simulate sending
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
    <div className="email-admin-emails">
      <div className="email-emails-header">
        <div className="email-emails-header-content">
          <h1>Email Management</h1>
          <p>Compose, manage templates, and send emails to your community</p>
        </div>
        <div className="email-emails-header-stats">
          <div className="email-stat-item">
            <FaEnvelope />
            <span>{templates.length} Templates</span>
          </div>
          <div className="email-stat-item">
            <FaUsers />
            <span>{recipientGroups.reduce((sum, group) => sum + group.count, 0)} Total Recipients</span>
          </div>
        </div>
      </div>

      <div className="email-emails-tabs">
        <button 
          className={`email-emails-tab ${activeTab === 'compose' ? 'active' : ''}`}
          onClick={() => setActiveTab('compose')}
        >
          <FaEdit />
          Compose
        </button>
        <button 
          className={`email-emails-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FaFolderOpen />
          Templates
        </button>
        <button 
          className={`email-emails-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          <FaPaperPlane />
          Sent
        </button>
        <button 
          className={`email-emails-tab ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          <FaSave />
          Drafts
        </button>
      </div>

      <div className="email-emails-content">
        {activeTab === 'compose' && (
          <div className="email-compose-section">
            <div className="email-compose-layout">
              <div className="email-compose-main">
                <div className="email-compose-header">
                  <div className="email-compose-subject">
                    <input
                      type="text"
                      placeholder="Email subject..."
                      value={currentDraft.subject}
                      onChange={(e) => setCurrentDraft(prev => ({ ...prev, subject: e.target.value }))}
                      className="email-subject-input"
                    />
                  </div>
                  <div className="email-compose-actions">
                    <button 
                      className="email-action-btn email-preview"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? <FaEyeSlash /> : <FaEye />}
                      {showPreview ? 'Hide Preview' : 'Preview'}
                    </button>
                    <button 
                      className="email-action-btn email-save"
                      onClick={handleSaveDraft}
                      disabled={isSaving}
                    >
                      <FaSave />
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button 
                      className="email-action-btn email-send"
                      onClick={handleSendEmail}
                    >
                      <FaPaperPlane />
                      Send Email
                    </button>
                  </div>
                </div>

                <div className="email-compose-body">
                  <div className="email-editor-toolbar">
                    <div className="email-toolbar-group">
                      <button className="email-toolbar-btn" title="Bold"><FaBold /></button>
                      <button className="email-toolbar-btn" title="Italic"><FaItalic /></button>
                      <button className="email-toolbar-btn" title="Underline"><FaUnderline /></button>
                    </div>
                    <div className="email-toolbar-group">
                      <button className="email-toolbar-btn" title="Align Left"><FaAlignLeft /></button>
                      <button className="email-toolbar-btn" title="Align Center"><FaAlignCenter /></button>
                      <button className="email-toolbar-btn" title="Align Right"><FaAlignRight /></button>
                    </div>
                    <div className="email-toolbar-group">
                      <button className="email-toolbar-btn" title="Bullet List"><FaListUl /></button>
                      <button className="email-toolbar-btn" title="Numbered List"><FaListOl /></button>
                      <button className="email-toolbar-btn" title="Quote"><FaQuoteLeft /></button>
                    </div>
                    <div className="email-toolbar-group">
                      <button className="email-toolbar-btn" title="Insert Link"><FaLink /></button>
                      <button className="email-toolbar-btn" title="Insert Image"><FaImage /></button>
                      <button className="email-toolbar-btn" title="Code"><FaCode /></button>
                    </div>
                    <div className="email-toolbar-group">
                      <button className="email-toolbar-btn" title="Undo"><FaUndo /></button>
                      <button className="email-toolbar-btn" title="Redo"><FaRedo /></button>
                    </div>
                  </div>

                  <div className="email-editor-content">
                    <textarea
                      placeholder="Start writing your email..."
                      value={currentDraft.content}
                      onChange={(e) => setCurrentDraft(prev => ({ ...prev, content: e.target.value }))}
                      className="email-content-editor"
                    />
                  </div>
                </div>
              </div>

              <div className="email-compose-sidebar">
                <div className="email-sidebar-section">
                  <h3>Recipients</h3>
                  <div className="email-recipients-summary">
                    <span className="email-recipients-count">{getTotalRecipients()} recipients</span>
                  </div>
                  
                  <div className="email-recipient-groups">
                    <h4>Groups</h4>
                    {recipientGroups.map(group => (
                      <label key={group.id} className="email-recipient-group-item">
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
                        <div className="email-group-info">
                          <span className="email-group-name">{group.name}</span>
                          <span className="email-group-count">({group.count})</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="email-individual-recipients">
                    <h4>Individual Recipients</h4>
                    <div className="email-recipient-input">
                      <input
                        type="email"
                        placeholder="Add email address..."
                        className="email-email-input"
                      />
                      <button className="email-add-recipient-btn" title="Add recipient">
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="email-sidebar-section">
                  <h3>Email Settings</h3>
                  
                  <div className="email-setting-group">
                    <label className="email-setting-label">
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
                        className="email-datetime-input"
                      />
                    )}
                  </div>

                  <div className="email-setting-group">
                    <label className="email-setting-label">Priority</label>
                    <select
                      value={currentDraft.priority}
                      onChange={(e) => setCurrentDraft(prev => ({ ...prev, priority: e.target.value as 'low' | 'normal' | 'high' }))}
                      className="email-priority-select"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="email-setting-group">
                    <label className="email-setting-label">
                      <input
                        type="checkbox"
                        checked={currentDraft.trackOpens}
                        onChange={(e) => setCurrentDraft(prev => ({ ...prev, trackOpens: e.target.checked }))}
                      />
                      Track Opens
                    </label>
                  </div>

                  <div className="email-setting-group">
                    <label className="email-setting-label">
                      <input
                        type="checkbox"
                        checked={currentDraft.trackClicks}
                        onChange={(e) => setCurrentDraft(prev => ({ ...prev, trackClicks: e.target.checked }))}
                      />
                      Track Clicks
                    </label>
                  </div>
                </div>

                <div className="email-sidebar-section">
                  <h3>Templates</h3>
                  <div className="email-template-quick-access">
                    {templates.slice(0, 3).map(template => (
                      <button
                        key={template.id}
                        className="email-template-quick-btn"
                        onClick={() => handleLoadTemplate(template)}
                      >
                        <span className="email-template-name">{template.name}</span>
                        <FaCopy />
                      </button>
                    ))}
                    <button
                      className="email-template-quick-btn email-view-all"
                      onClick={() => setActiveTab('templates')}
                    >
                      View All Templates
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showPreview && (
              <div className="email-email-preview">
                <h3>Email Preview</h3>
                <div className="email-preview-content">
                  <div className="email-preview-header">
                    <strong>Subject:</strong> {currentDraft.subject || 'No subject'}
                  </div>
                  <div className="email-preview-body">
                    {currentDraft.content ? (
                      <div dangerouslySetInnerHTML={{ __html: currentDraft.content.replace(/\n/g, '<br>') }} />
                    ) : (
                      <p>No content yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="email-templates-section">
            <div className="email-templates-header">
              <div className="email-templates-controls">
                <div className="email-search-box">
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
                  onClick={() => {
                    setTemplateForm({});
                    setSelectedTemplate(null);
                    setShowTemplateModal(true);
                  }}
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
                        onClick={() => handleLoadTemplate(template)}
                        title="Use Template"
                      >
                        <FaCopy />
                      </button>
                      <button
                        className="email-template-action-btn"
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
                        className="email-template-action-btn email-delete"
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
        )}

        {activeTab === 'sent' && (
          <div className="email-sent-section">
            <div className="email-sent-placeholder">
              <FaPaperPlane className="email-placeholder-icon" />
              <h3>Sent Emails</h3>
              <p>Your sent emails will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="email-drafts-section">
            <div className="email-drafts-placeholder">
              <FaSave className="email-placeholder-icon" />
              <h3>Draft Emails</h3>
              <p>Your saved drafts will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="email-template-modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="email-template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="email-modal-header">
              <h3>{selectedTemplate ? 'Edit Template' : 'Create Template'}</h3>
              <button 
                className="email-close-btn"
                onClick={() => setShowTemplateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="email-modal-content">
              <div className="email-form-group">
                <label>Template Name</label>
                <input
                  type="text"
                  value={templateForm.name || ''}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name..."
                />
              </div>
              
              <div className="email-form-group">
                <label>Category</label>
                <select
                  value={templateForm.category || 'custom'}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as 'announcement' | 'newsletter' | 'notification' | 'invitation' | 'reminder' | 'custom' }))}
                >
                  <option value="announcement">Announcement</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="notification">Notification</option>
                  <option value="invitation">Invitation</option>
                  <option value="reminder">Reminder</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div className="email-form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={templateForm.subject || ''}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter email subject..."
                />
              </div>
              
              <div className="email-form-group">
                <label>Content</label>
                <textarea
                  value={templateForm.content || ''}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter email content..."
                  rows={10}
                />
              </div>
            </div>
            
            <div className="email-modal-actions">
              <button
                className="email-modal-btn email-cancel"
                onClick={() => setShowTemplateModal(false)}
              >
                Cancel
              </button>
              <button
                className="email-modal-btn email-save"
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
};

export default AdminEmails;
