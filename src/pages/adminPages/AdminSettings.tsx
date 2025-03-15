import { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/firebase';
import { doc, getDoc, setDoc, collection, query, getDocs, updateDoc } from 'firebase/firestore';
import { FaGlobe, FaLock, FaToggleOn, FaToggleOff, FaExclamationTriangle, FaCodeBranch, FaUserCog, FaSearch, FaEye, FaEyeSlash, FaLayerGroup, FaChevronDown, FaChevronRight, FaCheckCircle, FaExclamationCircle, FaSpinner, FaInfoCircle } from 'react-icons/fa';
import { useBusinessAccess } from '../../contexts/BusinessAccessContext';
import '../../styles/adminStyles/AdminSettings.css';

// Define section IDs for expanded/collapsed state management
type SectionId = 'businessAccess' | 'comingSoon' | 'grayedOut' | 'passwordProtected' | 'developerAccess';

interface BusinessAccessibility {
  marketing: boolean;
  carClub: boolean;
  clothing: boolean;
  league: boolean;
  world: boolean;
  bgr8r: boolean;
  careers: boolean;
  bgr8: boolean;
  podcast: boolean;
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
  podcast: boolean;
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
  podcast: boolean;
  [key: string]: boolean;
}

// New interface for password-protected pages
interface BusinessPasswordProtected {
  marketing: boolean;
  carClub: boolean;
  clothing: boolean;
  league: boolean;
  world: boolean;
  bgr8r: boolean;
  careers: boolean;
  bgr8: boolean;
  podcast: boolean;
  [key: string]: boolean;
}

// Interface for page passwords
interface BusinessPasswords {
  marketing: string;
  carClub: string;
  clothing: string;
  league: string;
  world: string;
  bgr8r: string;
  careers: string;
  bgr8: string;
  podcast: string;
  [key: string]: string;
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
    bgr8: true,
    podcast: true
  });
  const [comingSoon, setComingSoon] = useState<BusinessComingSoon>({
    marketing: false,
    carClub: true,
    clothing: true,
    league: true,
    world: true,
    bgr8r: true,
    careers: true,
    bgr8: true,
    podcast: true
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
    bgr8: false,
    podcast: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { refreshBusinessAccess, refreshComingSoonStatus, refreshGrayedOutStatus } = useBusinessAccess();

  // New state for tracking expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState<Record<SectionId, boolean>>({
    businessAccess: true, // Start with first section expanded
    comingSoon: false,
    grayedOut: false,
    passwordProtected: false,
    developerAccess: false
  });

  // New state for password protection
  const [passwordProtected, setPasswordProtected] = useState<BusinessPasswordProtected>({
    marketing: false,
    carClub: false,
    clothing: false,
    league: false,
    world: false,
    bgr8r: false,
    careers: false,
    bgr8: false,
    podcast: false
  });
  
  // New state for page passwords
  const [businessPasswords, setBusinessPasswords] = useState<BusinessPasswords>({
    marketing: '',
    carClub: '',
    clothing: '',
    league: '',
    world: '',
    bgr8r: '',
    careers: '',
    bgr8: '',
    podcast: ''
  });

  // First, add a new state to track which business is currently saving
  const [savingBusiness, setSavingBusiness] = useState<string | null>(null);

  // Add a timeout ref at the component level
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const businessNames: Record<string, string> = {
    marketing: 'B8 Marketing',
    carClub: 'B8 Car Club',
    clothing: 'B8 Clothing',
    league: 'B8 League',
    world: 'B8 World',
    bgr8r: 'Bgr8r',
    careers: 'B8 Careers',
    bgr8: 'BGr8',
    podcast: 'B8 Podcast'
  };

  useEffect(() => {
    fetchSettings();
    fetchComingSoonSettings();
    fetchGrayedOutSettings();
    fetchPasswordProtectionSettings();
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

  // New method for fetching password protection settings
  const fetchPasswordProtectionSettings = async () => {
    try {
      const passwordProtectedRef = doc(db, 'settings', 'passwordProtected');
      const passwordProtectedDoc = await getDoc(passwordProtectedRef);
      
      if (passwordProtectedDoc.exists()) {
        const data = passwordProtectedDoc.data();
        // Check if data has the expected structure
        if (data.passwordProtected) {
          setPasswordProtected(data.passwordProtected);
        } else {
          // If the structure is flat, use it directly
          const protectedSettings: BusinessPasswordProtected = { ...passwordProtected };
          Object.keys(passwordProtected).forEach(key => {
            if (data[key] !== undefined) {
              protectedSettings[key] = data[key];
            }
          });
          setPasswordProtected(protectedSettings);
        }
        
        // Same for business passwords
        if (data.businessPasswords) {
          setBusinessPasswords(data.businessPasswords);
        } else {
          // If the structure is flat, use it directly
          const passwordSettings: BusinessPasswords = { ...businessPasswords };
          Object.keys(businessPasswords).forEach(key => {
            if (data[`password_${key}`] !== undefined) {
              passwordSettings[key] = data[`password_${key}`];
            }
          });
          setBusinessPasswords(passwordSettings);
        }
      } else {
        // If no password protection document exists, create one with default values
        await setDoc(passwordProtectedRef, { 
          passwordProtected,
          businessPasswords
        });
      }
    } catch (error) {
      console.error('Error fetching password protection settings:', error);
      setErrorMessage('Failed to load password protection settings. Please try again.');
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

  const toggleAccess = async (business: string) => {
    try {
      // Update local state first for immediate UI feedback
      const newValue = !businessAccess[business];
      setBusinessAccess(prev => ({
        ...prev,
        [business]: newValue
      }));
      
      // Show saving indicator
      setSaving('businessAccess');
      setSavingBusiness(business);
      
      // Update Firebase - Fix: Update the field directly without nesting
      const businessAccessRef = doc(db, 'settings', 'businessAccess');
      await updateDoc(businessAccessRef, {
        [business]: newValue
      });
      
      // Refresh context if available
      if (refreshBusinessAccess) {
        await refreshBusinessAccess();
      }
      
      // Show success message briefly
      setSuccessMessage(`${business} access ${newValue ? 'enabled' : 'disabled'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating business access:', error);
      
      // Revert local state on error
      setBusinessAccess(prev => ({
        ...prev,
        [business]: !prev[business]
      }));
      
      // Show error message
      setErrorMessage(`Failed to update ${business} access. Please try again.`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
      setSavingBusiness(null);
    }
  };

  const toggleComingSoon = async (business: string) => {
    try {
      // Update local state first for immediate UI feedback
      const newValue = !comingSoon[business];
      setComingSoon(prev => ({
        ...prev,
        [business]: newValue
      }));
      
      // Show saving indicator
      setSaving('comingSoon');
      setSavingBusiness(business);
      
      // Update Firebase - Fix: Update the correct document and field directly
      const comingSoonRef = doc(db, 'settings', 'comingSoon');
      await updateDoc(comingSoonRef, {
        [business]: newValue
      });
      
      // Refresh context if available
      if (refreshComingSoonStatus) {
        await refreshComingSoonStatus();
      }
      
      // Show success message briefly
      setSuccessMessage(`${business} coming soon status ${newValue ? 'enabled' : 'disabled'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating coming soon status:', error);
      
      // Revert local state on error
      setComingSoon(prev => ({
        ...prev,
        [business]: !prev[business]
      }));
      
      // Show error message
      setErrorMessage(`Failed to update ${business} coming soon status. Please try again.`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
      setSavingBusiness(null);
    }
  };

  const toggleGrayedOut = async (business: string) => {
    try {
      // Update local state first for immediate UI feedback
      const newValue = !grayedOut[business];
      setGrayedOut(prev => ({
        ...prev,
        [business]: newValue
      }));
      
      // Show saving indicator
      setSaving('grayedOut');
      setSavingBusiness(business);
      
      // Update Firebase - Fix: Update the correct document and field directly
      const grayedOutRef = doc(db, 'settings', 'grayedOut');
      await updateDoc(grayedOutRef, {
        [business]: newValue
      });
      
      // Refresh context if available
      if (refreshGrayedOutStatus) {
        await refreshGrayedOutStatus();
      }
      
      // Show success message briefly
      setSuccessMessage(`${business} grayed out status ${newValue ? 'enabled' : 'disabled'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating grayed out status:', error);
      
      // Revert local state on error
      setGrayedOut(prev => ({
        ...prev,
        [business]: !prev[business]
      }));
      
      // Show error message
      setErrorMessage(`Failed to update ${business} grayed out status. Please try again.`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
      setSavingBusiness(null);
    }
  };

  const togglePasswordProtection = async (business: string) => {
    try {
      // Update local state first for immediate UI feedback
      const newValue = !passwordProtected[business];
      setPasswordProtected(prev => ({
        ...prev,
        [business]: newValue
      }));
      
      // Show saving indicator
      setSaving('passwordProtected');
      setSavingBusiness(business);
      
      // Update Firebase - Fix: Update the passwordProtected field directly
      const passwordProtectedRef = doc(db, 'settings', 'passwordProtected');
      await updateDoc(passwordProtectedRef, {
        [`passwordProtected.${business}`]: newValue
      });
      
      // Show success message briefly
      setSuccessMessage(`${business} password protection ${newValue ? 'enabled' : 'disabled'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating password protection:', error);
      
      // Revert local state on error
      setPasswordProtected(prev => ({
        ...prev,
        [business]: !prev[business]
      }));
      
      // Show error message
      setErrorMessage(`Failed to update ${business} password protection. Please try again.`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
      setSavingBusiness(null);
    }
  };

  // Update the updateBusinessPassword function to use a separate function for saving
  const updateBusinessPassword = (business: string, password: string) => {
    // Just update local state immediately
    setBusinessPasswords(prev => ({
      ...prev,
      [business]: password
    }));
  };

  // Add a new function to save the password with debounce
  const saveBusinessPassword = async (business: string, password: string) => {
    try {
      // Only save to Firebase if we have a non-empty password
      if (password.trim() !== '') {
        // Show saving indicator
        setSaving('passwordProtected');
        setSavingBusiness(business);
        
        // Update Firebase - Fix: Update the businessPasswords field directly
        const passwordProtectedRef = doc(db, 'settings', 'passwordProtected');
        await updateDoc(passwordProtectedRef, {
          [`businessPasswords.${business}`]: password
        });
        
        // Show success message briefly
        setSuccessMessage(`${business} password updated successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating business password:', error);
      
      // Show error message
      setErrorMessage(`Failed to update ${business} password. Please try again.`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
      setSavingBusiness(null);
    }
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

  const getAccessCount = () => {
    return Object.values(businessAccess).filter(Boolean).length;
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle section expansion
  const toggleSectionExpansion = (sectionId: SectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Clean up the timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return <div className="admin-loading">Loading settings...</div>;
  }

  return (
    <div className="admin-settings">
      <section className="settings-section">
        <div 
          className="section-header-collapsible" 
          onClick={() => toggleSectionExpansion('businessAccess')}
        >
          <div className="section-header-content">
            <div className="expansion-icon">
              {expandedSections.businessAccess ? <FaChevronDown /> : <FaChevronRight />}
            </div>
            <h3>Business Accessibility</h3>
          </div>
        </div>
        
        {expandedSections.businessAccess && (
          <div className="section-content">
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
                      {savingBusiness === business && saving === 'businessAccess' ? (
                        <FaSpinner className="spinner" />
                      ) : businessAccess[business] ? (
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
            
            {/* Settings are saved automatically when toggled */}
            <div className="settings-note">
              <FaInfoCircle /> Changes are saved automatically
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <div 
          className="section-header-collapsible" 
          onClick={() => toggleSectionExpansion('comingSoon')}
        >
          <div className="section-header-content">
            <div className="expansion-icon">
              {expandedSections.comingSoon ? <FaChevronDown /> : <FaChevronRight />}
            </div>
            <h3>Coming Soon Status</h3>
          </div>
        </div>
        
        {expandedSections.comingSoon && (
          <div className="section-content">
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
                      {savingBusiness === business && saving === 'comingSoon' ? (
                        <FaSpinner className="spinner" />
                      ) : !comingSoon[business] ? (
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
            
            {/* Settings are saved automatically when toggled */}
            <div className="settings-note">
              <FaInfoCircle /> Changes are saved automatically
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <div 
          className="section-header-collapsible" 
          onClick={() => toggleSectionExpansion('grayedOut')}
        >
          <div className="section-header-content">
            <div className="expansion-icon">
              {expandedSections.grayedOut ? <FaChevronDown /> : <FaChevronRight />}
            </div>
            <h3>Coming Soon Page Overlay</h3>
          </div>
        </div>
        
        {expandedSections.grayedOut && (
          <div className="section-content">
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
                      {savingBusiness === business && saving === 'grayedOut' ? (
                        <FaSpinner className="spinner" />
                      ) : !grayedOut[business] ? (
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
            
            {/* Settings are saved automatically when toggled */}
            <div className="settings-note">
              <FaInfoCircle /> Changes are saved automatically
            </div>
          </div>
        )}
      </section>
      
      <section className="settings-section">
        <div 
          className="section-header-collapsible" 
          onClick={() => toggleSectionExpansion('passwordProtected')}
        >
          <div className="section-header-content">
            <div className="expansion-icon">
              {expandedSections.passwordProtected ? <FaChevronDown /> : <FaChevronRight />}
            </div>
            <h3>Password Protected Pages</h3>
          </div>
        </div>
        
        {expandedSections.passwordProtected && (
          <div className="section-content">
            <p className="settings-description">
              Control which businesses require password protection. Users will need to enter the correct password to access protected pages.
            </p>
            
            <div className="business-access-grid">
              {Object.keys(businessNames).map(business => (
                <div 
                  key={business} 
                  className={`business-access-card ${passwordProtected[business] ? 'active' : 'inactive'}`}
                >
                  <div className="business-access-header">
                    <span>{businessNames[business]}</span>
                    <div 
                      className="toggle-button" 
                      onClick={() => togglePasswordProtection(business)}
                    >
                      {savingBusiness === business && saving === 'passwordProtected' ? (
                        <FaSpinner className="spinner" />
                      ) : passwordProtected[business] ? (
                        <FaToggleOn className="toggle-icon on" />
                      ) : (
                        <FaToggleOff className="toggle-icon off" />
                      )}
                    </div>
                  </div>
                  
                  <div className="business-access-status">
                    {passwordProtected[business] ? (
                      <>
                        <FaLock className="status-icon private" />
                        <span className="status-text private">Password Protected</span>
                      </>
                    ) : (
                      <>
                        <FaGlobe className="status-icon public" />
                        <span className="status-text public">No Password</span>
                      </>
                    )}
                  </div>
                  
                  {passwordProtected[business] && (
                    <div className="password-input-container">
                      <input
                        type="text"
                        placeholder="Set page password"
                        value={businessPasswords[business]}
                        onChange={(e) => {
                          const newPassword = e.target.value;
                          updateBusinessPassword(business, newPassword);
                          
                          // Use a timeout for debouncing
                          if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                          }
                          
                          timeoutRef.current = setTimeout(() => {
                            saveBusinessPassword(business, newPassword);
                          }, 1000);
                        }}
                        className="password-input"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Settings are saved automatically when toggled */}
            <div className="settings-note">
              <FaInfoCircle /> Changes are saved automatically
            </div>
          </div>
        )}
      </section>
      
      <section className="settings-section">
        <div 
          className="section-header-collapsible" 
          onClick={() => toggleSectionExpansion('developerAccess')}
        >
          <div className="section-header-content">
            <div className="expansion-icon">
              {expandedSections.developerAccess ? <FaChevronDown /> : <FaChevronRight />}
            </div>
            <h3>Developer Access Management</h3>
          </div>
        </div>
        
        {expandedSections.developerAccess && (
          <div className="section-content">
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
          </div>
        )}
      </section>
      
      {successMessage && (
        <div className="settings-success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="settings-error-message">
          <FaExclamationCircle /> {errorMessage}
        </div>
      )}
    </div>
  );
} 