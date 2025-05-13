import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import '../../styles/Overlay.css';

// Comprehensive list of ethnicities
const ethnicityOptions = [
  'African',
  'African American',
  'Arab',
  'Asian',
  'Caucasian',
  'East Asian',
  'Hispanic/Latino',
  'Indigenous',
  'Middle Eastern',
  'Mixed/Multiracial',
  'Native American',
  'Pacific Islander',
  'South Asian',
  'Southeast Asian',
  'Other',
  'Prefer not to say'
];

// Comprehensive list of nationalities
const nationalityOptions = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Andorran', 'Angolan', 'Argentine', 'Armenian', 'Australian',
  'Austrian', 'Azerbaijani', 'Bahamian', 'Bahraini', 'Bangladeshi', 'Barbadian', 'Belarusian', 'Belgian',
  'Belizean', 'Beninese', 'Bhutanese', 'Bolivian', 'Bosnian', 'Brazilian', 'British', 'Bruneian', 'Bulgarian',
  'Burkinabe', 'Burmese', 'Burundian', 'Cambodian', 'Cameroonian', 'Canadian', 'Cape Verdean', 'Central African',
  'Chadian', 'Chilean', 'Chinese', 'Colombian', 'Comoran', 'Congolese', 'Costa Rican', 'Croatian', 'Cuban', 'Cypriot',
  'Czech', 'Danish', 'Djiboutian', 'Dominican', 'Dutch', 'Ecuadorian', 'Egyptian', 'Emirati', 'Equatorial Guinean',
  'Eritrean', 'Estonian', 'Ethiopian', 'Fijian', 'Filipino', 'Finnish', 'French', 'Gabonese', 'Gambian', 'Georgian',
  'German', 'Ghanaian', 'Greek', 'Grenadian', 'Guatemalan', 'Guinean', 'Guyanese', 'Haitian', 'Honduran', 'Hungarian',
  'Icelandic', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Ivorian', 'Jamaican',
  'Japanese', 'Jordanian', 'Kazakhstani', 'Kenyan', 'Korean', 'Kuwaiti', 'Kyrgyz', 'Laotian', 'Latvian', 'Lebanese',
  'Liberian', 'Libyan', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 'Malawian', 'Malaysian', 'Maldivian',
  'Malian', 'Maltese', 'Mauritanian', 'Mauritian', 'Mexican', 'Moldovan', 'Monacan', 'Mongolian', 'Montenegrin',
  'Moroccan', 'Mozambican', 'Namibian', 'Nepalese', 'New Zealand', 'Nicaraguan', 'Nigerian', 'Norwegian', 'Omani',
  'Pakistani', 'Panamanian', 'Papua New Guinean', 'Paraguayan', 'Peruvian', 'Polish', 'Portuguese', 'Qatari',
  'Romanian', 'Russian', 'Rwandan', 'Saint Lucian', 'Salvadoran', 'Samoan', 'Saudi', 'Senegalese', 'Serbian',
  'Seychellois', 'Sierra Leonean', 'Singaporean', 'Slovak', 'Slovenian', 'Somali', 'South African', 'Spanish',
  'Sri Lankan', 'Sudanese', 'Surinamese', 'Swedish', 'Swiss', 'Syrian', 'Taiwanese', 'Tajik', 'Tanzanian', 'Thai',
  'Togolese', 'Trinidadian', 'Tunisian', 'Turkish', 'Turkmen', 'Ugandan', 'Ukrainian', 'Uruguayan', 'Uzbek',
  'Venezuelan', 'Vietnamese', 'Yemeni', 'Zambian', 'Zimbabwean',
  'Dual Nationality',
  'Stateless',
  'Other',
  'Prefer not to say'
];

