import React, { useState, useEffect, useRef } from 'react';
import { FaComments, FaPaperPlane, FaSearch, FaPlus, FaCheck, FaCheckDouble, FaEllipsisV, FaInfoCircle, FaTrash, FaDownload } from 'react-icons/fa';
import { Timestamp, getDoc, doc } from 'firebase/firestore';
import BannerWrapper from '../ui/BannerWrapper';
import Modal from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { MessagingService, Message, Conversation, GDPR_INTRO_MESSAGE } from '../../services/messagingService';
import { MentorMenteeProfile } from '../../components/widgets/MentorAlgorithm/algorithm/matchUsers';
import { firestore } from '../../firebase/firebase';
import { loggers } from '../../utils/logger';
import './MessagingWidget.css';

const MessagingWidget: React.FC = () => {
  const { currentUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'pinned' | 'archived'>('all');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Listen for openMessaging events from Message buttons
  useEffect(() => {
    const handleOpenMessaging = async (event: Event) => {
      const customEvent = event as CustomEvent<{ userId: string }>;
      const targetUserId = customEvent.detail?.userId;
      
      if (!targetUserId || !currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Expand the widget if not already expanded
        if (!isExpanded) {
          setIsExpanded(true);
        }
        
        // Load conversations if not already loaded
        let convos = conversations;
        if (convos.length === 0) {
          convos = await MessagingService.getConversations(currentUser.uid);
          setConversations(convos);
        }
        
        // Find existing conversation with this user
        let conversation = convos.find(
          conv => conv.participantId === targetUserId
        );
        
        if (!conversation) {
          // Create conversation if it doesn't exist
          const conversationId = await MessagingService.getOrCreateConversation(
            currentUser.uid,
            targetUserId
          );
          
          // Get user profile for name and avatar
          const targetUserProfile = await getDoc(
            doc(firestore, 'users', targetUserId, 'mentorProgram', 'profile')
          );
          
          const targetUserData = targetUserProfile.data() as MentorMenteeProfile | undefined;
          const targetUserName = targetUserData
            ? `${targetUserData.firstName} ${targetUserData.lastName}`
            : 'User';
          
          // Get profile picture, ensuring it's a string
          const profilePicture = targetUserData?.profilePicture;
          const participantAvatar = typeof profilePicture === 'string' ? profilePicture : undefined;
          
          // Create a temporary conversation object
          conversation = {
            id: conversationId,
            participantId: targetUserId,
            participantName: targetUserName,
            participantAvatar,
            lastMessage: null,
            unreadCount: 0,
            isOnline: false,
            isPinned: false,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        if (conversation) {
          setSelectedConversation(conversation);
        }
      } catch (err) {
        loggers.error.error('Error opening conversation:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to open conversation';
        setError(errorMessage);
        setErrorModalMessage(errorMessage);
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };
    
    window.addEventListener('openMessaging', handleOpenMessaging);
    
    return () => {
      window.removeEventListener('openMessaging', handleOpenMessaging);
    };
  }, [currentUser, isExpanded, conversations]);

  // Load conversations on mount and when expanded
  useEffect(() => {
    if (!currentUser || !isExpanded) return;

    const loadConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const convos = await MessagingService.getConversations(currentUser.uid);
        setConversations(convos);
      } catch (err) {
        loggers.error.error('Error loading conversations:', err);
        const errorMessage = 'Failed to load conversations';
        setError(errorMessage);
        setErrorModalMessage(errorMessage);
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser, isExpanded]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !currentUser) return;

    const loadMessages = async () => {
      try {
        setLoading(true);
        const msgs = await MessagingService.getMessages(selectedConversation.id);
        setMessages(msgs);

        // Mark messages as read
        await MessagingService.markMessagesAsRead(selectedConversation.id, currentUser.uid);

        // Send introductory message if this is the first time opening
        await MessagingService.sendIntroductoryMessage(
          selectedConversation.id,
          currentUser.uid,
          selectedConversation.participantId
        );

        // Subscribe to real-time updates
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        unsubscribeRef.current = MessagingService.subscribeToMessages(
          selectedConversation.id,
          (newMessages) => {
            setMessages(newMessages);
            // Mark as read when new messages arrive
            MessagingService.markMessagesAsRead(selectedConversation.id, currentUser.uid);
          }
        );
      } catch (err) {
        loggers.error.error('Error loading messages:', err);
        const errorMessage = 'Failed to load messages';
        setError(errorMessage);
        setErrorModalMessage(errorMessage);
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Cleanup subscription on unmount or conversation change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [selectedConversation, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (conversation.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    let matchesFilter = true;
    switch (filterType) {
      case 'unread':
        matchesFilter = conversation.unreadCount > 0;
        break;
      case 'pinned':
        matchesFilter = conversation.isPinned;
        break;
      case 'archived':
        matchesFilter = conversation.isArchived;
        break;
      default:
        matchesFilter = !conversation.isArchived;
    }
    
    return matchesSearch && matchesFilter;
  });

  const formatTimestamp = (timestamp: string | Date | Timestamp) => {
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 0) {
      return 'Just now';
    } else if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser || sending) return;
    
    try {
      setSending(true);
      setError(null);
      await MessagingService.sendMessage(
        currentUser.uid,
        selectedConversation.participantId,
        newMessage.trim()
      );
      setNewMessage('');
      setError(null);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      setErrorModalMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser) return;
    
    if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return;
    }
    
    try {
      await MessagingService.deleteMessage(messageId, currentUser.uid);
      // Refresh messages to show deleted state
      if (selectedConversation) {
        const msgs = await MessagingService.getMessages(selectedConversation.id);
        setMessages(msgs);
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMessage);
      setErrorModalMessage(errorMessage);
      setShowErrorModal(true);
    }
  };

  const handleExportConversation = async () => {
    if (!selectedConversation || !currentUser) return;
    
    try {
      setLoading(true);
      const exportData = await MessagingService.exportConversationData(
        currentUser.uid,
        selectedConversation.id
      );
      
      // Create download link
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${selectedConversation.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting conversation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to export conversation';
      setError(errorMessage);
      setErrorModalMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMessages([]); // Clear messages when switching conversations
  };

  const handleStartNewChat = () => {
    setShowNewChatModal(true);
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <BannerWrapper sectionId="messaging" bannerType="element">
      <div className="messaging-widget">
        <div className="messaging-header">
          <div className="messaging-title">
            <FaComments className="messaging-icon" />
            <h3>Messages</h3>
            {totalUnread > 0 && (
              <span className="unread-badge">{totalUnread}</span>
            )}
          </div>
          <button 
            className="expand-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse messages" : "Expand messages"}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {isExpanded && (
          <div className="messaging-content">
            {!selectedConversation ? (
              // Conversations List View
              <>
                {/* Search and Filter */}
                <div className="messaging-controls">
                  <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="filter-tabs">
                    {[
                      { key: 'all', label: 'All', count: conversations.filter(c => !c.isArchived).length },
                      { key: 'unread', label: 'Unread', count: conversations.reduce((sum, c) => sum + c.unreadCount, 0) },
                      { key: 'pinned', label: 'Pinned', count: conversations.filter(c => c.isPinned).length },
                      { key: 'archived', label: 'Archived', count: conversations.filter(c => c.isArchived).length }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        className={`filter-tab ${filterType === tab.key ? 'active' : ''}`}
                        onClick={() => setFilterType(tab.key as 'all' | 'unread' | 'pinned' | 'archived')}
                      >
                        {tab.label}
                        {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversations List */}
                <div className="conversations-list">
                  {loading ? (
                    <div className="no-conversations">
                      <p>Loading conversations...</p>
                    </div>
                  ) : error ? (
                    <div className="no-conversations">
                      <p style={{ color: 'red' }}>{error}</p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="no-conversations">
                      <FaComments className="no-conversations-icon" />
                      <p>No conversations found</p>
                      <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '8px' }}>
                        Start a conversation with one of your matches!
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map(conversation => (
                      <div
                        key={conversation.id}
                        className={`conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                        onClick={() => handleConversationClick(conversation)}
                      >
                        <div className="conversation-avatar">
                          <img
                            src={conversation.participantAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.participantName)}&background=random`}
                            alt={conversation.participantName}
                          />
                          {conversation.isOnline && <div className="online-indicator" />}
                        </div>
                        <div className="conversation-content">
                          <div className="conversation-header">
                            <h4 className="conversation-name">{conversation.participantName}</h4>
                            {conversation.lastMessage && (
                              <span className="conversation-time">
                                {formatTimestamp(conversation.lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          <div className="conversation-preview">
                            {conversation.lastMessage ? (
                              <>
                                <p className="conversation-message">
                                  {conversation.lastMessage.senderId === currentUser?.uid ? 'You: ' : ''}
                                  {conversation.lastMessage.content}
                                </p>
                                <div className="conversation-meta">
                                  {conversation.lastMessage.attachments && conversation.lastMessage.attachments.length > 0 && (
                                    <span className="attachment-indicator">📎</span>
                                  )}
                                  {conversation.lastMessage.senderId === currentUser?.uid ? (
                                    conversation.lastMessage.isRead ? (
                                      <FaCheckDouble className="read-indicator" />
                                    ) : (
                                      <FaCheck className="delivered-indicator" />
                                    )
                                  ) : conversation.unreadCount > 0 && (
                                    <span className="unread-count">{conversation.unreadCount}</span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <p className="conversation-message" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                                No messages yet
                              </p>
                            )}
                          </div>
                        </div>
                        {conversation.isPinned && <div className="pinned-indicator">📌</div>}
                      </div>
                    ))
                  )}
                </div>

                {/* Start New Chat Button */}
                <div className="start-chat-section">
                  <button className="start-chat-btn" onClick={handleStartNewChat}>
                    <FaPlus />
                    Start New Chat
                  </button>
                </div>
              </>
            ) : (
              // Individual Conversation View
              <div className="conversation-view">
                <div className="conversation-header">
                  <button 
                    className="back-btn"
                    onClick={() => setSelectedConversation(null)}
                  >
                    ← Back
                  </button>
                  <div className="conversation-participant">
                    <img
                      src={selectedConversation.participantAvatar || `https://ui-avatars.com/api/?name=${selectedConversation.participantName}&background=random`}
                      alt={selectedConversation.participantName}
                      className="participant-avatar"
                    />
                    <div className="participant-info">
                      <h4>{selectedConversation.participantName}</h4>
                      <span className="participant-status">
                        {selectedConversation.isOnline ? 'Online' : `Last seen ${selectedConversation.lastSeen}`}
                      </span>
                    </div>
                  </div>
                  <div className="conversation-actions">
                    <button 
                      className="action-btn" 
                      onClick={handleExportConversation}
                      title="Export conversation data (GDPR)"
                      aria-label="Export conversation"
                    >
                      <FaDownload />
                    </button>
                    <button className="action-btn" title="More options" aria-label="More options">
                      <FaEllipsisV />
                    </button>
                  </div>
                </div>

                {/* GDPR Introductory Message Banner */}
                {selectedConversation && (
                  <div className="gdpr-intro-banner">
                    <FaInfoCircle />
                    <p>
                      <strong>Privacy Notice:</strong> {GDPR_INTRO_MESSAGE}
                    </p>
                  </div>
                )}

                <div className="messages-container">
                  <div className="messages-list">
                    {loading && messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p>Loading messages...</p>
                      </div>
                    ) : error ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                        <p>{error}</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', opacity: 0.7 }}>
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isSent = message.senderId === currentUser?.uid;
                        const isSystem = message.type === 'system';
                        
                        return (
                          <div
                            key={message.id}
                            className={`message-item ${isSent ? 'sent' : 'received'} ${isSystem ? 'system' : ''}`}
                          >
                            {!isSent && !isSystem && (
                              <div className="message-avatar">
                                <img
                                  src={message.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderName)}&background=random`}
                                  alt={message.senderName}
                                />
                              </div>
                            )}
                            <div className="message-content">
                              <div className={`message-bubble ${isSystem ? 'system-message' : ''}`}>
                                <p style={{ 
                                  fontStyle: message.isDeleted ? 'italic' : 'normal',
                                  opacity: message.isDeleted ? 0.6 : 1
                                }}>
                                  {message.isDeleted ? '[Message deleted]' : message.content}
                                </p>
                                <span className="message-time">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                                {isSent && !message.isDeleted && (
                                  <span className="message-status">
                                    {message.isRead ? (
                                      <FaCheckDouble className="read-indicator" />
                                    ) : (
                                      <FaCheck className="delivered-indicator" />
                                    )}
                                  </span>
                                )}
                                {isSent && !message.isDeleted && (
                                  <button
                                    className="message-delete-btn"
                                    onClick={() => handleDeleteMessage(message.id)}
                                    title="Delete message"
                                    aria-label="Delete message"
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
                            </div>
                            {isSent && !isSystem && (
                              <div className="message-avatar">
                                <img
                                  src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.displayName || 'You')}&background=random`}
                                  alt="You"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="message-input">
                  <div className="input-container">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                      disabled={sending}
                    />
                    <button 
                      className="send-btn"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      title="Send message"
                      aria-label="Send message"
                    >
                      <FaPaperPlane />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        title="Start New Chat"
        type="info"
        size="small"
      >
        <div>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            To start a new chat, you can message users from your matches. 
            Navigate to your matches section to find mentors or mentees you're matched with, 
            and start a conversation from there.
          </p>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '20px' }}>
            💡 <strong>Tip:</strong> You can only message users you are matched with through our matching algorithm.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              className="modal-button modal-button-primary"
              onClick={() => setShowNewChatModal(false)}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontWeight: '500'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          setError(null);
        }}
        title="Error"
        type="error"
        size="small"
      >
        <div>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            {errorModalMessage}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              className="modal-button modal-button-primary"
              onClick={() => {
                setShowErrorModal(false);
                setError(null);
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: '#ef4444',
                color: 'white',
                fontWeight: '500'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </BannerWrapper>
  );
};

export default MessagingWidget;
