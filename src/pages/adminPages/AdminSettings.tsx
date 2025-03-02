import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, query, getDocs, updateDoc } from 'firebase/firestore';
import { FaGlobe, FaLock, FaToggleOn, FaToggleOff, FaSave, FaExclamationTriangle, FaCodeBranch, FaUserCog, FaSearch, FaEye, FaEyeSlash, FaLayerGroup } from 'react-icons/fa';
import { useBusinessAccess } from '../../contexts/BusinessAccessContext';
import '../../styles/adminStyles/AdminSettings.css';

interface BusinessAccessibility {
  marketing: boolean;
  carClub: boolean;
  clothing: boolean;
  league: boolean;
  world: boolean;
  bgr8r: boolean;
  careers: boolean;
  bgr8: boolean;
  [key: string]: boolean;
}

interface BusinessComingSoon {
  marketing: boolean;
  carClub: boolean;
  clothing: boolean;
  league: boolean;
  world: boolean;
  bgr8r: boolean;
  careers: boolean;
  bgr8: boolean;
  [key: string]: boolean;
}

// New interface for grayed out pages
interface BusinessGrayedOut {
  marketing: boolean;
  carClub: boolean;
  clothing: boolean;
  league: boolean;
  world: boolean;
  bgr8r: boolean;
  careers: boolean;
  bgr8: boolean;
  [key: string]: boolean;
}

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  developer: boolean;
}

