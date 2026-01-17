import React, { useState, useEffect, useCallback } from 'react';
import { FaSpinner, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { EmailService, EmailTemplate, EmailDraft, SentEmail, RecipientGroup } from '../../services/emailService';
import { EmailApiService } from '../../services/emailApiService';
import { useAuth } from '../../hooks/useAuth';
import RecipientSelector from '../../components/admin/emails/RecipientSelector';
import { emailConfig, validateEmailConfig } from '../../config/emailConfig';
import BannerWrapper from '../../components/ui/BannerWrapper';
import { loggers } from '../../utils/logger';

// Import the new components
import EmailHeader from '../../components/admin/emails/EmailHeader';
import EmailTabs from '../../components/admin/emails/EmailTabs';
import ComposeTab from '../../components/admin/emails/ComposeTab';
import SentTab from '../../components/admin/emails/SentTab';
import DraftsTab from '../../components/admin/emails/DraftsTab';
import AnalyticsTab from '../../components/admin/emails/AnalyticsTab';
import DeveloperTab from '../../components/admin/emails/DeveloperTab';
import EmailUseCasesTab from '../../components/admin/emails/EmailUseCasesTab';
import EmailTemplateManager from '../../components/admin/emails/EmailTemplateManager';
import TemplateModal from '../../components/admin/emails/TemplateModal';

// Import styles
import '../../styles/adminStyles/AdminEmails.css';
import '../../styles/adminStyles/RichTextEditor.css';
import '../../components/admin/emails/RecipientSelector.css';

const AdminEmails: React.FC = () => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'sent' | 'drafts' | 'analytics' | 'use-cases' | 'developer'>('compose');
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
  
  // Testing status states
  const [testStatuses, setTestStatuses] = useState({
    server: { status: 'idle' as 'idle' | 'testing' | 'success' | 'error', message: '', timestamp: null as Date | null },
    config: { status: 'idle' as 'idle' | 'testing' | 'success' | 'error', message: '', timestamp: null as Date | null },
    zoho: { status: 'idle' as 'idle' | 'testing' | 'success' | 'error', message: '', timestamp: null as Date | null },
    email: { status: 'idle' as 'idle' | 'testing' | 'success' | 'error', message: '', timestamp: null as Date | null }
  });

  // Initialize email service
  useEffect(() => {
    EmailService.initializeEmailApi({
      apiBaseUrl: emailConfig.apiBaseUrl
    });

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

  // Update test status helper
  const updateTestStatus = (testType: keyof typeof testStatuses, status: 'idle' | 'testing' | 'success' | 'error', message: string = '') => {
    setTestStatuses(prev => ({
      ...prev,
      [testType]: {
        status,
        message,
        timestamp: new Date()
      }
    }));
  };

  // Test functions
  const testEmailServerConnection = async () => {
    try {
      updateTestStatus('server', 'testing', 'Testing server connection...');
      const result = await EmailService.testEmailServerConnection();
      if (result.success) {
        updateTestStatus('server', 'success', 'Server is running and accessible!');
        showNotification('success', 'Email server is running and accessible!');
      } else {
        updateTestStatus('server', 'error', `Connection failed: ${result.error}`);
        showNotification('error', `Email server connection failed: ${result.error}`);
      }
    } catch (error) {
      updateTestStatus('server', 'error', `Test failed: ${error}`);
      showNotification('error', `Failed to test email server: ${error}`);
    }
  };

  const testEmailConfiguration = async () => {
    try {
      updateTestStatus('config', 'testing', 'Testing email configuration...');
      const response = await EmailApiService.fetchWithAuth('/api/config-test', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.config.accessTokenTest === 'success') {
          updateTestStatus('config', 'success', 'Configuration is working correctly!');
          showNotification('success', 'Email configuration is working correctly!');
        } else {
          updateTestStatus('config', 'error', `Config issue: ${data.config.accessTokenError || 'Unknown error'}`);
          showNotification('error', `Email configuration issue: ${data.config.accessTokenError || 'Unknown error'}`);
        }
      } else {
        updateTestStatus('config', 'error', `Test failed: ${response.status} ${response.statusText}`);
        showNotification('error', `Configuration test failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      updateTestStatus('config', 'error', `Test failed: ${error}`);
      showNotification('error', `Failed to test configuration: ${error}`);
    }
  };

  const testZohoSetup = async () => {
    try {
      updateTestStatus('zoho', 'testing', 'Testing Zoho API setup...');
      loggers.email.log('🔍 Testing Zoho API setup...');
      
      const response = await EmailApiService.fetchWithAuth('/api/zoho-test', {
        method: 'GET',
      });

      loggers.email.log('📡 Zoho test response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        loggers.email.log('📦 Zoho test response data:', data);
        
        if (data.success) {
          updateTestStatus('zoho', 'success', 'Zoho API is working!');
          showNotification('success', `Zoho API is working! ${data.message}`);
        } else {
          // Parse error details if available
          let parsedError = null;
          let errorCode = null;
          
          if (data.error) {
            try {
              if (typeof data.error === 'string') {
                parsedError = JSON.parse(data.error);
              } else {
                parsedError = data.error;
              }
              
              if (parsedError?.data?.errorCode) {
                errorCode = parsedError.data.errorCode;
              }
            } catch {
              // Error is not JSON, keep as string
            }
          }
          
          // Build detailed error message
          let errorMessage = data.message || 'Zoho API access failed';
          
          if (errorCode) {
            errorMessage += ` (Error Code: ${errorCode})`;
          }
          
          // Include parsed error details in logs
          loggers.email.error('❌ Zoho API test failed:', {
            message: data.message,
            errorCode: errorCode,
            error: data.error,
            parsedError: parsedError,
            status: data.status,
            statusText: data.statusText,
            nextSteps: data.nextSteps
          });
          
          // Log next steps prominently
          if (data.nextSteps && Array.isArray(data.nextSteps) && data.nextSteps.length > 0) {
            loggers.email.warn('📋 Zoho API - Next Steps to Fix:');
            data.nextSteps.forEach((step: string) => {
              loggers.email.warn(`   ${step}`);
            });
            
            // Build a more detailed notification message with next steps
            const stepsSummary = data.nextSteps.slice(0, 2).join(' | ');
            errorMessage += ` - ${stepsSummary}`;
          }
          
          updateTestStatus('zoho', 'error', `Zoho API issue: ${data.message}${errorCode ? ` (${errorCode})` : ''}`);
          showNotification('error', errorMessage);
        }
      } else {
        // Try to parse error response
        let errorDetails = `${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          loggers.email.error('❌ Zoho test HTTP error:', errorData);
          if (errorData.error) {
            errorDetails = errorData.error;
          } else if (errorData.message) {
            errorDetails = errorData.message;
          }
        } catch (parseError) {
          // If JSON parsing fails, try text
          loggers.email.warn('⚠️ Failed to parse error as JSON, trying text:', parseError);
          try {
            const errorText = await response.text();
            loggers.email.error('❌ Zoho test error text:', errorText);
            errorDetails = errorText || errorDetails;
          } catch (textError) {
            loggers.email.error('❌ Failed to parse error response:', textError);
          }
        }
        
        updateTestStatus('zoho', 'error', `Test failed: ${errorDetails}`);
        showNotification('error', `Zoho test failed: ${errorDetails}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      loggers.email.error('❌ Zoho test exception:', error);
      updateTestStatus('zoho', 'error', `Test failed: ${errorMessage}`);
      showNotification('error', `Failed to test Zoho: ${errorMessage}`);
    }
  };

  const testEmailSending = async () => {
    try {
      updateTestStatus('email', 'testing', 'Preparing test email...');
      
      let testRecipients = currentDraft.recipients || [];
      
      if (testRecipients.length === 0) {
        try {
          updateTestStatus('email', 'testing', 'Finding recipients...');
          const savedRecipients = await EmailService.getRecipients();
          if (savedRecipients.length > 0) {
            testRecipients = [savedRecipients[0].email];
            updateTestStatus('email', 'testing', `Using recipient: ${savedRecipients[0].email}`);
            showNotification('info', `Using first saved recipient: ${savedRecipients[0].email}`);
          } else {
            updateTestStatus('email', 'error', 'No recipients available');
            showNotification('error', 'No recipients available. Please add recipients first or create test recipients.');
            return;
          }
        } catch {
          updateTestStatus('email', 'error', 'Failed to load recipients');
          showNotification('error', 'No recipients available. Please add recipients first or create test recipients.');
          return;
        }
      }

      updateTestStatus('email', 'testing', 'Sending test email...');

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

      const result = await EmailService.sendEmail(testDraft);
      
      if (result.success) {
        updateTestStatus('email', 'success', `Email sent to ${testRecipients.length} recipient(s)!`);
        showNotification('success', `Test email sent successfully to ${testRecipients.join(', ')}! Message ID: ${result.messageId}`);
      } else {
        updateTestStatus('email', 'error', `Send failed: ${result.error}`);
        showNotification('error', `Test email failed: ${result.error}`);
      }
    } catch (error) {
      updateTestStatus('email', 'error', `Test failed: ${error}`);
      showNotification('error', `Test email failed: ${error}`);
    }
  };

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

  // Template handlers
  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.content) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      
      if (selectedTemplate) {
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

  // Draft handlers
  const handleDeleteDraft = async (draftId: string) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        await EmailService.deleteDraft(draftId);
        showNotification('success', 'Draft deleted successfully!');
        
        const updatedDrafts = await EmailService.getDrafts();
        setDrafts(updatedDrafts);
      } catch (error) {
        console.error('Error deleting draft:', error);
        showNotification('error', 'Failed to delete draft');
      }
    }
  };

  // Helper function to check if HTML content has actual text
  const hasTextContent = (html: string | undefined): boolean => {
    if (!html) return false;
    // Create a temporary div to parse HTML and extract text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    // Check if there's actual text (not just whitespace)
    return textContent.trim().length > 0;
  };

  // Handle draft changes - merge updates with existing state
  const handleDraftChange = useCallback((updates: Partial<EmailDraft>) => {
    setCurrentDraft(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const handleSaveDraft = async () => {
    const subject = currentDraft.subject?.trim() || '';
    const hasContent = hasTextContent(currentDraft.content);
    
    if (!subject || !hasContent) {
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
      
      const updatedDrafts = await EmailService.getDrafts();
      setDrafts(updatedDrafts);
      
      showNotification('success', 'Draft saved successfully!');
    } catch (error) {
      loggers.error.error('Error saving draft:', error);
      showNotification('error', 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async () => {
    const subject = currentDraft.subject?.trim() || '';
    const hasContent = hasTextContent(currentDraft.content);
    
    if (!subject || !hasContent) {
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

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Recipient handlers
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

  const handleRemoveIndividualRecipient = (emailToRemove: string) => {
    setCurrentDraft(prev => ({
      ...prev,
      recipients: (prev.recipients || []).filter(email => email !== emailToRemove)
    }));
    showNotification('info', 'Recipient removed');
  };

  const handleEmailInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIndividualRecipient();
    }
  };

  const handleClearIndividualRecipients = () => {
    setCurrentDraft(prev => ({
      ...prev,
      recipients: []
    }));
    showNotification('info', 'All individual recipients cleared');
  };

  const handleClearAllRecipients = () => {
    setCurrentDraft(prev => ({
      ...prev,
      recipients: [],
      recipientGroups: []
    }));
    showNotification('info', 'All recipients cleared');
  };

  const handleRecipientSelection = async (selectedRecipientIds: string[]) => {
    try {
      loggers.email.log('🔍 Selected recipient IDs:', selectedRecipientIds);
      
      if (selectedRecipientIds.length === 0) {
        return;
      }
      
      const selectedEmails: string[] = [];
      
      for (const recipientId of selectedRecipientIds) {
        const recipient = await EmailService.getRecipient(recipientId);
        if (recipient && recipient.email) {
          selectedEmails.push(recipient.email);
        }
      }
      
      if (selectedEmails.length > 0) {
        // Filter out duplicates
        setCurrentDraft(prev => {
          const existingEmails = prev.recipients || [];
          const newEmails = selectedEmails.filter(email => !existingEmails.includes(email));
          return {
            ...prev,
            recipients: [...existingEmails, ...newEmails]
          };
        });
        
        setShowRecipientSelector(false);
        showNotification('success', `${selectedEmails.length} recipient${selectedEmails.length !== 1 ? 's' : ''} added`);
      } else {
        showNotification('error', 'No valid recipients found');
      }
    } catch (error) {
      loggers.error.error('Error fetching recipient emails:', error);
      showNotification('error', 'Failed to load recipient emails');
    }
  };

  const handleUserEmailsSelected = (selectedEmails: string[]) => {
    if (selectedEmails.length === 0) {
      return;
    }

    // Filter out duplicates
    setCurrentDraft(prev => {
      const existingEmails = prev.recipients || [];
      const newEmails = selectedEmails.filter(email => !existingEmails.includes(email));
      return {
        ...prev,
        recipients: [...existingEmails, ...newEmails]
      };
    });
    
    setShowRecipientSelector(false);
    showNotification('success', `${selectedEmails.length} user${selectedEmails.length !== 1 ? 's' : ''} added`);
  };

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

  const handleResendEmail = (email: SentEmail) => {
    setCurrentDraft({
      subject: email.subject,
      content: email.content,
      recipients: email.recipients || [],
      recipientGroups: email.recipientGroups || [],
      templateId: email.templateId,
      isScheduled: false,
      priority: 'normal',
      trackOpens: true,
      trackClicks: true,
      status: 'draft',
      createdBy: userProfile?.uid || ''
    });
    setActiveTab('compose');
  };

  const handleEditDraft = (draft: EmailDraft) => {
    setCurrentDraft(draft);
    setActiveTab('compose');
  };

  if (isLoading) {
    return (
      <BannerWrapper sectionId="emails" className="email-admin-emails">
        <div className="email-loading-container">
          <div className="email-loading-spinner">
            <FaSpinner className="email-spinner-icon" />
            <h2>Loading Email Management...</h2>
            <p>Setting up your email workspace</p>
          </div>
        </div>
      </BannerWrapper>
    );
  }

  return (
    <BannerWrapper sectionId="emails" className="email-admin-emails">
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

      {/* Header */}
      <EmailHeader
        emailConfigValid={emailConfigValid}
        emailConfigErrors={emailConfigErrors}
        templatesCount={templates.length}
        totalRecipients={recipientGroups.reduce((sum, group) => sum + group.count, 0)}
        totalSent={analytics.totalSent}
        openRate={analytics.openRate}
        isLoading={isLoading}
        onRefresh={loadData}
      />

      {/* Tabs */}
      <EmailTabs
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'compose' | 'templates' | 'sent' | 'drafts' | 'analytics' | 'developer')}
        templatesCount={templates.length}
        sentEmailsCount={sentEmails.length}
        draftsCount={drafts.length}
      />

      {/* Content */}
      <div className="email-emails-content">
        {activeTab === 'compose' && (
          <ComposeTab
            currentDraft={currentDraft}
            recipientGroups={recipientGroups}
            templates={templates}
            showPreview={showPreview}
            individualEmailInput={individualEmailInput}
            emailValidationError={emailValidationError}
            showBulkImport={showBulkImport}
            bulkEmailInput={bulkEmailInput}
            isSaving={isSaving}
            isSending={isSending}
            onDraftChange={handleDraftChange}
            onSaveDraft={handleSaveDraft}
            onSendEmail={handleSendEmail}
            onTogglePreview={() => setShowPreview(!showPreview)}
            onEmailInputChange={setIndividualEmailInput}
            onEmailInputKeyPress={handleEmailInputKeyPress}
            onAddIndividualRecipient={handleAddIndividualRecipient}
            onRemoveIndividualRecipient={handleRemoveIndividualRecipient}
            onClearIndividualRecipients={handleClearIndividualRecipients}
            onClearAllRecipients={handleClearAllRecipients}
            onShowRecipientSelector={() => setShowRecipientSelector(true)}
            onToggleBulkImport={() => setShowBulkImport(!showBulkImport)}
            onBulkImportChange={setBulkEmailInput}
            onBulkImport={handleBulkImport}
            onLoadTemplate={handleLoadTemplate}
          />
        )}

        {activeTab === 'templates' && (
          <EmailTemplateManager
            onLoadTemplate={handleLoadTemplate}
            onCreateTemplate={() => {
              setTemplateForm({});
              setSelectedTemplate(null);
              setShowTemplateModal(true);
            }}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        )}

        {activeTab === 'sent' && (
          <SentTab
            sentEmails={sentEmails}
            onResendEmail={handleResendEmail}
          />
        )}

        {activeTab === 'drafts' && (
          <DraftsTab
            drafts={drafts}
            onEditDraft={handleEditDraft}
            onDeleteDraft={handleDeleteDraft}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab analytics={analytics} />
        )}

        {activeTab === 'use-cases' && (
          <EmailUseCasesTab />
        )}

        {activeTab === 'developer' && (
          <DeveloperTab
            testStatuses={testStatuses}
            currentDraftRecipients={currentDraft.recipients || []}
            isLoading={isLoading}
            onTestServer={testEmailServerConnection}
            onTestConfig={testEmailConfiguration}
            onTestZoho={testZohoSetup}
            onTestEmail={testEmailSending}
            onCreateTestRecipients={createTestRecipients}
            onRefresh={loadData}
          />
        )}
      </div>

      {/* Template Modal */}
      <TemplateModal
        show={showTemplateModal}
        selectedTemplate={selectedTemplate}
        templateForm={templateForm}
        isSaving={isSaving}
        onClose={() => setShowTemplateModal(false)}
        onSave={handleSaveTemplate}
        onFormChange={(updates) => setTemplateForm(prev => ({ ...prev, ...updates }))}
      />

      {/* Recipient Selector Modal */}
      {showRecipientSelector && (
        <RecipientSelector
          selectedRecipients={[]}
          onRecipientsChange={handleRecipientSelection}
          onUserEmailsSelected={handleUserEmailsSelected}
          onClose={() => setShowRecipientSelector(false)}
        />
      )}
    </BannerWrapper>
  );
};

export default AdminEmails;
