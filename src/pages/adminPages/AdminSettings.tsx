import { useState, useEffect } from 'react';
import { doc, getDocs, updateDoc, collection, query } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FaUserCog, FaCheck, FaTimes } from 'react-icons/fa';
import '../../styles/adminStyles/AdminSettings.css';

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  developer: boolean;
}

export function AdminSettings() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    fetchUsers();
  }, []);

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
      setErrorMessage('Failed to load users. Please try again.');
    }
  };

  const toggleUserDeveloper = async (userId: string, isDeveloper: boolean) => {
    try {
      setSaving(userId);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        developer: !isDeveloper
      });
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
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="admin-settings">
      <h2>Admin Settings</h2>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      <div className="settings-section">
        <div className="section-header">
          <div className="section-title">
            <FaUserCog /> Developer Access
          </div>
          <div className="section-stats">
            {users.filter(user => user.developer).length} developers
          </div>
        </div>
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
                      disabled={saving === user.uid}
                    >
                      {saving === user.uid ? 'Saving...' : user.developer ? 'Remove Developer' : 'Make Developer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 