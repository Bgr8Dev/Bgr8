import React from 'react';
import { 
  FaInfoCircle,
  FaEye,
  FaPalette,
  FaRocket,
  FaMousePointer,
  FaCog,
  FaSpinner,
  FaTimes
} from 'react-icons/fa';
import { Announcement } from '../../services/announcementService';
import './AnnouncementModal.css';

interface AnnouncementModalProps {
  isOpen: boolean;
  isCreateMode: boolean;
  isSaving: boolean;
  formData: Partial<Announcement>;
  onClose: () => void;
  onSave: () => void;
  onFormDataChange: (data: Partial<Announcement>) => void;
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  isCreateMode,
  isSaving,
  formData,
  onClose,
  onSave,
  onFormDataChange
}) => {
  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  const handleDisplaySettingsChange = (field: string, value: any) => {
    onFormDataChange({
      ...formData,
      displaySettings: {
        ...formData.displaySettings,
        [field]: value
      }
    });
  };

  return (
    <div className="announcement-modal-overlay" onClick={onClose}>
      <div className="announcement-modal" onClick={(e) => e.stopPropagation()}>
        <div className="announcement-modal-header">
          <h3>{isCreateMode ? 'Create Announcement' : 'Edit Announcement'}</h3>
          <button 
            className="announcement-close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <div className="announcement-modal-content">
          {/* Basic Information Section */}
          <div className="announcement-form-section">
            <h3 className="announcement-form-section-title">
              <FaInfoCircle />
              Basic Information
            </h3>
            
            <div className="announcement-form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter announcement title..."
              />
            </div>
            
            <div className="announcement-form-group">
              <label>Content *</label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Enter announcement content..."
                rows={4}
              />
            </div>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Type</label>
                <select
                  value={formData.type || 'info'}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="promotion">Promotion</option>
                </select>
              </div>
              
              <div className="announcement-form-group">
                <label>Priority</label>
                <select
                  value={formData.priority || 'normal'}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Start Date</label>
                <input
                  type="datetime-local"
                  value={formData.startDate ? new Date(formData.startDate.getTime() - formData.startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
                />
              </div>
              
              <div className="announcement-form-group">
                <label>End Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.endDate ? new Date(formData.endDate.getTime() - formData.endDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="announcement-form-group">
              <label>Target Audience</label>
              <select
                value={formData.targetAudience || 'all'}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="users">Users Only</option>
                <option value="mentors">Mentors Only</option>
                <option value="admins">Admins Only</option>
                <option value="guests">Guests Only</option>
              </select>
            </div>

            <div className="announcement-form-group">
              <label className="announcement-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
                Active (Show on website)
              </label>
            </div>
          </div>

          {/* Display Settings Section */}
          <div className="announcement-form-section">
            <h3 className="announcement-form-section-title">
              <FaEye />
              Display Settings
            </h3>

            <div className="announcement-form-group">
              <label>Display Mode</label>
              <select
                value={formData.displaySettings?.displayMode || 'title-and-content'}
                onChange={(e) => handleDisplaySettingsChange('displayMode', e.target.value)}
              >
                <option value="title-only">Title Only</option>
                <option value="content-only">Content Only</option>
                <option value="title-and-content">Title + Content</option>
                <option value="custom">Custom Text</option>
              </select>
            </div>

            {formData.displaySettings?.displayMode === 'custom' && (
              <div className="announcement-form-group">
                <label>Custom Display Text</label>
                <input
                  type="text"
                  value={formData.displaySettings?.customDisplayText || ''}
                  onChange={(e) => handleDisplaySettingsChange('customDisplayText', e.target.value)}
                  placeholder="Enter custom text to display..."
                />
              </div>
            )}

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Font Size</label>
                <select
                  value={formData.displaySettings?.fontSize || 'medium'}
                  onChange={(e) => handleDisplaySettingsChange('fontSize', e.target.value)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>
              
              <div className="announcement-form-group">
                <label>Font Weight</label>
                <select
                  value={formData.displaySettings?.fontWeight || 'medium'}
                  onChange={(e) => handleDisplaySettingsChange('fontWeight', e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="medium">Medium</option>
                  <option value="semibold">Semi Bold</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Colors & Styling Section */}
          <div className="announcement-form-section">
            <h3 className="announcement-form-section-title">
              <FaPalette />
              Colors & Styling
            </h3>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Background Type</label>
                <select
                  value={formData.displaySettings?.backgroundType || 'solid'}
                  onChange={(e) => handleDisplaySettingsChange('backgroundType', e.target.value)}
                >
                  <option value="solid">Solid Color</option>
                  <option value="gradient">Gradient</option>
                </select>
              </div>
              
              <div className="announcement-form-group">
                <label>Background Color</label>
                <div className="announcement-color-input">
                  <input
                    type="color"
                    value={formData.displaySettings?.backgroundColor || '#3b82f6'}
                    onChange={(e) => handleDisplaySettingsChange('backgroundColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={formData.displaySettings?.backgroundColor || '#3b82f6'}
                    onChange={(e) => handleDisplaySettingsChange('backgroundColor', e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            {formData.displaySettings?.backgroundType === 'gradient' && (
              <div className="announcement-form-row">
                <div className="announcement-form-group">
                  <label>Gradient Direction</label>
                  <select
                    value={formData.displaySettings?.gradientDirection || 'horizontal'}
                    onChange={(e) => handleDisplaySettingsChange('gradientDirection', e.target.value)}
                  >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                    <option value="diagonal">Diagonal</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
                
                <div className="announcement-form-group">
                  <label>Gradient Colors</label>
                  <div className="announcement-gradient-colors">
                    <input
                      type="color"
                      value={formData.displaySettings?.gradientColors?.[0] || '#3b82f6'}
                      onChange={(e) => handleDisplaySettingsChange('gradientColors', [e.target.value, formData.displaySettings?.gradientColors?.[1] || '#1d4ed8'])}
                    />
                    <input
                      type="color"
                      value={formData.displaySettings?.gradientColors?.[1] || '#1d4ed8'}
                      onChange={(e) => handleDisplaySettingsChange('gradientColors', [formData.displaySettings?.gradientColors?.[0] || '#3b82f6', e.target.value])}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Text Color</label>
                <div className="announcement-color-input">
                  <input
                    type="color"
                    value={formData.displaySettings?.textColor || '#ffffff'}
                    onChange={(e) => handleDisplaySettingsChange('textColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={formData.displaySettings?.textColor || '#ffffff'}
                    onChange={(e) => handleDisplaySettingsChange('textColor', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Accent Color (Optional)</label>
                <div className="announcement-color-input">
                  <input
                    type="color"
                    value={formData.displaySettings?.accentColor || '#60a5fa'}
                    onChange={(e) => handleDisplaySettingsChange('accentColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={formData.displaySettings?.accentColor || '#60a5fa'}
                    onChange={(e) => handleDisplaySettingsChange('accentColor', e.target.value)}
                    placeholder="#60a5fa"
                  />
                </div>
              </div>
              
              <div className="announcement-form-group">
                <label>Border Color (Optional)</label>
                <div className="announcement-color-input">
                  <input
                    type="color"
                    value={formData.displaySettings?.borderColor || ''}
                    onChange={(e) => handleDisplaySettingsChange('borderColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={formData.displaySettings?.borderColor || ''}
                    onChange={(e) => handleDisplaySettingsChange('borderColor', e.target.value)}
                    placeholder="Leave empty for no border"
                  />
                </div>
              </div>
            </div>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Border Radius</label>
                <select
                  value={formData.displaySettings?.borderRadius || 'medium'}
                  onChange={(e) => handleDisplaySettingsChange('borderRadius', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="full">Fully Rounded</option>
                </select>
              </div>
              
              <div className="announcement-form-group">
                <label>Shadow</label>
                <select
                  value={formData.displaySettings?.shadow || 'medium'}
                  onChange={(e) => handleDisplaySettingsChange('shadow', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="glow">Glow</option>
                </select>
              </div>
            </div>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Padding</label>
                <select
                  value={formData.displaySettings?.padding || 'medium'}
                  onChange={(e) => handleDisplaySettingsChange('padding', e.target.value)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>
              
              <div className="announcement-form-group">
                <label>Opacity</label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={formData.displaySettings?.opacity || 1}
                  onChange={(e) => handleDisplaySettingsChange('opacity', parseFloat(e.target.value))}
                />
                <span className="announcement-range-value">{(formData.displaySettings?.opacity || 1) * 100}%</span>
              </div>
            </div>
          </div>

          {/* Animation & Effects Section */}
          <div className="announcement-form-section">
            <h3 className="announcement-form-section-title">
              <FaRocket />
              Animation & Effects
            </h3>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Entry Animation</label>
                <select
                  value={formData.displaySettings?.animation || 'shimmer'}
                  onChange={(e) => handleDisplaySettingsChange('animation', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="fade">Fade In</option>
                  <option value="slide">Slide Down</option>
                  <option value="bounce">Bounce In</option>
                  <option value="pulse">Pulse</option>
                  <option value="glow">Glow</option>
                  <option value="shimmer">Shimmer</option>
                </select>
              </div>
              
              <div className="announcement-form-group">
                <label>Animation Speed</label>
                <select
                  value={formData.displaySettings?.animationSpeed || 'normal'}
                  onChange={(e) => handleDisplaySettingsChange('animationSpeed', e.target.value)}
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
            </div>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Hover Effect</label>
                <select
                  value={formData.displaySettings?.hoverEffect || 'glow'}
                  onChange={(e) => handleDisplaySettingsChange('hoverEffect', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="lift">Lift</option>
                  <option value="glow">Glow</option>
                  <option value="scale">Scale</option>
                  <option value="fade">Fade</option>
                </select>
              </div>
              
              <div className="announcement-form-group">
                <label>Click Effect</label>
                <select
                  value={formData.displaySettings?.clickEffect || 'bounce'}
                  onChange={(e) => handleDisplaySettingsChange('clickEffect', e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="bounce">Bounce</option>
                  <option value="shake">Shake</option>
                  <option value="glow">Glow</option>
                </select>
              </div>
            </div>

            <div className="announcement-form-group">
              <label>Background Pattern</label>
              <select
                value={formData.displaySettings?.pattern || 'none'}
                onChange={(e) => handleDisplaySettingsChange('pattern', e.target.value)}
              >
                <option value="none">None</option>
                <option value="dots">Dots</option>
                <option value="lines">Lines</option>
                <option value="grid">Grid</option>
                <option value="waves">Waves</option>
                <option value="stars">Stars</option>
                <option value="circles">Circles</option>
                <option value="hexagons">Hexagons</option>
                <option value="triangles">Triangles</option>
                <option value="diagonal">Diagonal Stripes</option>
                <option value="polka">Polka Dots</option>
                <option value="mesh">Mesh</option>
              </select>
            </div>
          </div>

          {/* Scroll & Behavior Section */}
          <div className="announcement-form-section">
            <h3 className="announcement-form-section-title">
              <FaMousePointer />
              Scroll & Behavior
            </h3>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Auto Scroll</label>
                <label className="announcement-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.displaySettings?.autoScroll !== false}
                    onChange={(e) => handleDisplaySettingsChange('autoScroll', e.target.checked)}
                  />
                  Enable auto-scrolling text
                </label>
              </div>
              
              <div className="announcement-form-group">
                <label>Scroll Speed</label>
                <select
                  value={formData.displaySettings?.scrollSpeed || 'normal'}
                  onChange={(e) => handleDisplaySettingsChange('scrollSpeed', e.target.value)}
                >
                  <option value="very-slow">Very Slow</option>
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                  <option value="very-fast">Very Fast</option>
                </select>
              </div>
            </div>

            <div className="announcement-form-group">
              <label>Scroll Direction</label>
              <div className="announcement-select-with-tooltip">
                <select
                  value={formData.displaySettings?.scrollDirection || 'left-to-right'}
                  onChange={(e) => handleDisplaySettingsChange('scrollDirection', e.target.value)}
                >
                  <option value="left-to-right">Left to Right</option>
                  <option value="right-to-left" disabled>Right to Left (Disabled)</option>
                  <option value="bounce">Bounce</option>
                  <option value="alternate">Alternate</option>
                </select>
                <div className="announcement-tooltip">
                  Right to Left scrolling is temporarily disabled - not working at the moment
                </div>
              </div>
            </div>
          </div>

          {/* Visibility & Controls Section */}
          <div className="announcement-form-section">
            <h3 className="announcement-form-section-title">
              <FaCog />
              Visibility & Controls
            </h3>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Show Icon</label>
                <label className="announcement-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.displaySettings?.showIcon !== false}
                    onChange={(e) => handleDisplaySettingsChange('showIcon', e.target.checked)}
                  />
                  Display announcement icon
                </label>
              </div>
              
              <div className="announcement-form-group">
                <label>Icon Position</label>
                <select
                  value={formData.displaySettings?.iconPosition || 'left'}
                  onChange={(e) => handleDisplaySettingsChange('iconPosition', e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="center">Center</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Show Controls</label>
                <label className="announcement-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.displaySettings?.showControls !== false}
                    onChange={(e) => handleDisplaySettingsChange('showControls', e.target.checked)}
                  />
                  Show navigation controls
                </label>
              </div>
              
              <div className="announcement-form-group">
                <label>Show Indicators</label>
                <label className="announcement-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.displaySettings?.showIndicators !== false}
                    onChange={(e) => handleDisplaySettingsChange('showIndicators', e.target.checked)}
                  />
                  Show dot indicators
                </label>
              </div>
            </div>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Show Close Button</label>
                <label className="announcement-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.displaySettings?.showCloseButton !== false}
                    onChange={(e) => handleDisplaySettingsChange('showCloseButton', e.target.checked)}
                  />
                  Allow users to dismiss
                </label>
              </div>
              
              <div className="announcement-form-group">
                <label>Close Button Style</label>
                <select
                  value={formData.displaySettings?.closeButtonStyle || 'default'}
                  onChange={(e) => handleDisplaySettingsChange('closeButtonStyle', e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="minimal">Minimal</option>
                  <option value="prominent">Prominent</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div className="announcement-form-row">
              <div className="announcement-form-group">
                <label>Show on Homepage</label>
                <label className="announcement-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.displaySettings?.showOnHomepage !== false}
                    onChange={(e) => handleDisplaySettingsChange('showOnHomepage', e.target.checked)}
                  />
                  Display on homepage
                </label>
              </div>
              
              <div className="announcement-form-group">
                <label>Show on Admin Portal</label>
                <label className="announcement-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.displaySettings?.showOnPortal !== false}
                    onChange={(e) => handleDisplaySettingsChange('showOnPortal', e.target.checked)}
                  />
                  Display on admin portal
                </label>
              </div>
            </div>

            <div className="announcement-form-group">
              <label>Show on Mobile</label>
              <label className="announcement-checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.displaySettings?.showOnMobile !== false}
                  onChange={(e) => handleDisplaySettingsChange('showOnMobile', e.target.checked)}
                />
                Display on mobile devices
              </label>
            </div>
          </div>
        </div>
        
        <div className="announcement-modal-actions">
          <button
            className="announcement-modal-btn announcement-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="announcement-modal-btn announcement-save"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <FaSpinner className="announcement-spinning" />
                {isCreateMode ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              isCreateMode ? 'Create Announcement' : 'Update Announcement'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
