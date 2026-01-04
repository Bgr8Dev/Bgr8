import React, { useState, useEffect } from 'react';
import { 
  FaDownload, 
  FaSync, 
  FaEye, 
  FaTrash,
  FaCheck,
  FaTimes,
  FaInfoCircle
} from 'react-icons/fa';
import { EmailService, EmailTemplate } from '../../../services/emailService';
import { 
  EmailTemplates, 
  renderEmailTemplate 
} from '../../../services/emailTemplates';
import { loggers } from '../../../utils/logger';
import './EmailTemplateManager.css';

interface TemplateManagerProps {
  onClose?: () => void;
}

export const EmailTemplateManager: React.FC<TemplateManagerProps> = ({ onClose }) => {
  const [builtInTemplates, setBuiltInTemplates] = useState<Array<{ key: string; template: typeof EmailTemplates[string] }>>([]);
  const [firebaseTemplates, setFirebaseTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ subject: string; content: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [testVariables, setTestVariables] = useState<Record<string, string>>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    verificationUrl: 'https://bgr8.uk/verify?token=abc123',
    resetUrl: 'https://bgr8.uk/reset?token=xyz789',
    profileUrl: 'https://bgr8.uk/profile',
    rejectionReason: 'Profile information incomplete'
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // Load built-in templates
      const builtIn = Object.entries(EmailTemplates).map(([key, template]) => ({
        key,
        template
      }));
      setBuiltInTemplates(builtIn);
      
      // Load Firebase templates
      const firebase = await EmailService.getTemplates();
      setFirebaseTemplates(firebase);
    } catch (error) {
      loggers.error.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncTemplateToFirebase = async (templateKey: string) => {
    try {
      setSyncing(templateKey);
      const builtInTemplate = EmailTemplates[templateKey];
      
      if (!builtInTemplate) {
        throw new Error('Template not found');
      }

      // Check if template already exists in Firebase
      const existing = firebaseTemplates.find(t => t.name === builtInTemplate.name);
      
      if (existing) {
        // Update existing template
        await EmailService.updateTemplate(existing.id, {
          subject: builtInTemplate.subject,
          content: builtInTemplate.content,
          category: builtInTemplate.category
        });
        loggers.email.log(`Template "${builtInTemplate.name}" updated in Firebase`);
      } else {
        // Create new template
        await EmailService.saveTemplate({
          name: builtInTemplate.name,
          subject: builtInTemplate.subject,
          content: builtInTemplate.content,
          category: builtInTemplate.category,
          createdBy: 'system',
          isPublic: true,
          tags: [templateKey, 'built-in']
        });
        loggers.email.log(`Template "${builtInTemplate.name}" saved to Firebase`);
      }
      
      // Reload Firebase templates
      await loadTemplates();
    } catch (error) {
      loggers.error.error(`Error syncing template ${templateKey}:`, error);
      alert(`Failed to sync template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSyncing(null);
    }
  };

  const syncAllTemplates = async () => {
    try {
      setSyncing('all');
      let synced = 0;
      let failed = 0;

      for (const { key } of builtInTemplates) {
        try {
          await syncTemplateToFirebase(key);
          synced++;
        } catch (error) {
          failed++;
          loggers.error.error(`Failed to sync ${key}:`, error);
        }
      }

      alert(`Sync complete: ${synced} synced, ${failed} failed`);
    } catch (error) {
      loggers.error.error('Error syncing all templates:', error);
      alert('Failed to sync templates');
    } finally {
      setSyncing(null);
    }
  };

  const previewTemplate = (templateKey: string) => {
    const rendered = renderEmailTemplate(templateKey, testVariables);
    if (rendered) {
      setPreviewData(rendered);
      setSelectedTemplate(templateKey);
      setShowPreview(true);
    }
  };

  const deleteFirebaseTemplate = async (templateId: string, templateName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return;
    }

    try {
      await EmailService.deleteTemplate(templateId);
      await loadTemplates();
      loggers.email.log(`Template "${templateName}" deleted`);
    } catch (error) {
      loggers.error.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const exportTemplate = (templateKey: string) => {
    const template = EmailTemplates[templateKey];
    if (!template) return;

    const exportData = {
      key: templateKey,
      ...template,
      variables: Object.keys(testVariables)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateKey}-template.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isTemplateInFirebase = (templateKey: string): boolean => {
    const builtIn = EmailTemplates[templateKey];
    if (!builtIn) return false;
    return firebaseTemplates.some(t => t.name === builtIn.name);
  };

  const getFirebaseTemplateId = (templateKey: string): string | null => {
    const builtIn = EmailTemplates[templateKey];
    if (!builtIn) return null;
    const found = firebaseTemplates.find(t => t.name === builtIn.name);
    return found?.id || null;
  };

  if (loading) {
    return (
      <div className="email-template-manager">
        <div className="template-manager-loading">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="email-template-manager">
      <div className="template-manager-header">
        <h2>Email Template Manager</h2>
        {onClose && (
          <button className="template-manager-close" onClick={onClose} title="Close Template Manager">
            <FaTimes />
          </button>
        )}
      </div>

      <div className="template-manager-content">
        <div className="template-manager-actions">
          <button
            className="btn-sync-all"
            onClick={syncAllTemplates}
            disabled={syncing === 'all'}
          >
            <FaSync className={syncing === 'all' ? 'spinning' : ''} />
            Sync All to Firebase
          </button>
          <div className="template-manager-info">
            <FaInfoCircle />
            <span>
              Built-in templates: {builtInTemplates.length} | 
              Firebase templates: {firebaseTemplates.length}
            </span>
          </div>
        </div>

        <div className="template-manager-tabs">
          <div className="template-tab active">Built-in Templates</div>
        </div>

        <div className="template-manager-section">
          <div className="template-list">
            {builtInTemplates.map(({ key, template }) => {
              const inFirebase = isTemplateInFirebase(key);
              const firebaseId = getFirebaseTemplateId(key);
              
              return (
                <div key={key} className="template-item">
                  <div className="template-item-header">
                    <div className="template-item-info">
                      <h3>{template.name}</h3>
                      <span className="template-key">Key: {key}</span>
                      {template.description && (
                        <p className="template-description">{template.description}</p>
                      )}
                    </div>
                    <div className="template-item-status">
                      {inFirebase ? (
                        <span className="status-badge synced">
                          <FaCheck /> Synced
                        </span>
                      ) : (
                        <span className="status-badge not-synced">
                          Not Synced
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="template-item-details">
                    <div className="template-detail">
                      <strong>Category:</strong> {template.category}
                    </div>
                    <div className="template-detail">
                      <strong>Subject:</strong> {template.subject}
                    </div>
                    <div className="template-detail">
                      <strong>Variables:</strong>
                      <div className="template-variables">
                        {template.content.match(/\{\{(\w+)\}\}/g)?.map((match, idx) => {
                          const varName = match.replace(/[{}]/g, '');
                          return (
                            <span key={idx} className="variable-tag">
                              {varName}
                            </span>
                          );
                        }) || <span className="no-variables">No variables</span>}
                      </div>
                    </div>
                  </div>

                  <div className="template-item-actions">
                    <button
                      className="btn-action btn-preview"
                      onClick={() => previewTemplate(key)}
                      title="Preview Template"
                    >
                      <FaEye /> Preview
                    </button>
                    <button
                      className="btn-action btn-sync"
                      onClick={() => syncTemplateToFirebase(key)}
                      disabled={syncing === key}
                      title={inFirebase ? "Update in Firebase" : "Sync to Firebase"}
                    >
                      <FaSync className={syncing === key ? 'spinning' : ''} />
                      {inFirebase ? 'Update' : 'Sync'}
                    </button>
                    <button
                      className="btn-action btn-export"
                      onClick={() => exportTemplate(key)}
                      title="Export Template"
                    >
                      <FaDownload /> Export
                    </button>
                    {inFirebase && firebaseId && (
                      <button
                        className="btn-action btn-delete"
                        onClick={() => deleteFirebaseTemplate(firebaseId, template.name)}
                        title="Delete from Firebase"
                      >
                        <FaTrash /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && previewData && (
          <div className="template-preview-modal">
            <div className="template-preview-content">
              <div className="template-preview-header">
                <h3>Template Preview: {selectedTemplate}</h3>
                <button onClick={() => setShowPreview(false)} title="Close Preview">
                  <FaTimes />
                </button>
              </div>
              
              <div className="template-preview-variables">
                <h4>Test Variables</h4>
                <div className="variables-input">
                  {Object.keys(testVariables).map(key => (
                    <div key={key} className="variable-input-group">
                      <label>{key}:</label>
                      <input
                        type="text"
                        value={testVariables[key]}
                        onChange={(e) => setTestVariables(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }))}
                      />
                    </div>
                  ))}
                </div>
                <button
                  className="btn-refresh-preview"
                  onClick={() => selectedTemplate && previewTemplate(selectedTemplate)}
                  title="Refresh Preview"
                >
                  Refresh Preview
                </button>
              </div>

              <div className="template-preview-email">
                <div className="preview-subject">
                  <strong>Subject:</strong> {previewData.subject}
                </div>
                <div 
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: previewData.content }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTemplateManager;

