import React, { useState } from 'react';
import { 
  FaCalendarAlt, 
  FaExternalLinkAlt, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaArrowRight,
  FaArrowLeft,
  FaUserPlus,
  FaLink,
  FaCopy,
  FaCheck,
  FaKey,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebase';
import { CalComTokenManager } from '../../widgets/MentorAlgorithm/CalCom/calComService';
import Modal from '../../ui/Modal';
import './CalComSetupModal.css';

interface CalComSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

type TutorialStep = 1 | 2 | 3 | 4 | 5 | 6;

const CalComSetupModal: React.FC<CalComSetupModalProps> = ({ isOpen, onComplete }) => {
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<TutorialStep>(1);
  const [calComUrl, setCalComUrl] = useState('');
  const [calComApiKey, setCalComApiKey] = useState('');
  const [calComUsername, setCalComUsername] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);

  const validateCalComUrl = (url: string): boolean => {
    // Validate Cal.com URL format
    const calComPattern = /^https?:\/\/(.*\.)?cal\.com\/[^/]+/i;
    return calComPattern.test(url);
  };

  const extractUsernameFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        return pathParts[0];
      }
      // Check for subdomain format (username.cal.com)
      const hostname = urlObj.hostname;
      if (hostname.includes('.cal.com')) {
        return hostname.split('.cal.com')[0];
      }
      return null;
    } catch {
      return null;
    }
  };

  const validateApiKey = (key: string): boolean => {
    // Cal.com API keys are typically long alphanumeric strings
    // They usually start with 'cal_' and are at least 40 characters
    return key.trim().length >= 20 && (key.startsWith('cal_') || key.length >= 40);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // After welcome, check if they have an account
      if (hasAccount === null) {
        setError('Please select whether you have a Cal.com account');
        return;
      }
      // Skip sign-up step if they already have an account
      setCurrentStep(hasAccount ? 3 : 2);
    } else if (currentStep === 2) {
      // After sign-up, go to create booking page
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // After creating booking page, go to get URL
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // After getting URL, go to enter URL
      setCurrentStep(5);
    } else if (currentStep === 5) {
      // After entering URL, extract username and go to API key step
      const username = extractUsernameFromUrl(calComUrl.trim());
      if (username) {
        setCalComUsername(username);
      }
      setCurrentStep(6);
    }
    setError(null);
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(hasAccount ? 1 : 2);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    } else if (currentStep === 5) {
      setCurrentStep(4);
    } else if (currentStep === 6) {
      setCurrentStep(5);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.uid) {
      setError('You must be logged in to set up Cal.com');
      return;
    }

    if (!calComUrl.trim()) {
      setError('Please enter your Cal.com URL');
      return;
    }

    if (!validateCalComUrl(calComUrl.trim())) {
      setError('Please enter a valid Cal.com URL (e.g., https://cal.com/yourusername or https://yourusername.cal.com)');
      return;
    }

    if (!calComApiKey.trim()) {
      setError('Please enter your Cal.com API key');
      return;
    }

    if (!validateApiKey(calComApiKey.trim())) {
      setError('Please enter a valid Cal.com API key. It should be a long string (usually starts with "cal_" or is at least 40 characters)');
      return;
    }

    // Extract username if not already set
    const username = calComUsername || extractUsernameFromUrl(calComUrl.trim());
    if (!username) {
      setError('Could not extract username from URL. Please check your URL format.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Store API key securely using CalComTokenManager
      await CalComTokenManager.storeApiKey(
        currentUser.uid,
        calComApiKey.trim(),
        username
      );

      // Update the mentor profile with Cal.com URL
      const profileRef = doc(firestore, 'users', currentUser.uid, 'mentorProgram', 'profile');
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) {
        throw new Error('Profile not found');
      }

      await updateDoc(profileRef, {
        calCom: calComUrl.trim()
      });

      // Success - close modal and allow dashboard access
      onComplete();
    } catch (err) {
      console.error('Error saving Cal.com setup:', err);
      setError(err instanceof Error ? err.message : 'Failed to save Cal.com setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyExampleUrl = () => {
    const exampleUrl = 'https://cal.com/yourusername';
    navigator.clipboard.writeText(exampleUrl).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    });
  };

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="calcom-tutorial-step">
            <div className="calcom-step-icon">
              <FaCalendarAlt />
            </div>
            <h3>Welcome to Cal.com Setup!</h3>
            <p className="calcom-step-description">
              To host calls with your mentees, we use Cal.com for scheduling. This quick tutorial will guide you through setting up your account.
            </p>
            <div className="calcom-account-question">
              <p className="calcom-question-text">Do you already have a Cal.com account?</p>
              <div className="calcom-account-options">
                <button
                  type="button"
                  className={`calcom-option-btn ${hasAccount === true ? 'selected' : ''}`}
                  onClick={() => {
                    setHasAccount(true);
                    setError(null);
                  }}
                >
                  <FaCheckCircle /> Yes, I have an account
                </button>
                <button
                  type="button"
                  className={`calcom-option-btn ${hasAccount === false ? 'selected' : ''}`}
                  onClick={() => {
                    setHasAccount(false);
                    setError(null);
                  }}
                >
                  <FaUserPlus /> No, I need to sign up
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="calcom-tutorial-step">
            <div className="calcom-step-icon">
              <FaUserPlus />
            </div>
            <h3>Step 1: Sign Up for Cal.com</h3>
            <p className="calcom-step-description">
              Create your free Cal.com account to get started with scheduling.
            </p>
            <div className="calcom-instruction-box">
              <ol className="calcom-instruction-list">
                <li>Click the button below to open Cal.com in a new tab</li>
                <li>Click "Sign up" or "Get started" on the Cal.com website</li>
                <li>Create your account using your email address</li>
                <li>Verify your email if prompted</li>
                <li>Once you're logged in, come back here and click "Next"</li>
              </ol>
              <a
                href="https://cal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="calcom-action-link"
              >
                <FaExternalLinkAlt /> Open Cal.com Sign Up
              </a>
            </div>
            <div className="calcom-step-note">
              <FaCheckCircle /> Don't worry - we'll wait for you! Take your time to complete the sign-up process.
            </div>
          </div>
        );

      case 3:
        return (
          <div className="calcom-tutorial-step">
            <div className="calcom-step-icon">
              <FaCalendarAlt />
            </div>
            <h3>Step 2: Create Your Booking Page</h3>
            <p className="calcom-step-description">
              Set up your public booking page so mentees can schedule sessions with you.
            </p>
            <div className="calcom-instruction-box">
              <ol className="calcom-instruction-list">
                <li>In Cal.com, go to your dashboard</li>
                <li>Click on "Event Types" or "New Event Type"</li>
                <li>Choose a meeting type (e.g., "30 Minute Meeting")</li>
                <li>Set your availability and preferences</li>
                <li>Make sure the event type is set to "Public"</li>
                <li>Save your event type</li>
              </ol>
              <div className="calcom-tip-box">
                <strong>💡 Tip:</strong> You can create multiple event types for different session lengths (15 min, 30 min, 60 min, etc.)
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="calcom-tutorial-step">
            <div className="calcom-step-icon">
              <FaLink />
            </div>
            <h3>Step 3: Get Your Cal.com URL</h3>
            <p className="calcom-step-description">
              Find and copy your public booking page URL from Cal.com.
            </p>
            <div className="calcom-instruction-box">
              <ol className="calcom-instruction-list">
                <li>In Cal.com, go to your Event Types</li>
                <li>Click on the event type you want to use</li>
                <li>Click "Copy Public Page Link" at the bottom of the sidebar</li>
                <li>The full URL will be copied to your clipboard (it will look like: <code>https://cal.com/yourusername</code>)</li>
              </ol>
              <div className="calcom-url-example">
                <p>Your URL should look like one of these:</p>
                <div className="calcom-url-examples">
                  <code onClick={copyExampleUrl} className="calcom-url-code">
                    https://cal.com/yourusername
                    {urlCopied ? <FaCheck className="copied-icon" /> : <FaCopy className="copy-icon" />}
                  </code>
                  <code className="calcom-url-code">
                    https://yourusername.cal.com
                  </code>
                </div>
                {urlCopied && <span className="calcom-copied-message">Copied to clipboard!</span>}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="calcom-tutorial-step">
            <div className="calcom-step-icon">
              <FaLink />
            </div>
            <h3>Step 4: Enter Your Cal.com URL</h3>
            <p className="calcom-step-description">
              Paste your Cal.com booking URL below.
            </p>
            {error && (
              <div className="calcom-setup-error">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            )}
            <form className="calcom-setup-form">
              <div className="calcom-setup-input-group">
                <label htmlFor="calcom-url">
                  Your Cal.com Public Page URL <span className="required">*</span>
                </label>
                <input
                  type="url"
                  id="calcom-url"
                  value={calComUrl}
                  onChange={(e) => {
                    setCalComUrl(e.target.value);
                    setError(null);
                    // Auto-extract username when URL is entered
                    const username = extractUsernameFromUrl(e.target.value);
                    if (username) {
                      setCalComUsername(username);
                    }
                  }}
                  placeholder="https://cal.com/yourusername"
                  disabled={isLoading}
                  required
                />
                <small className="calcom-setup-hint">
                  Paste the full URL you copied from Cal.com
                </small>
              </div>
            </form>
            <div className="calcom-step-note">
              <FaCheckCircle /> We'll use this to extract your username for API access.
            </div>
          </div>
        );

      case 6:
        return (
          <div className="calcom-tutorial-step">
            <div className="calcom-step-icon">
              <FaKey />
            </div>
            <h3>Step 5: Get Your Cal.com API Key</h3>
            <p className="calcom-step-description">
              To automatically sync bookings, we need your Cal.com API key. Don't worry - it's stored securely!
            </p>
            <div className="calcom-instruction-box">
              <ol className="calcom-instruction-list">
                <li>In Cal.com, go to <strong>Settings</strong> → <strong>Developer</strong> → <strong>API Keys</strong></li>
                <li>Click <strong>"Create API Key"</strong> or use an existing one</li>
                <li>Give it a name (e.g., "Bgr8 Integration")</li>
                <li>Copy the API key (it will look like: <code>cal_xxxxxxxxxxxxx</code> or a long string)</li>
                <li>Paste it in the field below</li>
              </ol>
              <a
                href="https://cal.com/settings/developer/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="calcom-action-link"
              >
                <FaExternalLinkAlt /> Open Cal.com API Keys Settings
              </a>
            </div>
            {error && (
              <div className="calcom-setup-error">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="calcom-setup-form">
              <div className="calcom-setup-input-group">
                <label htmlFor="calcom-api-key">
                  Your Cal.com API Key <span className="required">*</span>
                </label>
                <div className="calcom-api-key-input-wrapper">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    id="calcom-api-key"
                    value={calComApiKey}
                    onChange={(e) => {
                      setCalComApiKey(e.target.value);
                      setError(null);
                    }}
                    placeholder="cal_xxxxxxxxxxxxx or your API key"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="calcom-api-key-toggle"
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <small className="calcom-setup-hint">
                  Your API key is encrypted and stored securely. It's only used to sync bookings automatically.
                </small>
              </div>
            </form>
            <div className="calcom-step-note">
              <FaCheckCircle /> Your API key is stored securely and encrypted. You can revoke it anytime in Cal.com settings.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing without completing setup
      title="Set Up Cal.com"
      type="info"
      size="large"
      showCloseButton={false}
      closeOnOverlayClick={false}
    >
      <div className="calcom-setup-content">
        {/* Progress Bar */}
        <div className="calcom-progress-container">
          <div className="calcom-progress-bar">
            <div 
              className="calcom-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="calcom-progress-text">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Step Content */}
        <div className="calcom-tutorial-content">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="calcom-navigation">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="calcom-nav-btn calcom-nav-btn-back"
              disabled={isLoading}
            >
              <FaArrowLeft /> Back
            </button>
          )}
          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="calcom-nav-btn calcom-nav-btn-next"
              disabled={
                isLoading || 
                (currentStep === 1 && hasAccount === null) ||
                (currentStep === 5 && !calComUrl.trim())
              }
            >
              Next <FaArrowRight />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="calcom-nav-btn calcom-nav-btn-complete"
              disabled={isLoading || !calComUrl.trim() || !calComApiKey.trim()}
            >
              {isLoading ? (
                <>Saving...</>
              ) : (
                <>
                  <FaCheckCircle /> Complete Setup
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CalComSetupModal;

