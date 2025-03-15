import { BusinessSection } from '../../components/admin/BusinessSection';
import { BusinessStats } from '../../types/admin';
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FaToggleOn, FaToggleOff, FaChevronDown, FaChevronRight, FaTrash, FaEdit, FaUserMinus } from 'react-icons/fa';
import { Team, TeamMember } from '../../types/b8fc';
import { toast } from 'react-toastify';

interface AdminPortalB8LeagueProps {
  stats: BusinessStats;
}

// Define section IDs for expanded/collapsed state management
type SectionId = 'visibility' | 'youtube' | 'teams';

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

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormState, setEditFormState] = useState({ name: '', isPreset: false });
  
  // State for tracking expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState<Record<SectionId, boolean>>({
    visibility: true,
    youtube: false,
    teams: true
  });

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId: SectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Fetch teams and settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch settings
        const settingsRef = doc(db, 'settings', 'b8League');
        const settingsDoc = await getDoc(settingsRef);
        
        if (settingsDoc.exists()) {
          const fetchedSettings = {
            ...settings,
            ...settingsDoc.data() as B8LeagueSettings
          };
          setSettings(fetchedSettings);
          setYoutubeLink(fetchedSettings.youtubeLink || '');
        }

        // Fetch teams
        const teamsRef = collection(db, 'B8League/B8FC/teams');
        const teamsSnapshot = await getDocs(teamsRef);
        const fetchedTeams = teamsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];
        setTeams(fetchedTeams);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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
      
      toast.success(`${section} ${!settings[section] ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error(`Error toggling ${section}:`, error);
      
      // Revert local state on error
      setSettings(settings);
      toast.error(`Failed to toggle ${section}`);
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
      
      toast.success('YouTube link updated successfully');
    } catch (error) {
      console.error('Error updating YouTube link:', error);
      toast.error('Failed to update YouTube link');
    } finally {
      setSaving(false);
    }
  };

  // Handle team member removal
  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      setSaving(true);
      const teamRef = doc(db, 'B8League/B8FC/teams', teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (!teamDoc.exists()) {
        throw new Error('Team not found');
      }

      const teamData = teamDoc.data() as Team;
      const updatedMembers = teamData.members.filter(member => member.uid !== memberId);

      await updateDoc(teamRef, {
        members: updatedMembers
      });

      // Update local state
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === teamId 
            ? { ...team, members: updatedMembers }
            : team
        )
      );

      toast.success('Team member removed successfully');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    } finally {
      setSaving(false);
    }
  };

  // Handle team deletion
  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      await deleteDoc(doc(db, 'B8League/B8FC/teams', teamId));
      
      // Update local state
      setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
      toast.success('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    } finally {
      setSaving(false);
    }
  };

  // Handle team update
  const handleUpdateTeam = async (teamId: string, updatedData: Partial<Team>) => {
    try {
      setSaving(true);
      const teamRef = doc(db, 'B8League/B8FC/teams', teamId);
      await updateDoc(teamRef, updatedData);
      
      // Update local state
      setTeams(prevTeams => 
        prevTeams.map(team => 
          team.id === teamId 
            ? { ...team, ...updatedData }
            : team
        )
      );

      setShowEditModal(false);
      setEditingTeam(null);
      toast.success('Team updated successfully');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  // Update edit form state when editing team changes
  useEffect(() => {
    if (editingTeam) {
      setEditFormState({
        name: editingTeam.name,
        isPreset: editingTeam.isPreset
      });
    }
  }, [editingTeam]);

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

  // Team Edit Modal
  const TeamEditModal = () => {
    if (!editingTeam) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleUpdateTeam(editingTeam.id, editFormState);
    };

    return (
      <div className="admin-modal-overlay">
        <div className="admin-modal-content">
          <h3>Edit Team</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Team Name</label>
              <input
                type="text"
                value={editFormState.name}
                onChange={(e) => setEditFormState(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={editFormState.isPreset}
                  onChange={(e) => setEditFormState(prev => ({ ...prev, isPreset: e.target.checked }))}
                />
                Preset Team
              </label>
            </div>
            <div className="button-group">
              <button type="submit" disabled={saving}>Save Changes</button>
              <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-section">
      <h2>B8 League</h2>
      
      {/* Section Visibility Controls */}
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

      {/* B8FC Team Management Section */}
      <div className="admin-control-section">
        <div 
          className="section-header-collapsible" 
          onClick={() => toggleSectionExpansion('teams')}
        >
          <div className="section-header-content">
            <div className="expansion-icon">
              {expandedSections.teams ? <FaChevronDown /> : <FaChevronRight />}
            </div>
            <h3>B8FC Team Management</h3>
          </div>
        </div>
        
        {expandedSections.teams && (
          <div className="section-content">
            <div className="teams-list">
              {loading ? (
                <p>Loading teams...</p>
              ) : teams.length === 0 ? (
                <p>No teams found</p>
              ) : (
                teams.map(team => (
                  <div key={team.id} className="team-card">
                    <div className="team-header">
                      <h4>{team.name}</h4>
                      <div className="team-actions">
                        <button
                          onClick={() => {
                            setEditingTeam(team);
                            setShowEditModal(true);
                          }}
                          className="icon-button"
                          title="Edit team"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="icon-button delete"
                          title="Delete team"
                          disabled={team.isPreset}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="team-details">
                      <p>Members: {team.members.length}</p>
                      <p>Type: {team.isPreset ? 'Preset Team' : 'User Created'}</p>
                    </div>
                    {team.members.length > 0 && (
                      <div className="team-members">
                        <h5>Members</h5>
                        <ul>
                          {team.members.map((member: TeamMember) => (
                            <li key={member.uid}>
                              {member.name} ({member.role})
                              <button
                                onClick={() => handleRemoveMember(team.id, member.uid)}
                                className="icon-button small"
                                title="Remove member"
                              >
                                <FaUserMinus />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <BusinessSection stats={stats} businessName="League" />

      {/* Edit Modal */}
      {showEditModal && <TeamEditModal />}
    </div>
  );
} 