export function AdminSettings() {
  const [businessAccess, setBusinessAccess] = useState<BusinessAccessibility>({
    marketing: true,
    carClub: true,
    clothing: true,
    league: true,
    world: true,
    bgr8r: true,
    careers: true,
    bgr8: true
  });
  const [comingSoon, setComingSoon] = useState<BusinessComingSoon>({
    marketing: false,
    carClub: true,
    clothing: true,
    league: true,
    world: true,
    bgr8r: true,
    careers: true,
    bgr8: true
  });
  // New state for grayed out pages
  const [grayedOut, setGrayedOut] = useState<BusinessGrayedOut>({
    marketing: false,
    carClub: false,
    clothing: false,
    league: false,
    world: false,
    bgr8r: false,
    careers: false,
    bgr8: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { refreshBusinessAccess, refreshComingSoonStatus, refreshGrayedOutStatus } = useBusinessAccess();

  const businessNames: Record<string, string> = {
    marketing: 'B8 Marketing',
    carClub: 'B8 Car Club',
    clothing: 'B8 Clothing',
    league: 'B8 League',
    world: 'B8 World',
    bgr8r: 'Bgr8r',
    careers: 'B8 Careers',
    bgr8: 'BGr8'
  };

  useEffect(() => {
    fetchSettings();
    fetchComingSoonSettings();
    fetchGrayedOutSettings();
    fetchUsers();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(db, 'settings', 'businessAccess');
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        setBusinessAccess(settingsDoc.data() as BusinessAccessibility);
      } else {
        // If no settings document exists, create one with default values
        await setDoc(settingsRef, businessAccess);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setErrorMessage('Failed to load settings. Please try again.');
      setLoading(false);
    }
  };

  const fetchComingSoonSettings = async () => {
    try {
      const comingSoonRef = doc(db, 'settings', 'comingSoon');
      const comingSoonDoc = await getDoc(comingSoonRef);
      
      if (comingSoonDoc.exists()) {
        setComingSoon(comingSoonDoc.data() as BusinessComingSoon);
      } else {
        // If no coming soon document exists, create one with default values
        await setDoc(comingSoonRef, comingSoon);
      }
    } catch (error) {
      console.error('Error fetching coming soon settings:', error);
      setErrorMessage('Failed to load coming soon settings. Please try again.');
    }
  };

  // New method for fetching grayed out settings
  const fetchGrayedOutSettings = async () => {
    try {
      const grayedOutRef = doc(db, 'settings', 'grayedOut');
      const grayedOutDoc = await getDoc(grayedOutRef);
      
      if (grayedOutDoc.exists()) {
        setGrayedOut(grayedOutDoc.data() as BusinessGrayedOut);
      } else {
        // If no grayed out document exists, create one with default values
        await setDoc(grayedOutRef, grayedOut);
      }
    } catch (error) {
      console.error('Error fetching grayed out settings:', error);
      setErrorMessage('Failed to load grayed out settings. Please try again.');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(query(usersRef));
      
      const userData: UserData[] = [];
      
      querySnapshot.forEach((doc) => {
        const user = doc.data();
        userData.push({
          uid: user.uid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          admin: user.admin || false,
          developer: user.developer || false
        });
      });
      
      setUsers(userData);
      setLoadingUsers(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoadingUsers(false);
    }
  };

  const toggleAccess = (business: string) => {
    setBusinessAccess(prev => ({
      ...prev,
      [business]: !prev[business]
    }));
  };

  const toggleComingSoon = (business: string) => {
    setComingSoon(prev => ({
      ...prev,
      [business]: !prev[business]
    }));
  };

  // New toggle method for grayed out pages
  const toggleGrayedOut = (business: string) => {
    setGrayedOut(prev => ({
      ...prev,
      [business]: !prev[business]
    }));
  };

  const toggleUserDeveloper = async (userId: string, isDeveloper: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        developer: !isDeveloper
      });
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.uid === userId 
            ? { ...user, developer: !isDeveloper } 
            : user
        )
      );
      
      setSuccessMessage(`User ${!isDeveloper ? 'granted' : 'removed from'} developer access`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating user developer status:', error);
      setErrorMessage('Failed to update developer status. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      // Save business access settings
      const settingsRef = doc(db, 'settings', 'businessAccess');
      await setDoc(settingsRef, businessAccess);
      
      // Save coming soon settings
      const comingSoonRef = doc(db, 'settings', 'comingSoon');
      await setDoc(comingSoonRef, comingSoon);
      
      // Save grayed out settings
      const grayedOutRef = doc(db, 'settings', 'grayedOut');
      await setDoc(grayedOutRef, grayedOut);
      
      // Refresh the contexts to update navigation and homepage
      await Promise.all([
        refreshBusinessAccess(),
        refreshComingSoonStatus(),
        refreshGrayedOutStatus()
      ]);
      
      setSuccessMessage('Settings saved successfully! Navigation and business pages have been updated.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getAccessCount = () => {
    return Object.values(businessAccess).filter(Boolean).length;
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="admin-loading">Loading settings...</div>;
  }

  return (
    <div className="admin-settings">
      <section className="settings-section">
        <h3>Business Accessibility</h3>
        <p className="settings-description">
          Control which business sections are accessible to the public. Toggling a business off will 
          prevent users from accessing it through the navigation menu.
        </p>
        
        {getAccessCount() === 0 && (
          <div className="settings-warning">
            <FaExclamationTriangle /> Warning: All businesses are currently set to private. 
            Users will not be able to access any business section.
          </div>
        )}
        
        <div className="business-access-grid">
          {Object.keys(businessNames).map(business => (
            <div 
              key={business} 
              className={`business-access-card ${businessAccess[business] ? 'active' : 'inactive'}`}
            >
              <div className="business-access-header">
                <span>{businessNames[business]}</span>
                <div 
                  className="toggle-button" 
                  onClick={() => toggleAccess(business)}
                >
                  {businessAccess[business] ? (
                    <FaToggleOn className="toggle-icon on" />
                  ) : (
                    <FaToggleOff className="toggle-icon off" />
                  )}
                </div>
              </div>
              
              <div className="business-access-status">
                {businessAccess[business] ? (
                  <>
                    <FaGlobe className="status-icon public" />
                    <span className="status-text public">Public</span>
                  </>
                ) : (
                  <>
                    <FaLock className="status-icon private" />
                    <span className="status-text private">Private</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="settings-note">
          <strong>Note:</strong> Admins and developers will always have access to all business sections regardless of these settings.
        </div>
      </section>

      <section className="settings-section">
        <h3>Coming Soon Status</h3>
        <p className="settings-description">
          Control which businesses display a "Coming Soon" banner on the homepage. Use this to indicate which businesses 
          are not yet officially launched to the public.
        </p>
        
        <div className="business-access-grid">
          {Object.keys(businessNames).map(business => (
            <div 
              key={business} 
              className={`business-access-card ${!comingSoon[business] ? 'active' : 'inactive'}`}
            >
              <div className="business-access-header">
                <span>{businessNames[business]}</span>
                <div 
                  className="toggle-button" 
                  onClick={() => toggleComingSoon(business)}
                >
                  {!comingSoon[business] ? (
                    <FaToggleOn className="toggle-icon on" />
                  ) : (
                    <FaToggleOff className="toggle-icon off" />
                  )}
                </div>
              </div>
              
              <div className="business-access-status">
                {!comingSoon[business] ? (
                  <>
                    <FaEye className="status-icon public" />
                    <span className="status-text public">Visible</span>
                  </>
                ) : (
                  <>
                    <FaEyeSlash className="status-icon private" />
                    <span className="status-text private">Coming Soon</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="settings-note">
          <strong>Note:</strong> The "Coming Soon" banner will only appear on the homepage and won't affect the actual 
          accessibility of the business pages. Users can still access the pages through the navigation menu if 
          accessibility is enabled.
        </div>
      </section>

      {/* New section for grayed out pages */}
      <section className="settings-section">
        <h3>Coming Soon Page Overlay</h3>
        <p className="settings-description">
          Add a "Coming Soon" overlay strip across business pages. This creates a visual indication that 
          the page content is still in development, even if users can access it.
        </p>
        
        <div className="business-access-grid">
          {Object.keys(businessNames).map(business => (
            <div 
              key={business} 
              className={`business-access-card ${!grayedOut[business] ? 'active' : 'inactive'}`}
            >
              <div className="business-access-header">
                <span>{businessNames[business]}</span>
                <div 
                  className="toggle-button" 
                  onClick={() => toggleGrayedOut(business)}
                >
                  {!grayedOut[business] ? (
                    <FaToggleOn className="toggle-icon on" />
                  ) : (
                    <FaToggleOff className="toggle-icon off" />
                  )}
                </div>
              </div>
              
              <div className="business-access-status">
                {!grayedOut[business] ? (
                  <>
                    <FaLayerGroup className="status-icon public" />
                    <span className="status-text public">No Overlay</span>
                  </>
                ) : (
                  <>
                    <FaLayerGroup className="status-icon private" />
                    <span className="status-text private">Has Overlay</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="settings-note">
          <strong>Note:</strong> The "Coming Soon" overlay will appear on the business pages themselves, 
          indicating to users that the content is under development. Unlike the accessibility setting, this 
          doesn't prevent access to the page but provides a visual cue that it's not fully ready.
        </div>
        
        <div className="settings-actions">
          <button 
            className="save-button"
            onClick={saveSettings}
            disabled={saving}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>Developer Access Management</h3>
        <p className="settings-description">
          Grant developer status to users who need access to all business sections for development and testing purposes. 
          Developers will be able to see all navigation links regardless of business accessibility settings.
        </p>
        
        <div className="search-container">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="developer-search-input"
            />
          </div>
        </div>
        
        {loadingUsers ? (
          <div className="admin-loading">Loading users...</div>
        ) : (
          <div className="developers-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <tr key={user.uid}>
                      <td>{`${user.firstName} ${user.lastName}`}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`developer-status ${user.developer ? 'active' : 'inactive'}`}>
                          {user.developer ? (
                            <>
                              <FaCodeBranch /> Developer
                            </>
                          ) : (
                            'Regular User'
                          )}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`action-button ${user.developer ? 'remove' : 'add'}`}
                          onClick={() => toggleUserDeveloper(user.uid, user.developer)}
                        >
                          <FaUserCog /> {user.developer ? 'Remove Developer Access' : 'Grant Developer Access'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="no-results">No users found matching your search</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
      
      {(successMessage || errorMessage) && (
        <div className={`settings-message ${errorMessage ? 'error' : 'success'}`}>
          {successMessage || errorMessage}
        </div>
      )}
    </div>
  );
} 