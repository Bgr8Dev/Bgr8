import React, { useState, useEffect, useCallback } from 'react';
import { FaCalendarAlt, FaKey, FaUnlink, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../../../hooks/useAuth';
import { CalComTokenManager, CalComService, CalComUtils } from './calComService';
import { loggers } from '../../../../utils/logger';
import './CalComModal.css';

interface CalComConnectProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CalComConnect: React.FC<CalComConnectProps> = ({ open, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [calComUrl, setCalComUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{
    username: string;
  } | null>(null);

  const checkConnectionStatus = useCallback(async () => {
    if (!currentUser) return;
    try {
      const hasApiKey = await CalComTokenManager.hasApiKey(currentUser.uid);
      setIsConnected(hasApiKey);
      if (hasApiKey) {
        const apiKeyData = await CalComTokenManager.getApiKeyData(currentUser.uid);
        if (apiKeyData) {
          setTokenInfo({
            username: apiKeyData.calComUsername
          });
        }
      }
    } catch (error) {
      loggers.booking.error('Error checking connection status:', error);
    }
  }, [currentUser]);
  
  useEffect(() => {
    if (open) {
      checkConnectionStatus();
    }
  }, [open, checkConnectionStatus]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Validate Cal.com URL
      if (!CalComUtils.isValidCalComUrl(calComUrl)) {
        throw new Error('Please enter a valid Cal.com URL');
      }
      // Extract username from URL
      const username = CalComUtils.extractUsernameFromUrl(calComUrl);
      if (!username) {
        throw new Error('Could not extract username from Cal.com URL');
      }
      // Validate API key
      if (!apiKey.trim()) {
        throw new Error('API key is required');
      }
      // Store API key securely
      await CalComTokenManager.storeApiKey(
        currentUser.uid,
        apiKey.trim(),
        username
      );
      // Test the connection by fetching event types
      await CalComService.getEventTypes(currentUser.uid);
      setSuccess('Cal.com account connected successfully!');
      setIsConnected(true);
      await checkConnectionStatus();
      // Clear form
      setCalComUrl('');
      setApiKey('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      loggers.booking.error('Error connecting Cal.com account:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect Cal.com account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      await CalComTokenManager.removeApiKey(currentUser.uid);
      setIsConnected(false);
      setTokenInfo(null);
      setSuccess('Cal.com account disconnected successfully');
    } catch (error) {
      loggers.booking.error('Error disconnecting Cal.com account:', error);
      setError('Failed to disconnect Cal.com account');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="calcom-modal-overlay" onClick={onClose}>
      <div className="calcom-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="calcom-modal-header">
          <h3>
            <FaCalendarAlt /> Cal.com Integration
          </h3>
          <button onClick={onClose} className="calcom-modal-close" title="Close">
            <FaTimes />
          </button>
        </div>
        <div className="calcom-modal-content">
          {error && (
            <div style={{ 
              background: 'rgba(255, 42, 42, 0.1)', 
              border: '1px solid #ff2a2a', 
              borderRadius: 8, 
              padding: '1rem', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <FaExclamationTriangle style={{ color: '#ff2a2a' }} />
              <span style={{ color: '#ff2a2a' }}>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ 
              background: 'rgba(0, 255, 0, 0.1)', 
              border: '1px solid #00ff00', 
              borderRadius: 8, 
              padding: '1rem', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <FaCheckCircle style={{ color: '#00ff00' }} />
              <span style={{ color: '#00ff00' }}>{success}</span>
            </div>
          )}

          {isConnected && tokenInfo ? (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: '#ff2a2a', marginBottom: '1rem' }}>
                <FaCheckCircle style={{ marginRight: 8 }} />
                Connected to Cal.com
              </h4>
              <div style={{ 
                background: '#2a2a2a', 
                padding: '1rem', 
                borderRadius: 8, 
                marginBottom: '1rem' 
              }}>
                <p><strong>Username:</strong> {tokenInfo.username}</p>
                <p style={{ color: '#00ff00' }}>
                  <strong>Status:</strong> Connected
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  style={{
                    background: 'transparent',
                    color: '#ff2a2a',
                    border: '1px solid #ff2a2a',
                    borderRadius: 8,
                    padding: '0.7rem 1.4rem',
                    fontWeight: 600,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  <FaUnlink style={{ marginRight: 8 }} />
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ color: '#ff2a2a', marginBottom: '1rem' }}>
                <FaKey style={{ marginRight: 8 }} />
                Connect Your Cal.com Account
              </h4>
              <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
                To enable API-based booking management, you need to connect your Cal.com account. 
                This allows the system to create and manage bookings programmatically.
              </p>
              <form onSubmit={handleConnect}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Cal.com URL *
                  </label>
                  <input
                    type="url"
                    value={calComUrl}
                    onChange={(e) => setCalComUrl(e.target.value)}
                    placeholder="https://cal.com/yourusername"
                    required
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: 8,
                      border: '1px solid #333',
                      background: '#2a2a2a',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    API Key *
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Cal.com API key"
                    required
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: 8,
                      border: '1px solid #333',
                      background: '#2a2a2a',
                      color: '#fff',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(90deg, #ff2a2a 60%, #a80000 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '1rem',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <FaCalendarAlt style={{ marginRight: 8 }} />
                      Connect Cal.com Account
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
          <div style={{ 
            background: '#2a2a2a', 
            padding: '1rem', 
            borderRadius: 8, 
            fontSize: '0.9rem',
            lineHeight: 1.5
          }}>
            <h5 style={{ marginBottom: '0.5rem', color: '#ff2a2a' }}>How to get your Cal.com API key:</h5>
            <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Go to your Cal.com account settings</li>
              <li>Navigate to "Developer" &rarr; "API keys"</li>
              <li>Create a new API key if needed</li>
              <li>Copy the API key</li>
              <li>Enter your Cal.com URL (e.g., https://cal.com/yourusername)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalComConnect; 