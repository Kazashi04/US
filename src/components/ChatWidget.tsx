import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000';

export const ChatWidget: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Connect socket and fetch latest conversation when opened
  useEffect(() => {
    if (!user || !token || !isOpen) return;

    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    apiService.getConversations(token).then(data => {
      if (data && data.length > 0) {
        setActiveConv(data[0]); // Default to most recent conversation
      }
    }).catch(console.error);

    return () => {
      newSocket.close();
    };
  }, [user, token, isOpen]);

  useEffect(() => {
    if (!socket || !activeConv || !isOpen) return;
    
    socket.emit('join_conversation', activeConv.id);
    
    const handleReceiveMessage = (msg: any) => {
      if (msg.conversationId === activeConv.id) {
        setMessages(prev => [...prev, msg]);
        if (msg.senderId !== user?.id) {
          apiService.markMessagesAsRead(activeConv.id, token!).catch(console.error);
        }
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, activeConv, user, token, isOpen]);

  useEffect(() => {
    if (activeConv && token && isOpen) {
      apiService.getMessages(activeConv.id, token).then(data => {
        setMessages(data);
        setTimeout(scrollToBottom, 100);
      });
      apiService.markMessagesAsRead(activeConv.id, token).catch(console.error);
    }
  }, [activeConv, token, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text || !activeConv || !socket || !user) return;

    socket.emit('send_message', {
      conversationId: activeConv.id,
      senderId: user.id,
      text: text
    });
    
    setInputValue('');
  };

  if (!user) return null; // Don't show widget if not logged in

  const otherUser = activeConv ? (activeConv.participants?.find((p: any) => p.id !== user.id) || activeConv.participants?.[0]) : null;

  return (
    <>
      <button 
        id="chat-launcher" 
        className={`chat-launcher ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--teal-600)',
          color: 'white',
          border: 'none',
          boxShadow: 'var(--shadow-lg)',
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          zIndex: 999,
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        💬
      </button>

      <div className={`chat-widget ${isOpen ? 'active' : ''}`} id="chat-widget">
        <div className="chat-widget-header" style={{ cursor: otherUser ? 'pointer' : 'default' }} onClick={() => {
            if (otherUser) {
              setIsOpen(false);
              navigate(`/profile/${otherUser.id}`);
            }
          }}>
          <div className="chat-landlord-info">
            {otherUser && (
              <span className="chat-avatar" style={{ 
                width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', 
                backgroundColor: 'var(--teal-700)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0, fontSize: '1rem'
              }}>
                {otherUser.profileImage ? (
                  <img src={otherUser.profileImage} alt={otherUser.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (otherUser.fullName || 'U').charAt(0).toUpperCase()
                )}
              </span>
            )}
            <div>
              <h4 className="chat-name">{otherUser ? otherUser.fullName : 'Messages'}</h4>
              {otherUser && <span className="chat-status">Online</span>}
            </div>
          </div>
          <button className="chat-close" id="chat-close" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>&times;</button>
        </div>
        
        <div className="chat-messages" id="chat-messages">
          {!activeConv ? (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', flexDirection: 'column', gap: '12px' }}>
               <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>You have no active conversations.</p>
               <button onClick={() => { setIsOpen(false); navigate('/messages'); }} style={{ padding: '8px 16px', background: 'var(--teal-600)', color: 'white', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>View All Messages</button>
             </div>
          ) : (!Array.isArray(messages) || messages.length === 0) ? (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--gray-400)', fontStyle: 'italic', fontSize: '0.9rem' }}>There are no messages yet.</p>
             </div>
          ) : (
            (Array.isArray(messages) ? messages : []).map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.senderId === user.id ? 'sent' : 'received'}`}>
                {msg.text}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {activeConv && (
          <form className="chat-input-area" id="chat-input-form" onSubmit={handleSendMessage}>
            <input 
              type="text" 
              id="chat-input" 
              className="chat-input"
              placeholder="Type a message..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoComplete="off" 
            />
            <button type="submit" className="chat-send-btn" aria-label="Send message" disabled={!inputValue.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        )}
      </div>
    </>
  );
};
