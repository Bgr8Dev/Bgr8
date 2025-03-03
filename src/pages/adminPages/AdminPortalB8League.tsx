import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FaToggleOn, FaToggleOff, FaChevronDown, FaChevronRight } from 'react-icons/fa';

interface AdminPortalB8LeagueProps {
  stats: BusinessStats;
}

// Define section IDs for expanded/collapsed state management
type SectionId = 'visibility' | 'youtube';

// Interface for B8 League specific settings
interface B8LeagueSettings {
  showTournaments: boolean;
  showHero: boolean;
  showSportNavigation: boolean;
  showFootball: boolean;
  showBadminton: boolean;
  showEsports: boolean;
  showTournamentCreator: boolean;
  showContact: boolean;
  youtubeLink: string;
}

export function AdminPortalB8League({ stats }: AdminPortalB8LeagueProps) {
  const [settings, setSettings] = useState<B8LeagueSettings>({
    showTournaments: true,
    showHero: true,
    showSportNavigation: true,
    showFootball: true,
    showBadminton: true,
    showEsports: true,
    showTournamentCreator: true,
    showContact: true,
    youtubeLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null);
  const [youtubeLink, setYoutubeLink] = useState('');
  
  // State for tracking expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState<Record<SectionId, boolean>>({
    visibility: true, // Start with visibility section expanded
    youtube: false
  });

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId: SectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Fetch the current settings when component mounts
  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const settingsRef = doc(db, 'settings', 'b8League');
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists()) {
          // Merge existing settings with default values to ensure all fields exist
          const fetchedSettings = {
            ...settings,
            ...settingsDoc.data() as B8LeagueSettings
          };
          setSettings(fetchedSettings);
          setYoutubeLink(fetchedSettings.youtubeLink || 'https://www.youtube.com/embed/dQw4w9WgXcQ');
        } else {
          // If no settings document exists, create it with default values
          await setDoc(settingsRef, settings);
          setYoutubeLink(settings.youtubeLink);
        }
      } catch (error) {
        console.error('Error fetching B8 League settings:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, []);

  // Toggle section visibility for B8 League page
  const toggleSectionVisibility = async (section: keyof B8LeagueSettings) => {
    try {
      setSaving(true);
      
      // Update local state first for immediate UI feedback
      const updatedSettings = {
        ...settings,
        [section]: !settings[section]
      };
      setSettings(updatedSettings);
      
      // Save to Firestore
      const settingsRef = doc(db, 'settings', 'b8League');
      await setDoc(settingsRef, updatedSettings, { merge: true });
      
      // Show success message
      setMessage({
        text: `${section} ${!settings[section] ? 'enabled' : 'disabled'} successfully`,
        type: 'success'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(`Error toggling ${section}:`, error);
      
      // Revert local state on error
      setSettings(settings);
      
      // Show error message
      setMessage({
        text: `Failed to toggle ${section}`,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle YouTube link update
  const handleYoutubeLinkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Update local state first for immediate UI feedback
      const updatedSettings = {
        ...settings,
        youtubeLink
      };
      setSettings(updatedSettings);
      
      // Save to Firestore
      const settingsRef = doc(db, 'settings', 'b8League');
      await setDoc(settingsRef, updatedSettings, { merge: true });
      
      // Show success message
      setMessage({
        text: `YouTube link updated successfully`,
        type: 'success'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error(`Error updating YouTube link:`, error);
      
      // Show error message
      setMessage({
        text: `Failed to update YouTube link`,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Create a toggle button component to reduce duplication
  const VisibilityToggle = ({ section, label }: { section: keyof B8LeagueSettings, label: string }) => (
    <div className="admin-control-toggle">
      <span>{label}</span>
      <button 
        className="toggle-button"
        onClick={() => toggleSectionVisibility(section)}
        disabled={saving || loading}
      >
        {settings[section] ? (
          <FaToggleOn className="toggle-icon on" />
        ) : (
          <FaToggleOff className="toggle-icon off" />
        )}
      </button>
    </div>
  );

  return (
    <div className="admin-section">
      <h2>B8 League</h2>
      
      <div className="admin-control-section">
        <div 
          className="section-header-collapsible" 
          onClick={() => toggleSectionExpansion('visibility')}
        >
          <div className="section-header-content">
            <div className="expansion-icon">
              {expandedSections.visibility ? <FaChevronDown /> : <FaChevronRight />}
            </div>
            <h3>Section Visibility Controls</h3>
          </div>
        </div>
        
        {expandedSections.visibility && (
          <div className="section-content">
            <p className="admin-control-description">
              Control which sections are visible to users on the B8 League page.
            </p>
            
            <div className="section-toggles-grid">
              <VisibilityToggle section="showHero" label="Hero Section" />
              <VisibilityToggle section="showSportNavigation" label="Sport Navigation" />
              <VisibilityToggle section="showFootball" label="Football Content" />
              <VisibilityToggle section="showBadminton" label="Badminton Content" />
              <VisibilityToggle section="showEsports" label="Esports Content" />
              <VisibilityToggle section="showTournaments" label="Tournaments List" />
              <VisibilityToggle section="showTournamentCreator" label="Tournament Creator" />
              <VisibilityToggle section="showContact" label="Contact Section" />
            </div>
          </div>
        )}
      </div>
      
      {/* YouTube Link Control Section */}
      <div className="admin-control-section">
        <div 
          className="section-header-collapsible" 
          onClick={() => toggleSectionExpansion('youtube')}
        >
          <div className="section-header-content">
            <div className="expansion-icon">
              {expandedSections.youtube ? <FaChevronDown /> : <FaChevronRight />}
            </div>
            <h3>Hero Video Settings</h3>
          </div>
        </div>
        
        {expandedSections.youtube && (
          <div className="section-content">
            <p className="admin-control-description">
              Update the YouTube video displayed in the football section.
            </p>
            
            <form onSubmit={handleYoutubeLinkUpdate} className="youtube-link-form">
              <div className="form-group">
                <label htmlFor="youtubeLink">YouTube Embed Link:</label>
                <input
                  type="text"
                  id="youtubeLink"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://www.youtube.com/embed/..."
                  className="form-control"
                  disabled={loading || saving}
                  required
                />
                <small className="form-text">
                  Use the embed link format: https://www.youtube.com/embed/VIDEO_ID
                </small>
              </div>
              
              <button 
                type="submit" 
                className="admin-button" 
                disabled={loading || saving}
              >
                {saving ? 'Updating...' : 'Update Video Link'}
              </button>
            </form>
          </div>
        )}
      </div>
      
      {message && (
        <div className={`admin-message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <BusinessSection stats={stats} businessName="League" />
    </div>
  );
} 