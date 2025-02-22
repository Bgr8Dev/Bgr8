import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaTimes } from 'react-icons/fa';
import '../styles/Overlay.css';

export default function Profile() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    phoneNumber: userProfile?.phoneNumber || '',
    location: {
      city: userProfile?.location?.city || '',
      country: userProfile?.location?.country || ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;

    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        phoneNumber: formData.phoneNumber,
        location: formData.location,
        lastUpdated: new Date()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="overlay">
      <div className="overlay-content">
        <button 
          className="close-button"
          onClick={() => navigate(-1)}
        >
          <FaTimes />
        </button>

        <h2>Profile</h2>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="overlay-form">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.location.city}
                onChange={(e) => setFormData({
                  ...formData, 
                  location: {...formData.location, city: e.target.value}
                })}
              />
            </div>

            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                value={formData.location.country}
                onChange={(e) => setFormData({
                  ...formData, 
                  location: {...formData.location, country: e.target.value}
                })}
              />
            </div>

            <div className="button-group">
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="profile-header">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Profile" className="profile-photo" />
              ) : (
                <div className="profile-photo-placeholder">
                  {userProfile?.firstName?.charAt(0)}
                </div>
              )}
              <h3>{userProfile?.displayName}</h3>
              <p>{userProfile?.email}</p>
            </div>

            <div className="profile-details">
              <p><strong>Phone:</strong> {userProfile?.phoneNumber || 'Not set'}</p>
              <p><strong>Location:</strong> {userProfile?.location?.city ? 
                `${userProfile.location.city}, ${userProfile.location.country}` : 
                'Not set'}
              </p>
              <p><strong>Member Since:</strong> {userProfile?.dateCreated ? new Date(userProfile.dateCreated).toLocaleDateString() : 'Not set'}</p>
            </div>

            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  );
} 