export default function Profile() {
  const { userProfile, changePassword } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    phoneNumber: userProfile?.phoneNumber || '',
    ethnicity: userProfile?.ethnicity || '',
    nationality: userProfile?.nationality || '',
    secondNationality: userProfile?.secondNationality || '',
    countryOfOrigin: userProfile?.countryOfOrigin || '',
    location: {
      city: userProfile?.location?.city || '',
      country: userProfile?.location?.country || ''
    }
  });
  const [showSecondNationality, setShowSecondNationality] = useState(
    formData.nationality === 'Dual Nationality'
  );

  // Update second nationality visibility when nationality changes
  const handleNationalityChange = (value: string) => {
    const isDual = value === 'Dual Nationality';
    setShowSecondNationality(isDual);
    setFormData({
      ...formData,
      nationality: value,
      // Clear second nationality if not dual
      secondNationality: isDual ? formData.secondNationality : ''
    });
  };

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
        ethnicity: formData.ethnicity,
        nationality: formData.nationality,
        secondNationality: formData.secondNationality,
        countryOfOrigin: formData.countryOfOrigin,
        location: formData.location,
        lastUpdated: new Date()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation checks
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordFormData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(passwordFormData.newPassword)) {
      setPasswordError('New password must contain at least one uppercase letter');
      return;
    }

    if (!/[0-9]/.test(passwordFormData.newPassword)) {
      setPasswordError('New password must contain at least one number');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordFormData.newPassword)) {
      setPasswordError('New password must contain at least one special character');
      return;
    }

    try {
      await changePassword(passwordFormData.currentPassword, passwordFormData.newPassword);
      
      // Reset form and show success message
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordSuccess('Password changed successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess('');
        setIsChangingPassword(false);
      }, 3000);
    } catch (error) {
      if (error instanceof Error) {
        setPasswordError(error.message);
      } else {
        setPasswordError('An error occurred while changing your password');
      }
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    if (field === 'current') {
      setShowCurrentPassword(!showCurrentPassword);
    } else if (field === 'new') {
      setShowNewPassword(!showNewPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="overlay">
      <div className="overlay-content">
        <button 
          className="close-button"
          onClick={() => navigate(-1)}
          aria-label="Close profile"
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
              <label>Ethnicity</label>
              <select
                value={formData.ethnicity}
                onChange={(e) => setFormData({...formData, ethnicity: e.target.value})}
                className="form-select"
              >
                <option value="">Select Ethnicity</option>
                {ethnicityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Nationality</label>
              <select
                value={formData.nationality}
                onChange={(e) => handleNationalityChange(e.target.value)}
                className="form-select"
              >
                <option value="">Select Nationality</option>
                {nationalityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {showSecondNationality && (
              <div className="form-group">
                <label>Second Nationality</label>
                <select
                  value={formData.secondNationality}
                  onChange={(e) => setFormData({...formData, secondNationality: e.target.value})}
                  className="form-select"
                >
                  <option value="">Select Second Nationality</option>
                  {nationalityOptions
                    .filter(option => option !== 'Dual Nationality' && option !== formData.nationality)
                    .map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))
                  }
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Country of Origin</label>
              <select
                value={formData.countryOfOrigin}
                onChange={(e) => setFormData({...formData, countryOfOrigin: e.target.value})}
                className="form-select"
              >
                <option value="">Select Country of Origin</option>
                {nationalityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
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
        ) : isChangingPassword ? (
          <form onSubmit={handlePasswordChange} className="overlay-form">
            <h3>Change Password</h3>
            
            {passwordError && <div className="form-error">{passwordError}</div>}
            {passwordSuccess && <div className="form-success">{passwordSuccess}</div>}
            
            <div className="form-group password-field">
              <label>Current Password</label>
              <div className="password-input-container">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordFormData.currentPassword}
                  onChange={(e) => setPasswordFormData({
                    ...passwordFormData, 
                    currentPassword: e.target.value
                  })}
                  required
                />
                <button 
                  type="button"
                  className="toggle-password-visibility"
                  onClick={() => togglePasswordVisibility('current')}
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div className="form-group password-field">
              <label>New Password</label>
              <div className="password-input-container">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordFormData.newPassword}
                  onChange={(e) => setPasswordFormData({
                    ...passwordFormData, 
                    newPassword: e.target.value
                  })}
                  required
                />
                <button 
                  type="button"
                  className="toggle-password-visibility"
                  onClick={() => togglePasswordVisibility('new')}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div className="form-group password-field">
              <label>Confirm New Password</label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({
                    ...passwordFormData, 
                    confirmPassword: e.target.value
                  })}
                  required
                />
                <button 
                  type="button"
                  className="toggle-password-visibility"
                  onClick={() => togglePasswordVisibility('confirm')}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div className="password-requirements">
              <p>Password requirements:</p>
              <ul>
                <li className={passwordFormData.newPassword.length >= 8 ? 'valid' : ''}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(passwordFormData.newPassword) ? 'valid' : ''}>
                  At least one uppercase letter
                </li>
                <li className={/[0-9]/.test(passwordFormData.newPassword) ? 'valid' : ''}>
                  At least one number
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(passwordFormData.newPassword) ? 'valid' : ''}>
                  At least one special character
                </li>
              </ul>
            </div>
            
            <div className="button-group">
              <button type="submit">Change Password</button>
              <button type="button" onClick={() => setIsChangingPassword(false)}>Cancel</button>
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
              <p><strong>Ethnicity:</strong> {userProfile?.ethnicity || 'Not set'}</p>
              <p>
                <strong>Nationality:</strong> {
                  userProfile?.nationality === 'Dual Nationality' 
                    ? `Dual (${userProfile?.nationality}, ${userProfile?.secondNationality})` 
                    : userProfile?.nationality || 'Not set'
                }
              </p>
              <p><strong>Country of Origin:</strong> {userProfile?.countryOfOrigin || 'Not set'}</p>
              <p><strong>Location:</strong> {userProfile?.location?.city ? 
                `${userProfile.location.city}, ${userProfile.location.country}` : 
                'Not set'}
              </p>
              <p><strong>Member Since:</strong> {userProfile?.dateCreated ? 
                (userProfile.dateCreated instanceof Date 
                  ? userProfile.dateCreated.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) 
                  : new Date((userProfile.dateCreated as unknown as Timestamp).seconds * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })) 
                : 'Not set'}
              </p>
            </div>

            <div className="profile-actions">
              <button onClick={() => setIsEditing(true)}>Edit Profile</button>
              <button onClick={() => setIsChangingPassword(true)}>Change Password</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 