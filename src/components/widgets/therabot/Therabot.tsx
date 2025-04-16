import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import './Therabot.css';
import { getAuth } from 'firebase/auth';

const THERABOT_API_URL = import.meta.env.VITE_THERABOT_API_URL;

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const Therabot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeSession();
    }
  }, [isOpen]);

  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.getIdToken();
  };

  const initializeSession = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${THERABOT_API_URL}/chat/initialize-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to initialize chat session');
      }

      const data = await response.json();
      setSessionId(data.sessionId);

      // Add welcome message
      const welcomeMessage: Message = {
        text: "Hello! I'm Therabot, your AI companion. How can I help you today?",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setSessionId(null);
      setMessages([]);
    }, 300);
  };

  const sendMessageToServer = async (message: string) => {
    try {
      setIsLoading(true);
      const token = await getAuthToken();
      
      const response = await fetch(`${THERABOT_API_URL}/chat/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          Body: message,
          From: 'web-client',
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Therabot');
      }

      const data = await response.json();
      return data.reply;
    } catch (error) {
      console.error('Error communicating with Therabot:', error);
      return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading || !sessionId) return;

    const userMessage: Message = {
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    try {
      const botResponse = await sendMessageToServer(inputMessage);
      
      const botMessage: Message = {
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: Message = {
        text: "I'm sorry, something went wrong. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <>
      <button
        className="therabot-toggle-button"
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <FaRobot size={24} />
      </button>

      {isOpen && (
        <div 
          ref={containerRef}
          className={`therabot-container ${isClosing ? 'closing' : ''}`}
        >
          <div className="therabot-header">
            <h3>Therabot Assistant</h3>
            <button
              className="therabot-close-button"
              onClick={handleClose}
              aria-label="Close chat"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="therabot-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`therabot-message ${message.sender}`}
              >
                <p>{message.text}</p>
                <span className="therabot-message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="therabot-message bot loading">
                <p>Thinking...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="therabot-input-form">
            <input
              type="text"
              className="therabot-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              aria-label="Message input"
              disabled={isLoading || !sessionId}
            />
            <button
              type="submit"
              className="therabot-send-button"
              disabled={!inputMessage.trim() || isLoading || !sessionId}
              aria-label="Send message"
            >
              <FaPaperPlane size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Therabot;
