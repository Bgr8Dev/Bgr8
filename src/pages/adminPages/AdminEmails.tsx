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
  FaMousePointer,
  FaCalendarAlt,
  FaCheckCircle
} from 'react-icons/fa';
import { EmailService, EmailTemplate, EmailDraft, SentEmail, RecipientGroup } from '../../services/emailService';
import { useAuth } from '../../hooks/useAuth';
import RichTextEditor from '../../components/admin/emails/RichTextEditor';
import RecipientSelector from '../../components/admin/emails/RecipientSelector';
import { emailConfig, validateEmailConfig } from '../../config/emailConfig';
import '../../styles/adminStyles/AdminEmails.css';
import '../../styles/adminStyles/RichTextEditor.css';
import '../../components/admin/emails/RecipientSelector.css';

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
  const [individualEmailInput, setIndividualEmailInput] = useState('');
  const [emailValidationError, setEmailValidationError] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkEmailInput, setBulkEmailInput] = useState('');
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);

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

  // Test email server connection
  const testEmailServerConnection = async () => {
    try {
      const result = await EmailService.testEmailServerConnection();
      if (result.success) {
        showNotification('success', 'Email server is running and accessible!');
      } else {
        showNotification('error', `Email server connection failed: ${result.error}`);
      }
    } catch (error) {
      showNotification('error', `Failed to test email server: ${error}`);
    }
  };

  // Test email configuration
  const testEmailConfiguration = async () => {
    try {
      const response = await fetch(`${emailConfig.apiBaseUrl}/api/config-test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${emailConfig.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔧 Email configuration test:', data);
        
        if (data.config.accessTokenTest === 'success') {
          showNotification('success', 'Email configuration is working correctly!');
        } else {
          showNotification('error', `Email configuration issue: ${data.config.accessTokenError || 'Unknown error'}`);
        }
      } else {
        showNotification('error', `Configuration test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Configuration test error:', error);
      showNotification('error', `Failed to test configuration: ${error}`);
    }
  };

  // Test Zoho API setup
  const testZohoSetup = async () => {
    try {
      const response = await fetch(`${emailConfig.apiBaseUrl}/api/zoho-test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${emailConfig.apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Zoho API test:', data);
        
        if (data.success) {
          showNotification('success', `Zoho API is working! ${data.message}`);
          console.log('📋 Next steps:', data.nextSteps);
        } else {
          showNotification('error', `Zoho API issue: ${data.message}`);
          console.log('📋 Next steps:', data.nextSteps);
        }
      } else {
        showNotification('error', `Zoho test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Zoho test error:', error);
      showNotification('error', `Failed to test Zoho: ${error}`);
    }
  };

  // Test email sending with selected recipient
  const testEmailSending = async () => {
    try {
      // Get the first recipient from the current draft, or use a default
      let testRecipients = currentDraft.recipients || [];
      
      if (testRecipients.length === 0) {
        // If no recipients selected, try to get from saved recipients
        try {
          const savedRecipients = await EmailService.getRecipients();
          if (savedRecipients.length > 0) {
            testRecipients = [savedRecipients[0].email];
            showNotification('info', `Using first saved recipient: ${savedRecipients[0].email}`);
          } else {
            showNotification('error', 'No recipients available. Please add recipients first or create test recipients.');
            return;
          }
        } catch {
          showNotification('error', 'No recipients available. Please add recipients first or create test recipients.');
          return;
        }
      }

      const testDraft = {
        subject: 'Test Email from Bgr8 Admin Panel',
        content: '<p>This is a test email from the Bgr8 admin panel to verify email functionality.</p><p>If you received this email, the email system is working correctly!</p>',
        recipients: testRecipients,
        recipientGroups: [],
        templateId: undefined,
        isScheduled: false,
        priority: 'normal' as const,
        trackOpens: true,
        trackClicks: true,
        status: 'sent' as const,
        createdBy: userProfile?.uid || ''
      };

      console.log('🧪 Testing email with draft:', testDraft);
      const result = await EmailService.sendEmail(testDraft);
      
      if (result.success) {
        showNotification('success', `Test email sent successfully to ${testRecipients.join(', ')}! Message ID: ${result.messageId}`);
      } else {
        showNotification('error', `Test email failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test email error:', error);
      showNotification('error', `Test email failed: ${error}`);
    }
  };

  // Create test recipients for testing
  const createTestRecipients = async () => {
    try {
      const testRecipients = [
        {
          email: 'test1@example.com',
          name: 'Test User 1',
          firstName: 'Test',
          lastName: 'User 1',
          tags: ['test'],
          groups: [],
          isActive: true,
          isVerified: true,
          createdBy: userProfile?.uid || '',
          notes: 'Test recipient 1'
        },
        {
          email: 'test2@example.com',
          name: 'Test User 2',
          firstName: 'Test',
          lastName: 'User 2',
          tags: ['test'],
          groups: [],
          isActive: true,
          isVerified: true,
          createdBy: userProfile?.uid || '',
          notes: 'Test recipient 2'
        }
      ];

      for (const recipient of testRecipients) {
        await EmailService.saveRecipient(recipient);
      }

      showNotification('success', 'Test recipients created successfully!');
    } catch (error) {
      console.error('Error creating test recipients:', error);
      showNotification('error', 'Failed to create test recipients');
    }
  };

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

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await EmailService.deleteTemplate(templateId);
        showNotification('success', 'Template deleted successfully!');
        
        // Reload templates
        const updatedTemplates = await EmailService.getTemplates();
        setTemplates(updatedTemplates);
      } catch (error) {
        console.error('Error deleting template:', error);
        showNotification('error', 'Failed to delete template');
      }
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      content: template.content,
      category: template.category,
      tags: template.tags || [],
      isPublic: template.isPublic || false
    });
    setSelectedTemplate(template);
    setShowTemplateModal(true);
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

  const handleDeleteDraft = async (draftId: string) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        await EmailService.deleteDraft(draftId);
        showNotification('success', 'Draft deleted successfully!');
        
        // Reload drafts
        const updatedDrafts = await EmailService.getDrafts();
        setDrafts(updatedDrafts);
      } catch (error) {
        console.error('Error deleting draft:', error);
        showNotification('error', 'Failed to delete draft');
      }
    }
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

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Add individual recipient
  const handleAddIndividualRecipient = () => {
    const email = individualEmailInput.trim();
    
    if (!email) {
      setEmailValidationError('Please enter an email address');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailValidationError('Please enter a valid email address');
      return;
    }

    if (currentDraft.recipients?.includes(email)) {
      setEmailValidationError('This email is already added');
      return;
    }

    setCurrentDraft(prev => ({
      ...prev,
      recipients: [...(prev.recipients || []), email]
    }));

    setIndividualEmailInput('');
    setEmailValidationError('');
    showNotification('success', 'Recipient added successfully');
  };

  // Remove individual recipient
  const handleRemoveIndividualRecipient = (emailToRemove: string) => {
    setCurrentDraft(prev => ({
      ...prev,
      recipients: (prev.recipients || []).filter(email => email !== emailToRemove)
    }));
    showNotification('info', 'Recipient removed');
  };

  // Handle Enter key in email input
  const handleEmailInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIndividualRecipient();
    }
  };

  // Clear all individual recipients
  const handleClearIndividualRecipients = () => {
    setCurrentDraft(prev => ({
      ...prev,
      recipients: []
    }));
    showNotification('info', 'All individual recipients cleared');
  };


  // Clear all recipients (both individual and groups)
  const handleClearAllRecipients = () => {
    setCurrentDraft(prev => ({
      ...prev,
      recipients: [],
      recipientGroups: []
    }));
    showNotification('info', 'All recipients cleared');
  };

  // Handle recipient selection from saved recipients
  const handleRecipientSelection = async (selectedRecipientIds: string[]) => {
    try {
      console.log('🔍 Selected recipient IDs:', selectedRecipientIds);
      
      if (selectedRecipientIds.length === 0) {
        console.log('⚠️ No recipients selected');
        return;
      }
      
      // Convert recipient IDs to emails by fetching recipient data
      const selectedEmails: string[] = [];
      
      for (const recipientId of selectedRecipientIds) {
        console.log('🔍 Fetching recipient:', recipientId);
        const recipient = await EmailService.getRecipient(recipientId);
        console.log('📧 Recipient data:', recipient);
        if (recipient && recipient.email) {
          selectedEmails.push(recipient.email);
        } else {
          console.warn('⚠️ Recipient not found or missing email:', recipientId, recipient);
        }
      }
      
      console.log('✅ Final selected emails:', selectedEmails);
      
      if (selectedEmails.length > 0) {
        setCurrentDraft(prev => ({
          ...prev,
          recipients: [...(prev.recipients || []), ...selectedEmails]
        }));
        
        setShowRecipientSelector(false);
        showNotification('success', `${selectedEmails.length} recipients added`);
      } else {
        showNotification('error', 'No valid recipients found');
      }
    } catch (error) {
      console.error('Error fetching recipient emails:', error);
      showNotification('error', 'Failed to load recipient emails');
    }
  };

  // Handle bulk email import
  const handleBulkImport = () => {
    const emails = bulkEmailInput
      .split(/[,\n;]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      setEmailValidationError('Please enter at least one email address');
      return;
    }

    const validEmails: string[] = [];
    const invalidEmails: string[] = [];

    emails.forEach(email => {
      if (isValidEmail(email)) {
        if (!currentDraft.recipients?.includes(email)) {
          validEmails.push(email);
        }
      } else {
        invalidEmails.push(email);
      }
    });

    if (validEmails.length > 0) {
      setCurrentDraft(prev => ({
        ...prev,
        recipients: [...(prev.recipients || []), ...validEmails]
      }));
      showNotification('success', `${validEmails.length} recipients added successfully`);
    }

    if (invalidEmails.length > 0) {
      setEmailValidationError(`Invalid emails: ${invalidEmails.join(', ')}`);
    } else {
      setEmailValidationError('');
    }

    setBulkEmailInput('');
    setShowBulkImport(false);
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
              onClick={testEmailServerConnection}
              title="Test email server connection"
            >
              <FaInfoCircle />
              Test Server
            </button>
            <button 
              className="email-refresh-btn"
              onClick={testEmailConfiguration}
              title="Test email configuration and Zoho setup"
            >
              <FaExclamationTriangle />
              Test Config
            </button>
            <button 
              className="email-refresh-btn"
              onClick={testZohoSetup}
              title="Test Zoho API setup and permissions"
            >
              <FaRocket />
              Test Zoho
            </button>
            <button 
              className="email-refresh-btn"
              onClick={testEmailSending}
              title={`Test email sending to ${currentDraft.recipients?.length ? currentDraft.recipients.join(', ') : 'first available recipient'}`}
            >
              <FaPaperPlane />
              Test Email {currentDraft.recipients?.length ? `(${currentDraft.recipients.length})` : ''}
            </button>
            <button 
              className="email-refresh-btn"
              onClick={createTestRecipients}
              title="Create test recipients for testing"
            >
              <FaUsers />
              Create Test Recipients
            </button>
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
                    {getTotalRecipients() > 0 && (
                      <button
                        onClick={handleClearAllRecipients}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          marginLeft: '0.5rem',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        }}
                        title="Clear all recipients"
                      >
                        Clear All
                      </button>
                    )}
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
                        value={individualEmailInput}
                        onChange={(e) => {
                          setIndividualEmailInput(e.target.value);
                          setEmailValidationError('');
                        }}
                        onKeyPress={handleEmailInputKeyPress}
                      />
                      <button 
                        className="email-add-recipient-btn" 
                        title="Add recipient"
                        onClick={handleAddIndividualRecipient}
                      >
                        <FaPlus />
                      </button>
                    </div>

                    {/* Select from Saved Recipients */}
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        onClick={() => setShowRecipientSelector(true)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: '#10b981',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                        }}
                        title="Select from saved recipients"
                      >
                        <FaUsers />
                        Select from Saved Recipients
                      </button>
                    </div>

                    {/* Bulk Import Toggle */}
                    <div style={{ marginTop: '0.75rem' }}>
                      <button
                        onClick={() => setShowBulkImport(!showBulkImport)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#3b82f6',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                        }}
                        title="Bulk import emails"
                      >
                        <FaPlus />
                        {showBulkImport ? 'Hide Bulk Import' : 'Bulk Import'}
                      </button>
                    </div>

                    {/* Bulk Import Textarea */}
                    {showBulkImport && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <label style={{ 
                          color: '#ffffff', 
                          fontSize: '0.8rem', 
                          fontWeight: '600',
                          marginBottom: '0.5rem',
                          display: 'block'
                        }}>
                          Paste emails (comma, semicolon, or line separated):
                        </label>
                        <textarea
                          value={bulkEmailInput}
                          onChange={(e) => setBulkEmailInput(e.target.value)}
                          placeholder="email1@example.com, email2@example.com&#10;email3@example.com&#10;email4@example.com"
                          style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            fontSize: '0.8rem',
                            minHeight: '80px',
                            resize: 'vertical',
                            fontFamily: 'monospace'
                          }}
                        />
                        <div style={{ 
                          display: 'flex', 
                          gap: '0.5rem', 
                          marginTop: '0.5rem' 
                        }}>
                          <button
                            onClick={handleBulkImport}
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                              border: 'none',
                              color: '#ffffff',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            Import Emails
                          </button>
                          <button
                            onClick={() => {
                              setShowBulkImport(false);
                              setBulkEmailInput('');
                              setEmailValidationError('');
                            }}
                            style={{
                              background: 'rgba(107, 114, 128, 0.2)',
                              border: '1px solid rgba(107, 114, 128, 0.3)',
                              color: '#9ca3af',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {emailValidationError && (
                      <div className="email-validation-error" style={{ 
                        color: '#ef4444', 
                        fontSize: '0.8rem', 
                        marginTop: '0.5rem' 
                      }}>
                        {emailValidationError}
                      </div>
                    )}

                    {/* Display individual recipients */}
                    {currentDraft.recipients && currentDraft.recipients.length > 0 && (
                      <div className="email-individual-recipients-list" style={{ marginTop: '1rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '0.5rem'
                        }}>
                          <h5 style={{ 
                            color: '#ffffff', 
                            fontSize: '0.9rem', 
                            margin: 0,
                            fontWeight: '600'
                          }}>
                            Added Recipients ({currentDraft.recipients.length})
                          </h5>
                          <button
                            onClick={handleClearIndividualRecipients}
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                            }}
                            title="Clear all individual recipients"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="email-recipients-tags">
                          {currentDraft.recipients.map((email, index) => (
                            <div 
                              key={index} 
                              className="email-recipient-tag"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                background: 'rgba(59, 130, 246, 0.2)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '8px',
                                margin: '0.25rem',
                                fontSize: '0.8rem',
                                color: '#ffffff'
                              }}
                            >
                              <span>{email}</span>
                              <button
                                onClick={() => handleRemoveIndividualRecipient(email)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '0.25rem',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Remove recipient"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                        onClick={() => handleEditTemplate(template)}
                        title="Edit Template"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="email-template-action-btn email-delete"
                        onClick={() => handleDeleteTemplate(template.id)}
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
            <div className="email-sent-header">
              <h3>Sent Emails</h3>
              <p>View and manage your sent email campaigns</p>
            </div>
            
            {sentEmails.length === 0 ? (
              <div className="email-sent-placeholder">
                <FaPaperPlane className="email-placeholder-icon" />
                <h3>No Sent Emails Yet</h3>
                <p>Your sent emails will appear here once you start sending campaigns</p>
              </div>
            ) : (
              <div className="email-sent-list">
                {sentEmails.map(email => (
                  <div key={email.id} className="email-sent-card">
                    <div className="email-sent-header-card">
                      <h4>{email.subject || 'No Subject'}</h4>
                      <div className="email-sent-actions">
                        <button 
                          className="email-sent-action-btn"
                          onClick={() => {
                            setCurrentDraft({
                              subject: email.subject,
                              content: email.content,
                              recipients: email.recipients || [],
                              recipientGroups: email.recipientGroups || [],
                              templateId: email.templateId,
                              isScheduled: false,
                              priority: email.priority || 'normal',
                              trackOpens: email.trackOpens || true,
                              trackClicks: email.trackClicks || true,
                              status: 'draft',
                              createdBy: userProfile?.uid || ''
                            });
                            setActiveTab('compose');
                          }}
                          title="Resend Email"
                        >
                          <FaCopy />
                        </button>
                        <button 
                          className="email-sent-action-btn"
                          onClick={() => {
                            const previewWindow = window.open('', '_blank', 'width=800,height=600');
                            if (previewWindow) {
                              previewWindow.document.write(`
                                <html>
                                  <head><title>Email Preview: ${email.subject}</title></head>
                                  <body style="font-family: Arial, sans-serif; padding: 20px;">
                                    <h2>${email.subject}</h2>
                                    <div>${email.content}</div>
                                  </body>
                                </html>
                              `);
                            }
                          }}
                          title="Preview Email"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </div>
                    
                    <div className="email-sent-content">
                      <div className="email-sent-meta">
                        <span className="email-sent-recipients">
                          <FaUsers /> {email.recipients?.length || 0} recipients
                        </span>
                        <span className="email-sent-date">
                          <FaCalendarAlt /> {email.sentAt?.toLocaleDateString() || 'Unknown date'}
                        </span>
                        <span className="email-sent-status">
                          <FaCheckCircle /> {email.status || 'sent'}
                        </span>
                      </div>
                      
                      <div className="email-sent-preview">
                        {email.content ? (
                          <div dangerouslySetInnerHTML={{ 
                            __html: email.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' 
                          }} />
                        ) : (
                          <p>No content preview available</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                          className="email-draft-action-btn"
                          onClick={() => {
                            const previewWindow = window.open('', '_blank', 'width=800,height=600');
                            if (previewWindow) {
                              previewWindow.document.write(`
                                <html>
                                  <head><title>Draft Preview: ${draft.subject}</title></head>
                                  <body style="font-family: Arial, sans-serif; padding: 20px;">
                                    <h2>${draft.subject}</h2>
                                    <div>${draft.content}</div>
                                  </body>
                                </html>
                              `);
                            }
                          }}
                          title="Preview Draft"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="email-draft-action-btn email-delete"
                          onClick={() => handleDeleteDraft(draft.id)}
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
                        Updated {draft.updatedAt?.toLocaleDateString() || 'Unknown date'}
                      </span>
                      <span className="email-draft-recipients">
                        {(draft.recipients?.length || 0) + (draft.recipientGroups?.length || 0)} recipients
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
              
              <div className="email-form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={templateForm.tags?.join(', ') || ''}
                  onChange={(e) => setTemplateForm(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) 
                  }))}
                  placeholder="e.g., newsletter, announcement, welcome"
                />
              </div>
              
              <div className="email-form-group">
                <label className="email-setting-label">
                  <input
                    type="checkbox"
                    checked={templateForm.isPublic || false}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  />
                  Make this template public (visible to other admins)
                </label>
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

      {/* Recipient Selector Modal */}
      {showRecipientSelector && (
        <RecipientSelector
          selectedRecipients={[]} // Start with empty selection
          onRecipientsChange={handleRecipientSelection}
          onClose={() => setShowRecipientSelector(false)}
        />
      )}
    </div>
  );
};

export default AdminEmails;
