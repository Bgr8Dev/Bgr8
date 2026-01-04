import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../../firebase/firebase';
import { FaTimes, FaEye, FaEyeSlash, FaGraduationCap, FaUpload, FaSpinner } from 'react-icons/fa';
import { compressImage, formatFileSize } from '../../utils/imageCompression';
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
  const { userProfile, currentUser, changePassword } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [userRole, setUserRole] = useState<'mentor' | 'mentee' | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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

  // Fetch user role from mentorProgram profile
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const mentorProgramDoc = await getDoc(
          doc(firestore, 'users', currentUser.uid, 'mentorProgram', 'profile')
        );
        
        if (mentorProgramDoc.exists()) {
          const profileData = mentorProgramDoc.data();
          if (profileData.isMentor === true) {
            setUserRole('mentor');
          } else if (profileData.isMentee === true) {
            setUserRole('mentee');
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, [currentUser]);

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
      const userRef = doc(firestore, 'users', userProfile.uid);
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile?.uid) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingPhoto(true);
    try {
      let fileToUpload = file;
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB

      // Compress image if it's too large
      if (file.size > maxSizeBytes) {
        console.log(`Original file size: ${formatFileSize(file.size)}. Compressing...`);
        fileToUpload = await compressImage(file, maxSizeBytes);
        console.log(`Compressed file size: ${formatFileSize(fileToUpload.size)}`);
      }

      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = fileToUpload.name.split('.').pop() || 'jpg';
      const fileName = `profile_${userProfile.uid}_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `profilePictures/${fileName}`);

      // Upload file
      await uploadBytes(storageRef, fileToUpload);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update user profile with photo URL
      const userRef = doc(firestore, 'users', userProfile.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        lastUpdated: new Date()
      });

      // Update local state (this will trigger a re-render if userProfile is reactive)
      window.location.reload(); // Simple refresh to update the profile
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const renderProfilePlaceholder = () => {
    if (userRole === 'mentor') {
      // Orange circle for mentor
      return (
        <div 
          className="profile-photo-placeholder profile-photo-placeholder-mentor"
          style={{
            background: 'var(--mentor)',
            borderColor: 'var(--mentor)',
            boxShadow: '0 0 15px rgba(224, 106, 92, 0.5)'
          }}
        />
      );
    } else if (userRole === 'mentee') {
      // Graduation cap with teal circle for mentee
      return (
        <div 
          className="profile-photo-placeholder profile-photo-placeholder-mentee"
          style={{
            background: 'var(--mentee)',
            borderColor: 'var(--mentee)',
            boxShadow: '0 0 15px rgba(29, 213, 209, 0.5)',
            color: 'white'
          }}
        >
          <FaGraduationCap size={48} />
        </div>
      );
    } else {
      // Default placeholder (first initial)
      return (
        <div className="profile-photo-placeholder">
          {userProfile?.firstName?.charAt(0)}
        </div>
      );
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
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="Profile" className="profile-photo" />
                ) : (
                  renderProfilePlaceholder()
                )}
                <label 
                  htmlFor="photo-upload"
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    background: 'var(--accent)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  title="Upload profile picture"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.background = 'var(--accent-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'var(--accent)';
                  }}
                >
                  {uploadingPhoto ? (
                    <FaSpinner className="fa-spin" size={16} />
                  ) : (
                    <FaUpload size={14} />
                  )}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingPhoto}
                />
              </div>
              <h3>{userProfile?.displayName}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <p>{userProfile?.email}</p>
                {userProfile?.emailVerified ? (
                  <span 
                    style={{ 
                      color: '#198754', 
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    title="Email verified"
                  >
                    ✓ Verified
                  </span>
                ) : (
                  <span 
                    style={{ 
                      color: '#dc3545', 
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    title="Email not verified"
                  >
                    ⚠ Not Verified
                  </span>
                )}
              </div>
              {!userProfile?.emailVerified && (
                <div style={{ marginTop: '0.5rem' }}>
                  <Link 
                    to="/verify-email?prompt=true" 
                    style={{ 
                      color: '#3b9ff2', 
                      textDecoration: 'underline',
                      fontSize: '0.875rem'
                    }}
                  >
                    Verify your email address
                  </Link>
                </div>
              )}
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