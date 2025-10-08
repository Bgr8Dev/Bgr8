import React, { useState } from 'react';
import { FaComments, FaPaperPlane, FaSearch, FaPlus, FaCheck, FaCheckDouble, FaEllipsisV } from 'react-icons/fa';
import BannerWrapper from '../ui/BannerWrapper';
import './MessagingWidget.css';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isDelivered: boolean;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: Message;
  unreadCount: number;
  isOnline: boolean;
  lastSeen?: string;
  isPinned: boolean;
  isArchived: boolean;
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    participantId: 'mentor-1',
    participantName: 'Sarah Johnson',
    participantAvatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=random',
    lastMessage: {
      id: 'msg-1',
      senderId: 'mentor-1',
      senderName: 'Sarah Johnson',
      recipientId: 'current-user',
      recipientName: 'You',
      content: 'Thanks for the great session today! The React concepts we discussed really helped clarify things.',
      timestamp: '2024-01-25T14:30:00Z',
      isRead: false,
      isDelivered: true,
      type: 'text'
    },
    unreadCount: 2,
    isOnline: true,
    lastSeen: '2 minutes ago',
    isPinned: true,
    isArchived: false
  },
  {
    id: '2',
    participantId: 'mentor-2',
    participantName: 'Michael Chen',
    participantAvatar: 'https://ui-avatars.com/api/?name=Michael+Chen&background=random',
    lastMessage: {
      id: 'msg-2',
      senderId: 'current-user',
      senderName: 'You',
      recipientId: 'mentor-2',
      recipientName: 'Michael Chen',
      content: 'I have a question about the TypeScript project we discussed. When should I use interfaces vs types?',
      timestamp: '2024-01-25T12:15:00Z',
      isRead: true,
      isDelivered: true,
      type: 'text'
    },
    unreadCount: 0,
    isOnline: false,
    lastSeen: '1 hour ago',
    isPinned: false,
    isArchived: false
  },
  {
    id: '3',
    participantId: 'mentor-3',
    participantName: 'Emily Rodriguez',
    participantAvatar: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=random',
    lastMessage: {
      id: 'msg-3',
      senderId: 'mentor-3',
      senderName: 'Emily Rodriguez',
      recipientId: 'current-user',
      recipientName: 'You',
      content: 'I\'ve shared some additional resources in our shared folder. Check them out when you have time!',
      timestamp: '2024-01-24T16:45:00Z',
      isRead: true,
      isDelivered: true,
      type: 'text',
      attachments: [
        {
          id: 'att-1',
          name: 'Career Development Guide.pdf',
          type: 'pdf',
          size: '2.4 MB',
          url: '#'
        }
      ]
    },
    unreadCount: 0,
    isOnline: true,
    lastSeen: '30 minutes ago',
    isPinned: false,
    isArchived: false
  },
  {
    id: '4',
    participantId: 'mentor-4',
    participantName: 'David Wilson',
    participantAvatar: 'https://ui-avatars.com/api/?name=David+Wilson&background=random',
    lastMessage: {
      id: 'msg-4',
      senderId: 'mentor-4',
      senderName: 'David Wilson',
      recipientId: 'current-user',
      recipientName: 'You',
      content: 'Looking forward to our next session on Monday. We\'ll dive deeper into advanced React patterns.',
      timestamp: '2024-01-23T09:20:00Z',
      isRead: true,
      isDelivered: true,
      type: 'text'
    },
    unreadCount: 0,
    isOnline: false,
    lastSeen: '2 days ago',
    isPinned: false,
    isArchived: true
  }
];

const MessagingWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'pinned' | 'archived'>('all');
  const [newMessage, setNewMessage] = useState('');

  const filteredConversations = MOCK_CONVERSATIONS.filter(conversation => {
    const matchesSearch = conversation.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // In a real implementation, this would send the message
    console.log('Sending message:', newMessage, 'to:', selectedConversation.participantName);
    alert(`Message sent to ${selectedConversation.participantName}!\n\n"${newMessage}"\n\nThis feature is coming soon!`);
    setNewMessage('');
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleStartNewChat = () => {
    // In a real implementation, this would open a new chat modal
    console.log('Starting new chat');
    alert('Start New Chat feature coming soon!');
  };


  const totalUnread = MOCK_CONVERSATIONS.reduce((sum, conv) => sum + conv.unreadCount, 0);

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
                      { key: 'all', label: 'All', count: MOCK_CONVERSATIONS.filter(c => !c.isArchived).length },
                      { key: 'unread', label: 'Unread', count: MOCK_CONVERSATIONS.reduce((sum, c) => sum + c.unreadCount, 0) },
                      { key: 'pinned', label: 'Pinned', count: MOCK_CONVERSATIONS.filter(c => c.isPinned).length },
                      { key: 'archived', label: 'Archived', count: MOCK_CONVERSATIONS.filter(c => c.isArchived).length }
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
                  {filteredConversations.length === 0 ? (
                    <div className="no-conversations">
                      <FaComments className="no-conversations-icon" />
                      <p>No conversations found</p>
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
                            src={conversation.participantAvatar || `https://ui-avatars.com/api/?name=${conversation.participantName}&background=random`}
                            alt={conversation.participantName}
                          />
                          {conversation.isOnline && <div className="online-indicator" />}
                        </div>
                        <div className="conversation-content">
                          <div className="conversation-header">
                            <h4 className="conversation-name">{conversation.participantName}</h4>
                            <span className="conversation-time">
                              {formatTimestamp(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                          <div className="conversation-preview">
                            <p className="conversation-message">
                              {conversation.lastMessage.senderId === 'current-user' ? 'You: ' : ''}
                              {conversation.lastMessage.content}
                            </p>
                            <div className="conversation-meta">
                              {conversation.lastMessage.attachments && (
                                <span className="attachment-indicator">📎</span>
                              )}
                              {conversation.lastMessage.senderId === 'current-user' ? (
                                conversation.lastMessage.isRead ? (
                                  <FaCheckDouble className="read-indicator" />
                                ) : (
                                  <FaCheck className="delivered-indicator" />
                                )
                              ) : conversation.unreadCount > 0 && (
                                <span className="unread-count">{conversation.unreadCount}</span>
                              )}
                            </div>
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
                    <button className="action-btn" title="More options" aria-label="More options">
                      <FaEllipsisV />
                    </button>
                  </div>
                </div>

                <div className="messages-container">
                  <div className="messages-list">
                    {/* Mock messages for the selected conversation */}
                    <div className="message-item received">
                      <div className="message-avatar">
                        <img
                          src={selectedConversation.participantAvatar || `https://ui-avatars.com/api/?name=${selectedConversation.participantName}&background=random`}
                          alt={selectedConversation.participantName}
                        />
                      </div>
                      <div className="message-content">
                        <div className="message-bubble">
                          <p>{selectedConversation.lastMessage.content}</p>
                          <span className="message-time">
                            {formatTimestamp(selectedConversation.lastMessage.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="message-item sent">
                      <div className="message-content">
                        <div className="message-bubble">
                          <p>Thanks for the message! I'll get back to you soon.</p>
                          <span className="message-time">
                            {formatTimestamp(new Date().toISOString())}
                          </span>
                        </div>
                      </div>
                      <div className="message-avatar">
                        <img
                          src="https://ui-avatars.com/api/?name=You&background=random"
                          alt="You"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="message-input">
                  <div className="input-container">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button 
                      className="send-btn"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
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
    </BannerWrapper>
  );
};

export default MessagingWidget;
