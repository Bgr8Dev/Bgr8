import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaDownload, 
  FaSync, 
  FaEye, 
  FaTrash,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaSearch,
  FaPlus,
  FaEdit,
  FaCopy
} from 'react-icons/fa';
import { EmailService, EmailTemplate } from '../../../services/emailService';
import { 
  EmailTemplates, 
  renderEmailTemplate 
} from '../../../services/emailTemplates';
import { htmlToText } from '../../../utils/inputSanitization';
import { loggers } from '../../../utils/logger';
import './EmailTemplateManager.css';

interface TemplateManagerProps {
  onClose?: () => void;
  // TemplatesTab functionality
  onLoadTemplate?: (template: EmailTemplate) => void;
  onCreateTemplate?: () => void;
  onEditTemplate?: (template: EmailTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
}

export const EmailTemplateManager: React.FC<TemplateManagerProps> = ({ 
  onClose,
  onLoadTemplate,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate
}) => {
  const [builtInTemplates, setBuiltInTemplates] = useState<Array<{ key: string; template: typeof EmailTemplates[string] }>>([]);
  const [firebaseTemplates, setFirebaseTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ subject: string; content: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeView, setActiveView] = useState<'built-in' | 'firebase'>('firebase');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPreview) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showPreview]);

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
    try {
      loggers.email.log(`Previewing template: ${templateKey}`);
      loggers.email.log(`Test variables:`, testVariables);
      
      const rendered = renderEmailTemplate(templateKey, testVariables);
      
      if (rendered) {
        loggers.email.log(`Template rendered successfully:`, {
          subject: rendered.subject,
          contentLength: rendered.content.length
        });
        setPreviewData(rendered);
        setSelectedTemplate(templateKey);
        setShowPreview(true);
      } else {
        const errorMsg = `Template "${templateKey}" not found or could not be rendered.`;
        loggers.email.error(errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      const errorMsg = `Error previewing template: ${error instanceof Error ? error.message : 'Unknown error'}`;
      loggers.error.error('Error previewing template:', error);
      alert(errorMsg);
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
          <button
            className={`template-tab ${activeView === 'firebase' ? 'active' : ''}`}
            onClick={() => setActiveView('firebase')}
          >
            Firebase Templates ({firebaseTemplates.length})
          </button>
          <button
            className={`template-tab ${activeView === 'built-in' ? 'active' : ''}`}
            onClick={() => setActiveView('built-in')}
          >
            Built-in Templates ({builtInTemplates.length})
          </button>
        </div>

        {/* Search and Filter Controls - Only show for Firebase templates */}
        {activeView === 'firebase' && (
          <div className="template-manager-filters">
            <div className="template-search-box">
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
              className="template-category-filter"
            >
              <option value="all">All Categories</option>
              <option value="announcement">Announcements</option>
              <option value="newsletter">Newsletters</option>
              <option value="notification">Notifications</option>
              <option value="invitation">Invitations</option>
              <option value="reminder">Reminders</option>
              <option value="custom">Custom</option>
            </select>
            {onCreateTemplate && (
              <button
                className="btn-create-template"
                onClick={onCreateTemplate}
              >
                <FaPlus /> Create Template
              </button>
            )}
          </div>
        )}

        <div className="template-manager-section">
          {activeView === 'firebase' ? (
            <div className="template-list">
              {(() => {
                const filteredTemplates = firebaseTemplates.filter(template => {
                  const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       template.subject.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
                  return matchesSearch && matchesCategory;
                });

                if (filteredTemplates.length === 0) {
                  return (
                    <div className="template-empty-state">
                      <p>No templates found. {onCreateTemplate && 'Create your first template!'}</p>
                    </div>
                  );
                }

                return filteredTemplates.map(template => (
                  <div key={template.id} className="template-item firebase-template">
                    <div className="template-item-header">
                      <div className="template-item-info">
                        <h3>{template.name}</h3>
                        <span className="template-category-badge">{template.category}</span>
                      </div>
                      <div className="template-item-status">
                        <span className="status-badge synced">
                          <FaCheck /> Firebase
                        </span>
                      </div>
                    </div>

                    <div className="template-item-details">
                      <div className="template-detail">
                        <strong>Subject:</strong> {template.subject}
                      </div>
                      <div className="template-detail">
                        <strong>Preview:</strong>
                        <div className="template-preview-text">
                          {(() => {
                            // Use proper HTML to text conversion function
                            const text = htmlToText(template.content);
                            return text.substring(0, 150) + (text.length > 150 ? '...' : '');
                          })()}
                        </div>
                      </div>
                      <div className="template-detail">
                        <strong>Updated:</strong> {template.updatedAt.toLocaleDateString()}
                      </div>
                    </div>

                    <div className="template-item-actions">
                      {onLoadTemplate && (
                        <button
                          className="btn-action btn-load"
                          onClick={() => onLoadTemplate(template)}
                          title="Use Template"
                        >
                          <FaCopy /> Use
                        </button>
                      )}
                      <button
                        className="btn-action btn-preview"
                        onClick={() => {
                          // Convert Firebase template to preview format
                          const rendered = {
                            subject: template.subject,
                            content: template.content
                          };
                          setPreviewData(rendered);
                          setSelectedTemplate(template.id);
                          setShowPreview(true);
                        }}
                        title="Preview Template"
                      >
                        <FaEye /> Preview
                      </button>
                      {onEditTemplate && (
                        <button
                          className="btn-action btn-edit"
                          onClick={() => onEditTemplate(template)}
                          title="Edit Template"
                        >
                          <FaEdit /> Edit
                        </button>
                      )}
                      {onDeleteTemplate && (
                        <button
                          className="btn-action btn-delete"
                          onClick={() => onDeleteTemplate(template.id)}
                          title="Delete Template"
                        >
                          <FaTrash /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
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
          )}
        </div>

        {/* Preview Modal - Using Portal to render at document root */}
        {showPreview && previewData && typeof document !== 'undefined' && createPortal(
          <div 
            className="template-preview-modal"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowPreview(false);
              }
            }}
          >
            <div className="template-preview-content" onClick={(e) => e.stopPropagation()}>
              <div className="template-preview-header">
                <h3>Template Preview: {selectedTemplate}</h3>
                <button onClick={() => setShowPreview(false)} title="Close Preview">
                  <FaTimes />
                </button>
              </div>
              
              <div className="template-preview-variables">
                <h4>Test Variables</h4>
                <div className="variables-input">
                  {selectedTemplate && (() => {
                    const template = EmailTemplates[selectedTemplate];
                    const usedVariables = template?.content.match(/\{\{(\w+)\}\}/g)?.map(match => 
                      match.replace(/[{}]/g, '')
                    ) || [];
                    const allVariables = new Set([...usedVariables, ...Object.keys(testVariables)]);
                    
                    return Array.from(allVariables).map(key => (
                      <div key={key} className="variable-input-group">
                        <label>{key}:</label>
                        <input
                          type="text"
                          value={testVariables[key] || ''}
                          onChange={(e) => setTestVariables(prev => ({
                            ...prev,
                            [key]: e.target.value
                          }))}
                          placeholder={`Enter ${key}...`}
                        />
                      </div>
                    ));
                  })()}
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
                {previewData.content ? (
                  <div 
                    className="preview-content"
                    dangerouslySetInnerHTML={{ __html: previewData.content }}
                  />
                ) : (
                  <div className="preview-content">
                    <p style={{ color: '#ef4444', padding: '2rem' }}>
                      Error: Preview content is empty. Please check the template.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default EmailTemplateManager;

