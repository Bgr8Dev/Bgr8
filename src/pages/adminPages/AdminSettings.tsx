import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useBusinessAccess } from '../../contexts/BusinessAccessContext';
import { FaEye, FaEyeSlash, FaLock, FaUserCog, FaCheck, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../../styles/adminStyles/AdminSettings.css';

type SectionId = 'businessAccess' | 'comingSoon' | 'grayedOut' | 'passwordProtected' | 'developerAccess';

interface BusinessAccessibility {
  bgr8: boolean;
  bgr8r: boolean;
  [key: string]: boolean;
}

interface BusinessComingSoon {
  bgr8: boolean;
  bgr8r: boolean;
  [key: string]: boolean;
}

interface BusinessGrayedOut {
  bgr8: boolean;
  bgr8r: boolean;
  [key: string]: boolean;
}

interface BusinessPasswordProtected {
  bgr8: boolean;
  bgr8r: boolean;
  [key: string]: boolean;
}

interface BusinessPasswords {
  bgr8: string;
  bgr8r: string;
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
  const { refreshBusinessAccess, refreshComingSoonStatus, refreshGrayedOutStatus, refreshPasswordProtectionStatus } = useBusinessAccess();
  
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['businessAccess'] as SectionId[]));
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState<string>('');
  const [savingBusiness, setSavingBusiness] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const [businessAccess, setBusinessAccess] = useState<BusinessAccessibility>({
    bgr8: true,
    bgr8r: true
  });
  
  const [comingSoon, setComingSoon] = useState<BusinessComingSoon>({
    bgr8: true,
    bgr8r: true
  });
  
  const [grayedOut, setGrayedOut] = useState<BusinessGrayedOut>({
    bgr8: false,
    bgr8r: false
  });
  
  const [passwordProtected, setPasswordProtected] = useState<BusinessPasswordProtected>({
    bgr8: false,
    bgr8r: false
  });
  
  const [businessPasswords, setBusinessPasswords] = useState<BusinessPasswords>({
    bgr8: '',
    bgr8r: ''
  });
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [editingPassword, setEditingPassword] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string>('');



  const businessNames: Record<string, string> = {
    bgr8r: 'Bgr8r',
    bgr8: 'BGr8'
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
      const newValue = !comingSoon[business];
      setComingSoon(prev => ({
        ...prev,
        [business]: newValue
      }));
      
      setSaving('comingSoon');
      setSavingBusiness(business);
      
      const comingSoonRef = doc(db, 'settings', 'comingSoon');
      await updateDoc(comingSoonRef, {
        [business]: newValue
      });
      
      if (refreshComingSoonStatus) {
        await refreshComingSoonStatus();
      }
      
      setSuccessMessage(`${business} coming soon ${newValue ? 'enabled' : 'disabled'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating coming soon status:', error);
      setComingSoon(prev => ({
        ...prev,
        [business]: !prev[business]
      }));
      setErrorMessage(`Failed to update ${business} coming soon status. Please try again.`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
      setSavingBusiness(null);
    }
  };

  const toggleGrayedOut = async (business: string) => {
    try {
      const newValue = !grayedOut[business];
      setGrayedOut(prev => ({
        ...prev,
        [business]: newValue
      }));
      
      setSaving('grayedOut');
      setSavingBusiness(business);
      
      const grayedOutRef = doc(db, 'settings', 'grayedOut');
      await updateDoc(grayedOutRef, {
        [business]: newValue
      });
      
      if (refreshGrayedOutStatus) {
        await refreshGrayedOutStatus();
      }
      
      setSuccessMessage(`${business} grayed out ${newValue ? 'enabled' : 'disabled'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating grayed out status:', error);
      setGrayedOut(prev => ({
        ...prev,
        [business]: !prev[business]
      }));
      setErrorMessage(`Failed to update ${business} grayed out status. Please try again.`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
      setSavingBusiness(null);
    }
  };

  const togglePasswordProtection = async (business: string) => {
    try {
      const newValue = !passwordProtected[business];
      setPasswordProtected(prev => ({
        ...prev,
        [business]: newValue
      }));
      
      setSaving('passwordProtected');
      setSavingBusiness(business);
      
      const passwordProtectedRef = doc(db, 'settings', 'passwordProtected');
      await updateDoc(passwordProtectedRef, {
        [business]: newValue
      });
      
      if (refreshPasswordProtectionStatus) {
        await refreshPasswordProtectionStatus();
      }
      
      setSuccessMessage(`${business} password protection ${newValue ? 'enabled' : 'disabled'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating password protection status:', error);
      setPasswordProtected(prev => ({
        ...prev,
        [business]: !prev[business]
      }));
      setErrorMessage(`Failed to update ${business} password protection status. Please try again.`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSaving('');
      setSavingBusiness(null);
    }
  };



  const saveBusinessPassword = async (business: string, password: string) => {
    try {
      setSaving('passwordProtected');
      setSavingBusiness(business);
      
      const passwordProtectedRef = doc(db, 'settings', 'passwordProtected');
      await updateDoc(passwordProtectedRef, {
        [`businessPasswords.${business}`]: password
      });
      
      if (refreshPasswordProtectionStatus) {
        await refreshPasswordProtectionStatus();
      }
      
      setSuccessMessage(`${business} password updated successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingPassword(null);
      setTempPassword('');
    } catch (error) {
      console.error('Error updating business password:', error);
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
      setUsers(prev => prev.map(user => 
        user.uid === userId 
          ? { ...user, developer: !isDeveloper }
          : user
      ));
      
      setSuccessMessage(`Developer access ${!isDeveloper ? 'granted' : 'revoked'} successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating developer status:', error);
      setErrorMessage('Failed to update developer status. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const getAccessCount = () => {
    return Object.values(businessAccess).filter(Boolean).length;
  };

  const toggleSectionExpansion = (sectionId: SectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  if (loading) {
    return <div className="admin-settings-loading">Loading settings...</div>;
  }

  return (
    <div className="admin-settings">
      <h2>Admin Settings</h2>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <div className="settings-sections">
        {/* Business Access Section */}
        <div className="settings-section">
          <div 
            className="section-header"
            onClick={() => toggleSectionExpansion('businessAccess')}
          >
            <div className="section-title">
              <FaEye /> Business Access Control
            </div>
            <div className="section-stats">
              {getAccessCount()} of {Object.keys(businessAccess).length} enabled
            </div>
            {expandedSections.has('businessAccess') ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          
          {expandedSections.has('businessAccess') && (
            <div className="section-content">
              <p>Control which businesses are accessible to users.</p>
              <div className="business-toggles">
                {(['bgr8', 'bgr8r'] as const).map((business) => {
                  const isEnabled = businessAccess[business];
                  return (
                    <div key={business} className="business-toggle">
                      <div className="business-info">
                        <span className="business-name">{businessNames[business] || business}</span>
                        <span className={`status-badge ${isEnabled ? 'enabled' : 'disabled'}`}>
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <button
                        className={`toggle-button ${isEnabled ? 'enabled' : 'disabled'} ${saving === 'businessAccess' && savingBusiness === business ? 'saving' : ''}`}
                        onClick={() => toggleAccess(business)}
                        disabled={saving === 'businessAccess'}
                      >
                        {saving === 'businessAccess' && savingBusiness === business ? 'Saving...' : (isEnabled ? 'Disable' : 'Enable')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Coming Soon Section */}
        <div className="settings-section">
          <div 
            className="section-header"
            onClick={() => toggleSectionExpansion('comingSoon')}
          >
            <div className="section-title">
              <FaEyeSlash /> Coming Soon Overlay
            </div>
            <div className="section-stats">
              {Object.values(comingSoon).filter(Boolean).length} of {Object.keys(comingSoon).length} enabled
            </div>
            {expandedSections.has('comingSoon') ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          
          {expandedSections.has('comingSoon') && (
            <div className="section-content">
              <p>Show "Coming Soon" overlay for businesses under development.</p>
              <div className="business-toggles">
                {(['bgr8', 'bgr8r'] as const).map((business) => {
                  const isEnabled = comingSoon[business];
                  return (
                    <div key={business} className="business-toggle">
                      <div className="business-info">
                        <span className="business-name">{businessNames[business] || business}</span>
                        <span className={`status-badge ${isEnabled ? 'enabled' : 'disabled'}`}>
                          {isEnabled ? 'Coming Soon' : 'Live'}
                        </span>
                      </div>
                      <button
                        className={`toggle-button ${isEnabled ? 'enabled' : 'disabled'} ${saving === 'comingSoon' && savingBusiness === business ? 'saving' : ''}`}
                        onClick={() => toggleComingSoon(business)}
                        disabled={saving === 'comingSoon'}
                      >
                        {saving === 'comingSoon' && savingBusiness === business ? 'Saving...' : (isEnabled ? 'Make Live' : 'Set Coming Soon')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Grayed Out Section */}
        <div className="settings-section">
          <div 
            className="section-header"
            onClick={() => toggleSectionExpansion('grayedOut')}
          >
            <div className="section-title">
              <FaEyeSlash /> Grayed Out Pages
            </div>
            <div className="section-stats">
              {Object.values(grayedOut).filter(Boolean).length} of {Object.keys(grayedOut).length} enabled
            </div>
            {expandedSections.has('grayedOut') ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          
          {expandedSections.has('grayedOut') && (
            <div className="section-content">
              <p>Gray out pages to indicate they are not fully functional.</p>
              <div className="business-toggles">
                {(['bgr8', 'bgr8r'] as const).map((business) => {
                  const isEnabled = grayedOut[business];
                  return (
                    <div key={business} className="business-toggle">
                      <div className="business-info">
                        <span className="business-name">{businessNames[business] || business}</span>
                        <span className={`status-badge ${isEnabled ? 'enabled' : 'disabled'}`}>
                          {isEnabled ? 'Grayed Out' : 'Normal'}
                        </span>
                      </div>
                      <button
                        className={`toggle-button ${isEnabled ? 'enabled' : 'disabled'} ${saving === 'grayedOut' && savingBusiness === business ? 'saving' : ''}`}
                        onClick={() => toggleGrayedOut(business)}
                        disabled={saving === 'grayedOut'}
                      >
                        {saving === 'grayedOut' && savingBusiness === business ? 'Saving...' : (isEnabled ? 'Remove Gray' : 'Gray Out')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Password Protection Section */}
        <div className="settings-section">
          <div 
            className="section-header"
            onClick={() => toggleSectionExpansion('passwordProtected')}
          >
            <div className="section-title">
              <FaLock /> Password Protection
            </div>
            <div className="section-stats">
              {Object.values(passwordProtected).filter(Boolean).length} of {Object.keys(passwordProtected).length} protected
            </div>
            {expandedSections.has('passwordProtected') ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          
          {expandedSections.has('passwordProtected') && (
            <div className="section-content">
              <p>Protect pages with passwords for exclusive access.</p>
              <div className="business-toggles">
                {(['bgr8', 'bgr8r'] as const).map((business) => {
                  const isEnabled = passwordProtected[business];
                  return (
                    <div key={business} className="business-toggle">
                      <div className="business-info">
                        <span className="business-name">{businessNames[business] || business}</span>
                        <span className={`status-badge ${isEnabled ? 'enabled' : 'disabled'}`}>
                          {isEnabled ? 'Protected' : 'Public'}
                        </span>
                      </div>
                      <div className="business-actions">
                        <button
                          className={`toggle-button ${isEnabled ? 'enabled' : 'disabled'} ${saving === 'passwordProtected' && savingBusiness === business ? 'saving' : ''}`}
                          onClick={() => togglePasswordProtection(business)}
                          disabled={saving === 'passwordProtected'}
                        >
                          {saving === 'passwordProtected' && savingBusiness === business ? 'Saving...' : (isEnabled ? 'Remove Protection' : 'Add Protection')}
                        </button>
                        
                        {isEnabled && (
                          <div className="password-section">
                            {editingPassword === business ? (
                              <div className="password-edit">
                                <input
                                  type="password"
                                  value={tempPassword}
                                  onChange={(e) => setTempPassword(e.target.value)}
                                  placeholder="Enter new password"
                                  className="password-input"
                                />
                                <button
                                  onClick={() => saveBusinessPassword(business, tempPassword)}
                                  disabled={!tempPassword.trim()}
                                  className="save-password-btn"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPassword(null);
                                    setTempPassword('');
                                  }}
                                  className="cancel-password-btn"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingPassword(business);
                                  setTempPassword(businessPasswords[business] || '');
                                }}
                                className="edit-password-btn"
                              >
                                {businessPasswords[business] ? 'Change Password' : 'Set Password'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Developer Access Section */}
        <div className="settings-section">
          <div 
            className="section-header"
            onClick={() => toggleSectionExpansion('developerAccess')}
          >
            <div className="section-title">
              <FaUserCog /> Developer Access
            </div>
            <div className="section-stats">
              {users.filter(user => user.developer).length} developers
            </div>
            {expandedSections.has('developerAccess') ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          
          {expandedSections.has('developerAccess') && (
            <div className="section-content">
              <p>Grant developer access to users for testing and development purposes.</p>
              {loadingUsers ? (
                <div className="loading-users">Loading users...</div>
              ) : (
                <div className="users-list">
                  {users.map(user => (
                    <div key={user.uid} className="user-item">
                      <div className="user-info">
                        <span className="user-name">{user.firstName} {user.lastName}</span>
                        <span className="user-email">{user.email}</span>
                        <span className={`user-role ${user.admin ? 'admin' : 'user'}`}>
                          {user.admin ? 'Admin' : 'User'}
                        </span>
                      </div>
                      <div className="user-actions">
                        <span className={`developer-badge ${user.developer ? 'developer' : 'user'}`}>
                          {user.developer ? <FaCheck /> : <FaTimes />}
                          {user.developer ? 'Developer' : 'User'}
                        </span>
                        <button
                          className={`toggle-developer-btn ${user.developer ? 'remove' : 'add'}`}
                          onClick={() => toggleUserDeveloper(user.uid, user.developer)}
                        >
                          {user.developer ? 'Remove Developer' : 'Make Developer'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 