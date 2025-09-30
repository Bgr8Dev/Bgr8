import React, { useState, useEffect, useCallback } from 'react';
import { 
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
  FaSpinner,
  FaCheck,
  FaTimes,
  FaChartLine,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRocket,
  FaMousePointer
} from 'react-icons/fa';
import { EmailService, EmailTemplate, EmailDraft, SentEmail, RecipientGroup } from '../../services/emailService';
import { useAuth } from '../../hooks/useAuth';
import RichTextEditor from '../../components/admin/emails/RichTextEditor';
import { emailConfig, validateEmailConfig } from '../../config/emailConfig';
import '../../styles/adminStyles/AdminEmails.css';
import '../../styles/adminStyles/RichTextEditor.css';

// Interfaces are now imported from EmailService

const AdminEmails: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'sent' | 'drafts' | 'analytics'>('compose');
  const [currentDraft, setCurrentDraft] = useState<Partial<EmailDraft>>({
    subject: '',
    content: '',
    recipients: [],
    recipientGroups: [],
    isScheduled: false,
    priority: 'normal',
    trackOpens: true,
    trackClicks: true,
    status: 'draft',
    createdBy: userProfile?.uid || ''
  });
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroup[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState<Partial<EmailTemplate>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [analytics, setAnalytics] = useState({
    totalSent: 0,
    totalOpens: 0,
    totalClicks: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0
  });
  const [emailConfigValid, setEmailConfigValid] = useState(false);
  const [emailConfigErrors, setEmailConfigErrors] = useState<string[]>([]);

  // Initialize email service
  useEffect(() => {
    // Initialize email API service
    EmailService.initializeEmailApi({
      apiBaseUrl: emailConfig.apiBaseUrl,
      apiKey: emailConfig.apiKey
    });

    // Validate email configuration
    const configValidation = validateEmailConfig();
    setEmailConfigValid(configValidation.valid);
    setEmailConfigErrors(configValidation.errors);

    if (!configValidation.valid) {
      showNotification('error', `Email configuration invalid: ${configValidation.errors.join(', ')}`);
    }
  }, []);

  // Load data from Firebase
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [templatesData, draftsData, sentEmailsData, recipientGroupsData, analyticsData] = await Promise.all([
        EmailService.getTemplates(),
        EmailService.getDrafts(),
        EmailService.getSentEmails(),
        EmailService.getRecipientGroups(),
        EmailService.getEmailAnalytics()
      ]);

      setTemplates(templatesData);
      setDrafts(draftsData);
      setSentEmails(sentEmailsData);
      setRecipientGroups(recipientGroupsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('error', 'Failed to load email data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.content) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      
      if (selectedTemplate) {
        // Update existing template
        await EmailService.updateTemplate(selectedTemplate.id, {
          name: templateForm.name,
          subject: templateForm.subject,
          content: templateForm.content,
          category: templateForm.category || 'custom',
          tags: templateForm.tags || [],
          isPublic: templateForm.isPublic || false
        });
        showNotification('success', 'Template updated successfully!');
      } else {
        // Create new template
        await EmailService.saveTemplate({
          name: templateForm.name,
          subject: templateForm.subject,
          content: templateForm.content,
          category: templateForm.category || 'custom',
          createdBy: userProfile?.uid || '',
          isPublic: templateForm.isPublic || false,
          tags: templateForm.tags || []
        });
        showNotification('success', 'Template created successfully!');
      }

      // Reload templates
      const updatedTemplates = await EmailService.getTemplates();
      setTemplates(updatedTemplates);

      setShowTemplateModal(false);
      setTemplateForm({});
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      showNotification('error', 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadTemplate = (template: EmailTemplate) => {
    setCurrentDraft(prev => ({
      ...prev,
      subject: template.subject,
      content: template.content,
      templateId: template.id
    }));
    setActiveTab('compose');
    showNotification('info', `Template "${template.name}" loaded successfully!`);
  };

  const handleSaveDraft = async () => {
    if (!currentDraft.subject || !currentDraft.content) {
      showNotification('error', 'Please fill in subject and content');
      return;
    }

    try {
      setIsSaving(true);
      
      const draftData = {
        subject: currentDraft.subject || '',
        content: currentDraft.content || '',
        recipients: currentDraft.recipients || [],
        recipientGroups: currentDraft.recipientGroups || [],
        templateId: currentDraft.templateId,
        isScheduled: currentDraft.isScheduled || false,
        scheduledDate: currentDraft.scheduledDate,
        priority: currentDraft.priority || 'normal',
        trackOpens: currentDraft.trackOpens || true,
        trackClicks: currentDraft.trackClicks || true,
        status: 'draft' as const,
        createdBy: userProfile?.uid || ''
      };

      await EmailService.saveDraft(draftData);
      
      // Reload drafts
      const updatedDrafts = await EmailService.getDrafts();
      setDrafts(updatedDrafts);
      
      showNotification('success', 'Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      showNotification('error', 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!currentDraft.subject || !currentDraft.content) {
      showNotification('error', 'Please fill in subject and content');
      return;
    }

    if ((currentDraft.recipients?.length || 0) === 0 && (currentDraft.recipientGroups?.length || 0) === 0) {
      showNotification('error', 'Please select recipients');
      return;
    }

    try {
      setIsSending(true);
      
      const draftData = {
        subject: currentDraft.subject || '',
        content: currentDraft.content || '',
        recipients: currentDraft.recipients || [],
        recipientGroups: currentDraft.recipientGroups || [],
        templateId: currentDraft.templateId,
        isScheduled: currentDraft.isScheduled || false,
        scheduledDate: currentDraft.scheduledDate,
        priority: currentDraft.priority || 'normal',
        trackOpens: currentDraft.trackOpens || true,
        trackClicks: currentDraft.trackClicks || true,
        status: 'sent' as const,
        createdBy: userProfile?.uid || ''
      };

      const result = await EmailService.sendEmail(draftData);
      
      if (result.success) {
        showNotification('success', `Email sent successfully! Message ID: ${result.messageId}`);
        
        // Clear current draft
        setCurrentDraft({
          subject: '',
          content: '',
          recipients: [],
          recipientGroups: [],
          isScheduled: false,
          priority: 'normal',
          trackOpens: true,
          trackClicks: true,
          status: 'draft',
          createdBy: userProfile?.uid || ''
        });
        
        // Reload data
        await loadData();
      } else {
        showNotification('error', result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showNotification('error', 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTotalRecipients = () => {
    let total = currentDraft.recipients?.length || 0;
    (currentDraft.recipientGroups || []).forEach(groupId => {
      const group = recipientGroups.find(g => g.id === groupId);
      if (group) total += group.count;
    });
    return total;
  };

  if (isLoading) {
    return (
      <div className="email-admin-emails">
        <div className="email-loading-container">
          <div className="email-loading-spinner">
            <FaSpinner className="email-spinner-icon" />
            <h2>Loading Email Management...</h2>
            <p>Setting up your email workspace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="email-admin-emails">
      {/* Notification */}
      {notification && (
        <div className={`email-notification email-notification-${notification.type}`}>
          <div className="email-notification-content">
            {notification.type === 'success' && <FaCheck />}
            {notification.type === 'error' && <FaTimes />}
            {notification.type === 'info' && <FaInfoCircle />}
            <span>{notification.message}</span>
          </div>
          <button 
            className="email-notification-close"
            onClick={() => setNotification(null)}
            title="Close notification"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="email-emails-header">
        <div className="email-emails-header-content">
          <div className="email-header-title">
            <h1>
              <FaRocket className="email-title-icon" />
              Email Management
            </h1>
            <p>Compose, manage templates, and send emails to your community</p>
            {!emailConfigValid && (
              <div className="email-config-warning">
                <FaExclamationTriangle />
                <span>Email service not configured: {emailConfigErrors.join(', ')}</span>
              </div>
            )}
          </div>
          <div className="email-header-actions">
            <button 
              className="email-refresh-btn"
              onClick={loadData}
              disabled={isLoading}
            >
              <FaSpinner className={isLoading ? 'email-spinning' : ''} />
              Refresh
            </button>
          </div>
        </div>
        <div className="email-emails-header-stats">
          <div className="email-stat-item email-stat-templates">
            <div className="email-stat-icon">
              <FaFolderOpen />
            </div>
            <div className="email-stat-content">
              <span className="email-stat-number">{templates.length}</span>
              <span className="email-stat-label">Templates</span>
            </div>
          </div>
          <div className="email-stat-item email-stat-recipients">
            <div className="email-stat-icon">
              <FaUsers />
            </div>
            <div className="email-stat-content">
              <span className="email-stat-number">{recipientGroups.reduce((sum, group) => sum + group.count, 0)}</span>
              <span className="email-stat-label">Recipients</span>
            </div>
          </div>
          <div className="email-stat-item email-stat-sent">
            <div className="email-stat-icon">
              <FaPaperPlane />
            </div>
            <div className="email-stat-content">
              <span className="email-stat-number">{analytics.totalSent}</span>
              <span className="email-stat-label">Sent</span>
            </div>
          </div>
          <div className="email-stat-item email-stat-opens">
            <div className="email-stat-icon">
              <FaEye />
            </div>
            <div className="email-stat-content">
              <span className="email-stat-number">{analytics.openRate.toFixed(1)}%</span>
              <span className="email-stat-label">Open Rate</span>
            </div>
          </div>
        </div>
      </div>

      <div className="email-emails-tabs">
        <button 
          className={`email-emails-tab ${activeTab === 'compose' ? 'active' : ''}`}
          onClick={() => setActiveTab('compose')}
        >
          <FaEdit />
          <span>Compose</span>
          <div className="email-tab-indicator"></div>
        </button>
        <button 
          className={`email-emails-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <FaFolderOpen />
          <span>Templates</span>
          <div className="email-tab-badge">{templates.length}</div>
          <div className="email-tab-indicator"></div>
        </button>
        <button 
          className={`email-emails-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          <FaPaperPlane />
          <span>Sent</span>
          <div className="email-tab-badge">{sentEmails.length}</div>
          <div className="email-tab-indicator"></div>
        </button>
        <button 
          className={`email-emails-tab ${activeTab === 'drafts' ? 'active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          <FaSave />
          <span>Drafts</span>
          <div className="email-tab-badge">{drafts.length}</div>
          <div className="email-tab-indicator"></div>
        </button>
        <button 
          className={`email-emails-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartLine />
          <span>Analytics</span>
          <div className="email-tab-indicator"></div>
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
                      {isSaving ? <FaSpinner className="email-spinning" /> : <FaSave />}
                      {isSaving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button 
                      className="email-action-btn email-send"
                      onClick={handleSendEmail}
                      disabled={isSending}
                    >
                      {isSending ? <FaSpinner className="email-spinning" /> : <FaPaperPlane />}
                      {isSending ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                </div>

                <div className="email-compose-body">
                  <RichTextEditor
                    content={currentDraft.content || ''}
                    onChange={(content) => setCurrentDraft(prev => ({ ...prev, content }))}
                    placeholder="Start writing your email..."
                    className="email-rich-text-editor"
                    showToolbar={true}
                    showWordCount={true}
                    showCharCount={true}
                    maxLength={10000}
                    allowImages={true}
                    allowLinks={true}
                    allowTables={true}
                    allowCode={true}
                    allowEmojis={true}
                    allowFileUpload={true}
                    onSave={handleSaveDraft}
                    onPreview={() => setShowPreview(!showPreview)}
                    onExport={() => {
                      const blob = new Blob([currentDraft.content || ''], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `email-draft-${Date.now()}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    onImport={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.html,.txt,.rtf';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            setCurrentDraft(prev => ({ ...prev, content }));
                          };
                          reader.readAsText(file);
                        }
                      };
                      input.click();
                    }}
                  />
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
                          checked={(currentDraft.recipientGroups || []).includes(group.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCurrentDraft(prev => ({
                                ...prev,
                                recipientGroups: [...(prev.recipientGroups || []), group.id]
                              }));
                            } else {
                              setCurrentDraft(prev => ({
                                ...prev,
                                recipientGroups: (prev.recipientGroups || []).filter(id => id !== group.id)
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
            <div className="email-drafts-header">
              <h3>Saved Drafts</h3>
              <p>Manage your email drafts</p>
            </div>
            <div className="email-drafts-list">
              {drafts.length === 0 ? (
                <div className="email-drafts-placeholder">
                  <FaSave className="email-placeholder-icon" />
                  <h3>No Drafts Yet</h3>
                  <p>Your saved drafts will appear here</p>
                </div>
              ) : (
                drafts.map(draft => (
                  <div key={draft.id} className="email-draft-card">
                    <div className="email-draft-header">
                      <h4>{draft.subject || 'Untitled Draft'}</h4>
                      <div className="email-draft-actions">
                        <button 
                          className="email-draft-action-btn"
                          onClick={() => {
                            setCurrentDraft(draft);
                            setActiveTab('compose');
                          }}
                          title="Edit Draft"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="email-draft-action-btn email-delete"
                          title="Delete Draft"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="email-draft-content">
                      <p>{draft.content.replace(/<[^>]*>/g, '').substring(0, 100)}...</p>
                    </div>
                    <div className="email-draft-footer">
                      <span className="email-draft-date">
                        Updated {draft.updatedAt.toLocaleDateString()}
                      </span>
                      <span className="email-draft-recipients">
                        {getTotalRecipients()} recipients
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="email-analytics-section">
            <div className="email-analytics-header">
              <h3>Email Analytics</h3>
              <p>Track your email performance and engagement</p>
            </div>
            <div className="email-analytics-grid">
              <div className="email-analytics-card email-analytics-sent">
                <div className="email-analytics-icon">
                  <FaPaperPlane />
                </div>
                <div className="email-analytics-content">
                  <h4>Total Sent</h4>
                  <span className="email-analytics-number">{analytics.totalSent}</span>
                </div>
              </div>
              <div className="email-analytics-card email-analytics-opens">
                <div className="email-analytics-icon">
                  <FaEye />
                </div>
                <div className="email-analytics-content">
                  <h4>Total Opens</h4>
                  <span className="email-analytics-number">{analytics.totalOpens}</span>
                </div>
              </div>
              <div className="email-analytics-card email-analytics-clicks">
                <div className="email-analytics-icon">
                  <FaMousePointer />
                </div>
                <div className="email-analytics-content">
                  <h4>Total Clicks</h4>
                  <span className="email-analytics-number">{analytics.totalClicks}</span>
                </div>
              </div>
              <div className="email-analytics-card email-analytics-open-rate">
                <div className="email-analytics-icon">
                  <FaChartLine />
                </div>
                <div className="email-analytics-content">
                  <h4>Open Rate</h4>
                  <span className="email-analytics-number">{analytics.openRate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="email-analytics-card email-analytics-click-rate">
                <div className="email-analytics-icon">
                  <FaMousePointer />
                </div>
                <div className="email-analytics-content">
                  <h4>Click Rate</h4>
                  <span className="email-analytics-number">{analytics.clickRate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="email-analytics-card email-analytics-bounce-rate">
                <div className="email-analytics-icon">
                  <FaExclamationTriangle />
                </div>
                <div className="email-analytics-content">
                  <h4>Bounce Rate</h4>
                  <span className="email-analytics-number">{analytics.bounceRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="email-analytics-chart">
              <h4>Email Performance Over Time</h4>
              <div className="email-chart-placeholder">
                <FaChartLine className="email-chart-icon" />
                <p>Chart visualization coming soon</p>
              </div>
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
