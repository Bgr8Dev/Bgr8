import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaTimes, 
  FaUser, 
  FaBell, 
  FaShieldAlt, 
  FaPalette, 
  FaGraduationCap, 
  FaCog, 
  FaSave,
  FaEye,
  FaDesktop,
  FaMoon,
  FaSun,
  FaEnvelope,
  FaTextHeight
} from 'react-icons/fa';
import '../../styles/Overlay.css';
import '../../styles/Settings.css';
import '../../styles/modal.css';
import { useBigText } from '../../contexts/BigTextContext';
import Tooltip from '../../components/ui/Tooltip';
import InfoAlert from '../../components/ui/InfoAlert';
import Modal from '../../components/ui/Modal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

interface SettingsState {
  // Profile Settings
  profile: {
    displayName: string;
    bio: string;
    profilePicture: string;
    timezone: string;
    language: string;
    dateFormat: string;
    currency: string;
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    allowDirectMessages: boolean;
    profileVisibility: 'public' | 'mentors' | 'private';
  };
  
  // Notification Settings
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    inAppNotifications: boolean;
    newMessageAlerts: boolean;
    bookingReminders: boolean;
    sessionReminders: boolean;
    weeklyDigest: boolean;
    marketingEmails: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    quietHours: boolean;
    quietStartTime: string;
    quietEndTime: string;
    notificationFrequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  };
  
  // Privacy Settings
  privacy: {
    profileVisibility: 'public' | 'mentors' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
    showSocialMedia: boolean;
    allowProfileSearch: boolean;
    allowMentorMatching: boolean;
    dataSharing: boolean;
    analyticsTracking: boolean;
    cookieConsent: boolean;
    twoFactorAuth: boolean;
    loginAlerts: boolean;
    sessionTimeout: number;
  };
  
  // Appearance Settings
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
    fontFamily: string;
    compactMode: boolean;
    showAnimations: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    sidebarCollapsed: boolean;
    showTooltips: boolean;
    showBreadcrumbs: boolean;
  };
  
  // Mentoring Settings
  mentoring: {
    mentorMode: boolean;
    menteeMode: boolean;
    availableForMentoring: boolean;
    mentoringTopics: string[];
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    hourlyRate: number;
    freeSessions: boolean;
    maxSessionsPerWeek: number;
    preferredSessionLength: number;
    timezone: string;
    availability: {
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
      saturday: boolean;
      sunday: boolean;
    };
    workingHours: {
      start: string;
      end: string;
    };
    autoAcceptBookings: boolean;
    requireApproval: boolean;
    cancellationPolicy: string;
    refundPolicy: string;
  };
  
  // Communication Settings
  communication: {
    preferredContactMethod: 'email' | 'sms' | 'in-app' | 'phone';
    autoReply: boolean;
    autoReplyMessage: string;
    typingIndicators: boolean;
    readReceipts: boolean;
    messageHistory: boolean;
    fileSharing: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    videoCallProvider: 'zoom' | 'teams' | 'google-meet' | 'cal.com';
    screenSharing: boolean;
    recordingEnabled: boolean;
  };
  
  // Security Settings
  security: {
    twoFactorAuth: boolean;
    loginAlerts: boolean;
    deviceManagement: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    loginAttempts: number;
    ipWhitelist: string[];
    vpnDetection: boolean;
    suspiciousActivityAlerts: boolean;
    dataEncryption: boolean;
    backupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
  
  // Performance Settings
  performance: {
    cacheEnabled: boolean;
    cacheSize: number;
    imageOptimization: boolean;
    lazyLoading: boolean;
    preloadResources: boolean;
    compressionEnabled: boolean;
    cdnEnabled: boolean;
    analyticsEnabled: boolean;
    errorReporting: boolean;
    performanceMonitoring: boolean;
  };
  
  // Accessibility Settings
  accessibility: {
    screenReader: boolean;
    highContrast: boolean;
    largeText: boolean;
    fontSize: number;
    reducedMotion: boolean;
    keyboardNavigation: boolean;
    focusIndicators: boolean;
    colorBlindSupport: boolean;
    dyslexiaSupport: boolean;
    voiceControl: boolean;
    gestureControl: boolean;
  };
  
  // Advanced Settings
  advanced: {
    developerMode: boolean;
    debugMode: boolean;
    apiAccess: boolean;
    webhookUrl: string;
    customCss: string;
    customJs: string;
    experimentalFeatures: boolean;
    betaFeatures: boolean;
    dataExport: boolean;
    dataImport: boolean;
    resetSettings: boolean;
    deleteAccount: boolean;
  };
}

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const { isBigTextEnabled, toggleBigText, fontSize, setFontSize } = useBigText();
  
  // Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState({ title: '', content: '' });
  const [settings, setSettings] = useState<SettingsState>({
    profile: {
      displayName: '',
      bio: '',
      profilePicture: '',
      timezone: 'UTC',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      showOnlineStatus: true,
      showLastSeen: true,
      allowDirectMessages: true,
      profileVisibility: 'public'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      inAppNotifications: true,
      newMessageAlerts: true,
      bookingReminders: true,
      sessionReminders: true,
      weeklyDigest: false,
      marketingEmails: false,
      soundEnabled: true,
      vibrationEnabled: true,
      quietHours: false,
      quietStartTime: '22:00',
      quietEndTime: '08:00',
      notificationFrequency: 'instant'
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showLocation: true,
      showSocialMedia: true,
      allowProfileSearch: true,
      allowMentorMatching: true,
      dataSharing: false,
      analyticsTracking: true,
      cookieConsent: true,
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30
    },
    appearance: {
      theme: 'auto',
      primaryColor: '#3BA7F2',
      accentColor: '#8B5CF6',
      fontSize: 'medium',
      fontFamily: 'Inter',
      compactMode: false,
      showAnimations: true,
      highContrast: false,
      reducedMotion: false,
      sidebarCollapsed: false,
      showTooltips: true,
      showBreadcrumbs: true
    },
    mentoring: {
      mentorMode: false,
      menteeMode: true,
      availableForMentoring: false,
      mentoringTopics: [],
      experienceLevel: 'beginner',
      hourlyRate: 0,
      freeSessions: true,
      maxSessionsPerWeek: 5,
      preferredSessionLength: 60,
      timezone: 'UTC',
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      },
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      autoAcceptBookings: false,
      requireApproval: true,
      cancellationPolicy: '24 hours',
      refundPolicy: 'Full refund within 24 hours'
    },
    communication: {
      preferredContactMethod: 'email',
      autoReply: false,
      autoReplyMessage: '',
      typingIndicators: true,
      readReceipts: true,
      messageHistory: true,
      fileSharing: true,
      maxFileSize: 10,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png'],
      videoCallProvider: 'cal.com',
      screenSharing: true,
      recordingEnabled: false
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      deviceManagement: true,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5,
      ipWhitelist: [],
      vpnDetection: false,
      suspiciousActivityAlerts: true,
      dataEncryption: true,
      backupEnabled: true,
      backupFrequency: 'weekly'
    },
    performance: {
      cacheEnabled: true,
      cacheSize: 100,
      imageOptimization: true,
      lazyLoading: true,
      preloadResources: false,
      compressionEnabled: true,
      cdnEnabled: true,
      analyticsEnabled: true,
      errorReporting: true,
      performanceMonitoring: true
    },
    accessibility: {
      screenReader: false,
      highContrast: false,
      largeText: false,
      fontSize: 14,
      reducedMotion: false,
      keyboardNavigation: true,
      focusIndicators: true,
      colorBlindSupport: false,
      dyslexiaSupport: false,
      voiceControl: false,
      gestureControl: false
    },
    advanced: {
      developerMode: false,
      debugMode: false,
      apiAccess: false,
      webhookUrl: '',
      customCss: '',
      customJs: '',
      experimentalFeatures: false,
      betaFeatures: false,
      dataExport: false,
      dataImport: false,
      resetSettings: false,
      deleteAccount: false
    }
  });

  // Apply font size dynamically
  useEffect(() => {
    const settingsContainer = document.querySelector('.settings-container') as HTMLElement;
    if (settingsContainer) {
      settingsContainer.style.setProperty('--settings-font-size', `${settings.accessibility.fontSize}px`);
    }
  }, [settings.accessibility.fontSize]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FaUser },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'privacy', label: 'Privacy', icon: FaShieldAlt },
    { id: 'appearance', label: 'Appearance', icon: FaPalette },
    { id: 'mentoring', label: 'Mentoring', icon: FaGraduationCap },
    { id: 'communication', label: 'Communication', icon: FaEnvelope },
    { id: 'security', label: 'Security', icon: FaShieldAlt },
    { id: 'performance', label: 'Performance', icon: FaCog },
    { id: 'accessibility', label: 'Accessibility', icon: FaEye },
    { id: 'advanced', label: 'Advanced', icon: FaCog }
  ];

  const handleSave = () => {
    // Save settings logic here
    console.log('Saving settings:', settings);
    setInfoModalContent({
      title: 'Settings Saved',
      content: 'Your settings have been saved successfully! All changes have been applied and will be remembered for future visits.'
    });
    setShowInfoModal(true);
  };

  const handleReset = () => {
    setShowResetModal(true);
  };

  const confirmReset = () => {
    // Reset logic here
    console.log('Resetting settings');
    setShowResetModal(false);
    setInfoModalContent({
      title: 'Settings Reset',
      content: 'All settings have been reset to their default values. You can now customize them again to your preferences.'
    });
    setShowInfoModal(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    // Delete account logic here
    console.log('Deleting account');
    setShowDeleteModal(false);
    setInfoModalContent({
      title: 'Account Deletion',
      content: 'Your account deletion request has been submitted. You will receive a confirmation email shortly. This action cannot be undone.'
    });
    setShowInfoModal(true);
  };

  const renderProfileSettings = () => (
    <div className="settings-section">
      <h3>Profile Information</h3>
      
      <InfoAlert 
        title="Profile Setup" 
        type="info"
        className="mb-4"
      >
        Customize your profile information to help others learn more about you. 
        This information will be visible to other users and helps with mentor matching.
      </InfoAlert>
      
      <div className="settings-form-group">
        <Tooltip 
          content="Your display name is how other users will see you on the platform. Choose something professional and memorable."
          position="top"
          delay={300}
        >
          <label className="font-size-label">Display Name</label>
        </Tooltip>
        <input 
          type="text" 
          value={settings.profile.displayName}
          onChange={(e) => setSettings({...settings, profile: {...settings.profile, displayName: e.target.value}})}
          placeholder="Enter your display name"
        />
      </div>
      
      <div className="settings-form-group">
        <Tooltip 
          content="Write a brief description about yourself, your experience, and what you can offer as a mentor or what you're looking for as a mentee."
          position="top"
          delay={300}
        >
          <label className="font-size-label">Bio</label>
        </Tooltip>
        <textarea 
          value={settings.profile.bio}
          onChange={(e) => setSettings({...settings, profile: {...settings.profile, bio: e.target.value}})}
          placeholder="Tell us about yourself..."
          rows={4}
        />
      </div>
      
      <div className="settings-form-group">
        <Tooltip 
          content="Upload a professional photo that represents you well. This helps build trust and makes your profile more engaging."
          position="top"
          delay={300}
        >
          <label className="font-size-label">Profile Picture</label>
        </Tooltip>
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => setSettings({...settings, profile: {...settings.profile, profilePicture: e.target.value}})}
        />
      </div>
      
      <div className="settings-form-row">
        <div className="settings-form-group">
          <Tooltip 
            content="Select your timezone to help others know when you're available for sessions and meetings."
            position="top"
            delay={300}
          >
            <label className="font-size-label">Timezone</label>
          </Tooltip>
          <select 
            value={settings.profile.timezone}
            onChange={(e) => setSettings({...settings, profile: {...settings.profile, timezone: e.target.value}})}
          >
            <option value="UTC">UTC</option>
            <option value="EST">Eastern Time</option>
            <option value="PST">Pacific Time</option>
            <option value="GMT">Greenwich Mean Time</option>
          </select>
        </div>
        
        <div className="settings-form-group">
          <Tooltip 
            content="Choose your preferred language for the interface and communications."
            position="top"
            delay={300}
          >
            <label className="font-size-label">Language</label>
          </Tooltip>
          <select 
            value={settings.profile.language}
            onChange={(e) => setSettings({...settings, profile: {...settings.profile, language: e.target.value}})}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
      </div>
      
      <div className="settings-form-row">
        <div className="settings-form-group">
          <label>Date Format</label>
          <select 
            value={settings.profile.dateFormat}
            onChange={(e) => setSettings({...settings, profile: {...settings.profile, dateFormat: e.target.value}})}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        
        <div className="settings-form-group">
          <label>Currency</label>
          <select 
            value={settings.profile.currency}
            onChange={(e) => setSettings({...settings, profile: {...settings.profile, currency: e.target.value}})}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD (C$)</option>
          </select>
        </div>
      </div>
      
      <h4>Visibility Settings</h4>
      <div className="settings-checkbox-group">
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.profile.showOnlineStatus}
            onChange={(e) => setSettings({...settings, profile: {...settings.profile, showOnlineStatus: e.target.checked}})}
          />
          Show online status
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.profile.showLastSeen}
            onChange={(e) => setSettings({...settings, profile: {...settings.profile, showLastSeen: e.target.checked}})}
          />
          Show last seen
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.profile.allowDirectMessages}
            onChange={(e) => setSettings({...settings, profile: {...settings.profile, allowDirectMessages: e.target.checked}})}
          />
          Allow direct messages
        </label>
      </div>
      
      <div className="settings-form-group">
        <label>Profile Visibility</label>
        <select 
          value={settings.profile.profileVisibility}
          onChange={(e) => setSettings({...settings, profile: {...settings.profile, profileVisibility: e.target.value as 'public' | 'mentors' | 'private'}})}
        >
          <option value="public">Public</option>
          <option value="mentors">Mentors Only</option>
          <option value="private">Private</option>
        </select>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3>Notification Preferences</h3>
      
      <InfoAlert 
        title="Notification Settings" 
        type="info"
        className="mb-4"
      >
        Choose how you want to be notified about important updates, messages, and activities. 
        You can customize different types of notifications to stay informed without being overwhelmed.
      </InfoAlert>
      
      <div className="settings-checkbox-group">
        <Tooltip 
          content="Receive important updates and summaries via email. Great for staying informed about your mentoring activities."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.notifications.emailNotifications}
              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, emailNotifications: e.target.checked}})}
            />
            Email notifications
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Get instant notifications on your device when you receive messages or important updates."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.notifications.pushNotifications}
              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, pushNotifications: e.target.checked}})}
            />
            Push notifications
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Receive text messages for urgent notifications. Useful when you're away from your computer."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.notifications.smsNotifications}
              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, smsNotifications: e.target.checked}})}
            />
            SMS notifications
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Show notifications within the app interface. These appear as banners or popups while you're using the platform."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.notifications.inAppNotifications}
              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, inAppNotifications: e.target.checked}})}
            />
            In-app notifications
          </label>
        </Tooltip>
      </div>
      
      <h4>Specific Notifications</h4>
      <div className="settings-checkbox-group">
        <Tooltip 
          content="Get notified immediately when you receive new messages from mentors or mentees."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.notifications.newMessageAlerts}
              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, newMessageAlerts: e.target.checked}})}
            />
            New message alerts
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Receive reminders about upcoming bookings and appointments to help you stay organized."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.notifications.bookingReminders}
              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, bookingReminders: e.target.checked}})}
            />
            Booking reminders
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Get notified before your mentoring sessions start to ensure you're prepared and on time."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.notifications.sessionReminders}
              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, sessionReminders: e.target.checked}})}
            />
            Session reminders
          </label>
        </Tooltip>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.notifications.weeklyDigest}
            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, weeklyDigest: e.target.checked}})}
          />
          Weekly digest
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.notifications.marketingEmails}
            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, marketingEmails: e.target.checked}})}
          />
          Marketing emails
        </label>
      </div>
      
      <h4>Notification Behavior</h4>
      <div className="settings-checkbox-group">
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.notifications.soundEnabled}
            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, soundEnabled: e.target.checked}})}
          />
          Sound enabled
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.notifications.vibrationEnabled}
            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, vibrationEnabled: e.target.checked}})}
          />
          Vibration enabled
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.notifications.quietHours}
            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, quietHours: e.target.checked}})}
          />
          Quiet hours
        </label>
      </div>
      
      {settings.notifications.quietHours && (
        <div className="settings-form-row">
          <div className="settings-form-group">
            <label>Quiet Start Time</label>
            <input 
              type="time" 
              value={settings.notifications.quietStartTime}
              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, quietStartTime: e.target.value}})}
            />
          </div>
          
          <div className="settings-form-group">
            <label>Quiet End Time</label>
            <input 
              type="time" 
              value={settings.notifications.quietEndTime}
              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, quietEndTime: e.target.value}})}
            />
          </div>
        </div>
      )}
      
      <div className="settings-form-group">
        <label>Notification Frequency</label>
        <select 
          value={settings.notifications.notificationFrequency}
          onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, notificationFrequency: e.target.value as 'instant' | 'hourly' | 'daily' | 'weekly'}})}
        >
          <option value="instant">Instant</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
    </div>
  );

  const renderMentoringSettings = () => (
    <div className="settings-section">
      <h3>Mentoring Preferences</h3>
      
      <InfoAlert 
        title="Mentoring Setup" 
        type="info"
        className="mb-4"
      >
        Configure your mentoring preferences to help the platform match you with the right mentors or mentees. 
        You can be both a mentor and mentee, or focus on one role.
      </InfoAlert>
      
      <div className="settings-checkbox-group">
        <Tooltip 
          content="Enable this to offer mentoring to others. You'll be visible to mentees looking for guidance in your areas of expertise."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.mentoring.mentorMode}
              onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, mentorMode: e.target.checked}})}
            />
            Enable mentor mode
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Enable this to seek mentoring from others. You'll be matched with mentors who can help you grow in your chosen areas."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.mentoring.menteeMode}
              onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, menteeMode: e.target.checked}})}
            />
            Enable mentee mode
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Show that you're currently available to take on new mentees. This helps mentees know when you're accepting new mentoring relationships."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.mentoring.availableForMentoring}
              onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, availableForMentoring: e.target.checked}})}
            />
            Available for mentoring
          </label>
        </Tooltip>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.mentoring.freeSessions}
            onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, freeSessions: e.target.checked}})}
          />
          Offer free sessions
        </label>
      </div>
      
      <div className="settings-form-row">
        <div className="settings-form-group">
          <label>Experience Level</label>
          <select 
            value={settings.mentoring.experienceLevel}
            onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, experienceLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced' | 'expert'}})}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>
        
        <div className="settings-form-group">
          <label>Hourly Rate ($)</label>
          <input 
            type="number" 
            value={settings.mentoring.hourlyRate}
            onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, hourlyRate: parseInt(e.target.value)}})}
            min="0"
            step="5"
          />
        </div>
      </div>
      
      <div className="settings-form-row">
        <div className="settings-form-group">
          <label>Max Sessions Per Week</label>
          <input 
            type="number" 
            value={settings.mentoring.maxSessionsPerWeek}
            onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, maxSessionsPerWeek: parseInt(e.target.value)}})}
            min="1"
            max="20"
          />
        </div>
        
        <div className="settings-form-group">
          <label>Preferred Session Length (minutes)</label>
          <input 
            type="number" 
            value={settings.mentoring.preferredSessionLength}
            onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, preferredSessionLength: parseInt(e.target.value)}})}
            min="15"
            max="180"
            step="15"
          />
        </div>
      </div>
      
      <h4>Availability</h4>
      <div className="settings-availability-grid">
        {Object.entries(settings.mentoring.availability).map(([day, available]) => (
          <label key={day} className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={available}
              onChange={(e) => setSettings({
                ...settings, 
                mentoring: {
                  ...settings.mentoring, 
                  availability: {...settings.mentoring.availability, [day]: e.target.checked}
                }
              })}
            />
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </label>
        ))}
      </div>
      
      <div className="settings-form-row">
        <div className="settings-form-group">
          <label>Working Hours Start</label>
          <input 
            type="time" 
            value={settings.mentoring.workingHours.start}
            onChange={(e) => setSettings({
              ...settings, 
              mentoring: {
                ...settings.mentoring, 
                workingHours: {...settings.mentoring.workingHours, start: e.target.value}
              }
            })}
          />
        </div>
        
        <div className="settings-form-group">
          <label>Working Hours End</label>
          <input 
            type="time" 
            value={settings.mentoring.workingHours.end}
            onChange={(e) => setSettings({
              ...settings, 
              mentoring: {
                ...settings.mentoring, 
                workingHours: {...settings.mentoring.workingHours, end: e.target.value}
              }
            })}
          />
        </div>
      </div>
      
      <h4>Booking Settings</h4>
      <div className="settings-checkbox-group">
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.mentoring.autoAcceptBookings}
            onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, autoAcceptBookings: e.target.checked}})}
          />
          Auto-accept bookings
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.mentoring.requireApproval}
            onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, requireApproval: e.target.checked}})}
          />
          Require approval for bookings
        </label>
      </div>
      
      <div className="settings-form-group">
        <label>Cancellation Policy</label>
        <select 
          value={settings.mentoring.cancellationPolicy}
          onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, cancellationPolicy: e.target.value}})}
        >
          <option value="24 hours">24 hours notice required</option>
          <option value="48 hours">48 hours notice required</option>
          <option value="1 week">1 week notice required</option>
          <option value="flexible">Flexible cancellation</option>
        </select>
      </div>
      
      <div className="settings-form-group">
        <label>Refund Policy</label>
        <select 
          value={settings.mentoring.refundPolicy}
          onChange={(e) => setSettings({...settings, mentoring: {...settings.mentoring, refundPolicy: e.target.value}})}
        >
          <option value="Full refund within 24 hours">Full refund within 24 hours</option>
          <option value="50% refund within 48 hours">50% refund within 48 hours</option>
          <option value="No refunds">No refunds</option>
          <option value="Case by case">Case by case basis</option>
        </select>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="settings-section">
      <h3>Appearance & Theme</h3>
      
      <InfoAlert 
        title="Customize Your Experience" 
        type="info"
        className="mb-4"
      >
        Personalize the look and feel of the platform to match your preferences. 
        These settings help create a more comfortable and enjoyable experience.
      </InfoAlert>
      
      <div className="settings-form-group">
        <Tooltip 
          content="Choose your preferred color scheme. Light mode is easier on the eyes during the day, while dark mode is better for low-light environments."
          position="top"
          delay={300}
        >
          <label className="font-size-label">Theme</label>
        </Tooltip>
        <div className="settings-theme-selector">
          <label className="settings-theme-option">
            <input 
              type="radio" 
              name="theme" 
              value="light"
              checked={settings.appearance.theme === 'light'}
              onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, theme: e.target.value as 'light' | 'dark' | 'auto'}})}
            />
            <FaSun />
            <span>Light</span>
          </label>
          
          <label className="settings-theme-option">
            <input 
              type="radio" 
              name="theme" 
              value="dark"
              checked={settings.appearance.theme === 'dark'}
              onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, theme: e.target.value as 'light' | 'dark' | 'auto'}})}
            />
            <FaMoon />
            <span>Dark</span>
          </label>
          
          <label className="settings-theme-option">
            <input 
              type="radio" 
              name="theme" 
              value="auto"
              checked={settings.appearance.theme === 'auto'}
              onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, theme: e.target.value as 'light' | 'dark' | 'auto'}})}
            />
            <FaDesktop />
            <span>Auto</span>
          </label>
        </div>
      </div>
      
      <div className="settings-form-row">
        <div className="settings-form-group">
          <label>Primary Color</label>
          <input 
            type="color" 
            value={settings.appearance.primaryColor}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, primaryColor: e.target.value}})}
          />
        </div>
        
        <div className="settings-form-group">
          <label>Accent Color</label>
          <input 
            type="color" 
            value={settings.appearance.accentColor}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, accentColor: e.target.value}})}
          />
        </div>
      </div>
      
      <div className="settings-form-row">
        <div className="settings-form-group">
          <label>Font Size</label>
          <select 
            value={settings.appearance.fontSize}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, fontSize: e.target.value as 'small' | 'medium' | 'large'}})}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        
        <div className="settings-form-group">
          <label>Font Family</label>
          <select 
            value={settings.appearance.fontFamily}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, fontFamily: e.target.value}})}
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Poppins">Poppins</option>
          </select>
        </div>
      </div>
      
      <h4>Interface Options</h4>
      <div className="settings-checkbox-group">
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.appearance.compactMode}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, compactMode: e.target.checked}})}
          />
          Compact mode
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.appearance.showAnimations}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, showAnimations: e.target.checked}})}
          />
          Show animations
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.appearance.highContrast}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, highContrast: e.target.checked}})}
          />
          High contrast
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.appearance.reducedMotion}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, reducedMotion: e.target.checked}})}
          />
          Reduced motion
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.appearance.sidebarCollapsed}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, sidebarCollapsed: e.target.checked}})}
          />
          Collapsed sidebar by default
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.appearance.showTooltips}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, showTooltips: e.target.checked}})}
          />
          Show tooltips
        </label>
        
        <label className="settings-checkbox-label">
          <input 
            type="checkbox" 
            checked={settings.appearance.showBreadcrumbs}
            onChange={(e) => setSettings({...settings, appearance: {...settings.appearance, showBreadcrumbs: e.target.checked}})}
          />
          Show breadcrumbs
        </label>
      </div>
    </div>
  );

  const renderAccessibilitySettings = () => (
    <div className="settings-section">
      <h3>Accessibility Settings</h3>
      
      <InfoAlert 
        title="Accessibility Features" 
        type="info"
        className="mb-4"
      >
        These settings help make the website more accessible and easier to use. 
        Changes are saved automatically and will persist across all your devices when you're logged in.
      </InfoAlert>
      
      <div className="settings-form-group">
        <Tooltip 
          content="Adjust the font size across the entire website. This affects all text, buttons, and interface elements to make them easier to read. The setting is saved automatically and will remember your preference."
          position="top"
          delay={300}
        >
          <label className="font-size-label">Font Size: {fontSize}px</label>
        </Tooltip>
        <input 
          type="range" 
          min="12" 
          max="24" 
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value))}
          className="settings-font-size-slider"
        />
        <div className="settings-slider-labels">
          <span>Small (12px)</span>
          <span>Large (24px)</span>
        </div>
        
        <InfoAlert 
          title="💡 Pro Tip" 
          type="tip"
          className="mt-2"
        >
          Try adjusting the font size slider above to find your perfect reading size. 
          The changes apply instantly across the entire website, and your preference 
          will be remembered for future visits.
        </InfoAlert>
      </div>

      <div className="settings-checkbox-group">
        <Tooltip 
          content="Enables better support for screen readers and assistive technologies. This improves the experience for users who rely on screen readers to navigate the website."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.accessibility.screenReader}
              onChange={(e) => setSettings({...settings, accessibility: {...settings.accessibility, screenReader: e.target.checked}})}
            />
            Screen reader support
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Increases the contrast between text and background colors to make content easier to read for users with visual impairments."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.accessibility.highContrast}
              onChange={(e) => setSettings({...settings, accessibility: {...settings.accessibility, highContrast: e.target.checked}})}
            />
            High contrast mode
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Enables the big text mode which increases font sizes across the entire website. This works together with the font size slider above to make text more readable."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={isBigTextEnabled}
              onChange={toggleBigText}
            />
            <FaTextHeight style={{ marginRight: '8px' }} />
            Big text mode (increases font size across the entire website)
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Reduces or eliminates animations and transitions for users who are sensitive to motion. This helps prevent dizziness and other motion-related discomfort."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.accessibility.reducedMotion}
              onChange={(e) => setSettings({...settings, accessibility: {...settings.accessibility, reducedMotion: e.target.checked}})}
            />
            Reduced motion
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Enhances keyboard navigation by making it easier to navigate through the website using only the keyboard (Tab, Enter, Arrow keys)."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.accessibility.keyboardNavigation}
              onChange={(e) => setSettings({...settings, accessibility: {...settings.accessibility, keyboardNavigation: e.target.checked}})}
            />
            Enhanced keyboard navigation
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Makes focus indicators more visible and prominent so users can easily see which element is currently selected when navigating with the keyboard."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.accessibility.focusIndicators}
              onChange={(e) => setSettings({...settings, accessibility: {...settings.accessibility, focusIndicators: e.target.checked}})}
            />
            Enhanced focus indicators
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Adjusts colors and provides alternative visual cues to make the website more accessible for users with color vision deficiencies."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.accessibility.colorBlindSupport}
              onChange={(e) => setSettings({...settings, accessibility: {...settings.accessibility, colorBlindSupport: e.target.checked}})}
            />
            Color blind support
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Uses fonts and text formatting that are easier to read for users with dyslexia, including better letter spacing and font choices."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.accessibility.dyslexiaSupport}
              onChange={(e) => setSettings({...settings, accessibility: {...settings.accessibility, dyslexiaSupport: e.target.checked}})}
            />
            Dyslexia-friendly fonts
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Enables voice control features that allow users to navigate and interact with the website using voice commands."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.accessibility.voiceControl}
              onChange={(e) => setSettings({...settings, accessibility: {...settings.accessibility, voiceControl: e.target.checked}})}
            />
            Voice control support
          </label>
        </Tooltip>
        
        <Tooltip 
          content="Enables gesture-based navigation for touch devices, making it easier to navigate using swipes, pinches, and other touch gestures."
          position="right"
          delay={400}
        >
          <label className="settings-checkbox-label">
            <input 
              type="checkbox" 
              checked={settings.accessibility.gestureControl}
              onChange={(e) => setSettings({...settings, accessibility: {...settings.accessibility, gestureControl: e.target.checked}})}
            />
            Gesture control support
          </label>
        </Tooltip>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'mentoring':
        return renderMentoringSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'accessibility':
        return renderAccessibilitySettings();
      default:
        return (
          <div className="settings-section">
            <h3>{tabs.find(tab => tab.id === activeTab)?.label} Settings</h3>
            <p>Settings for {activeTab} are coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="overlay">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Settings</h1>
          <button className="settings-close-button" onClick={() => navigate(-1)} aria-label="Close settings">
            <FaTimes />
          </button>
        </div>
        
        <div className="settings-content">
          <div className="settings-sidebar">
            <nav className="settings-nav">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isAccessibility = tab.id === 'accessibility';
                
                const button = (
                  <button
                    key={tab.id}
                    className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon />
                    <span>{tab.label}</span>
                  </button>
                );

                if (isAccessibility) {
                  return button;
                }

                return button;
              })}
            </nav>
          </div>
          
          <div className="settings-main">
            <div className="settings-content-wrapper">
              {renderTabContent()}
              
              <div className="settings-actions">
                <button className="settings-btn settings-btn-secondary" onClick={handleReset}>
                  Reset to Default
                </button>
                <button className="settings-btn settings-btn-primary" onClick={handleSave}>
                  <FaSave />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={confirmReset}
        title="Reset Settings"
        message="Are you sure you want to reset all settings to their default values? This action cannot be undone and will affect all your preferences."
        confirmText="Reset Settings"
        cancelText="Cancel"
        type="warning"
      />
      
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message="Are you absolutely sure you want to delete your account? This will permanently remove all your data, settings, and mentoring relationships. This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        type="error"
      />
      
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={infoModalContent.title}
        type="success"
        size="small"
      >
        <p>{infoModalContent.content}</p>
        <div className="modal-buttons">
          <button
            className="modal-button modal-button-primary"
            onClick={() => setShowInfoModal(false)}
          >
            Got it
          </button>
        </div>
      </Modal>
    </div>
  );
} 