import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

const COLORS = {
  teal50: '#f0fdfa',
  teal600: '#0d9488',
  teal700: '#0f766e',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray700: '#334155',
  gray900: '#0f172a',
};

const styles = {
  container: {
    display: 'flex',
    maxWidth: '1400px',
    margin: '100px auto 40px auto',
    height: 'calc(100vh - 140px)',
    backgroundColor: '#fff',
    borderRadius: '24px',
    boxShadow: 'var(--shadow-xl)',
    overflow: 'hidden',
    border: `1px solid ${COLORS.gray200}`
  },
  sidebar: {
    width: '350px',
    borderRight: `1px solid ${COLORS.gray200}`,
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#fff',
    zIndex: 10
  },
  sidebarHeader: {
    padding: '24px',
    borderBottom: `1px solid ${COLORS.gray100}`,
    background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.9))'
  },
  sidebarTitle: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: COLORS.gray900,
    margin: 0
  },
  convList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 0,
    margin: 0,
    listStyle: 'none'
  },
  convItem: {
    display: 'flex',
    padding: '16px 24px',
    borderBottom: `1px solid ${COLORS.gray100}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderLeft: '4px solid transparent'
  },
  convItemActive: {
    backgroundColor: COLORS.teal50,
    borderLeft: `4px solid ${COLORS.teal600}`
  },
  avatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--teal-500), var(--teal-700))',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 700,
    marginRight: '14px',
    flexShrink: 0,
    overflow: 'hidden',
    boxShadow: '0 4px 10px rgba(13, 148, 136, 0.2)'
  },
  convContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center'
  },
  convHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '6px'
  },
  convName: {
    fontWeight: 700,
    color: COLORS.gray900,
    fontSize: '1rem',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  convTime: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: COLORS.gray400
  },
  convPreview: {
    fontSize: '0.85rem',
    color: COLORS.gray500,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    margin: 0,
    lineHeight: 1.4
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: COLORS.gray50
  },
  chatHeader: {
    padding: '20px 32px',
    backgroundColor: '#fff',
    borderBottom: `1px solid ${COLORS.gray200}`,
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    zIndex: 5
  },
  messageList: {
    flex: 1,
    padding: '32px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  },
  messageRow: {
    display: 'flex',
    width: '100%'
  },
  messageRowMine: {
    justifyContent: 'flex-end'
  },
  messageRowTheirs: {
    justifyContent: 'flex-start'
  },
  messageBubbleMine: {
    background: 'linear-gradient(135deg, var(--teal-600), var(--teal-700))',
    color: '#fff',
    padding: '12px 20px',
    borderRadius: '20px',
    borderBottomRightRadius: '4px',
    maxWidth: '70%',
    wordBreak: 'break-word' as const,
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
    fontSize: '0.95rem',
    lineHeight: 1.5
  },
  messageBubbleTheirs: {
    backgroundColor: '#fff',
    color: COLORS.gray900,
    padding: '12px 20px',
    borderRadius: '20px',
    borderBottomLeftRadius: '4px',
    maxWidth: '70%',
    wordBreak: 'break-word' as const,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: `1px solid ${COLORS.gray100}`,
    fontSize: '0.95rem',
    lineHeight: 1.5
  },
  inputArea: {
    padding: '24px 32px',
    backgroundColor: '#fff',
    borderTop: `1px solid ${COLORS.gray200}`,
    zIndex: 5
  },
  inputForm: {
    display: 'flex',
    gap: '16px'
  },
  input: {
    flex: 1,
    padding: '16px 24px',
    borderRadius: '999px',
    border: `1px solid ${COLORS.gray300}`,
    backgroundColor: COLORS.gray50,
    outline: 'none',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
  },
  sendBtn: {
    background: 'linear-gradient(135deg, var(--teal-600), var(--teal-800))',
    color: '#fff',
    border: 'none',
    borderRadius: '999px',
    padding: '0 32px',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as const,
    color: COLORS.gray500,
    backgroundColor: COLORS.gray50
  }
};

export const Messages: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user || !token) {
      navigate('/');
      return;
    }
    
    // Connect socket
    const newSocket = io(API_BASE_URL);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    // Fetch conversations
    apiService.getConversations(token).then(data => {
      setConversations(data);
    });

    return () => {
      newSocket.close();
    };
  }, [user, token, navigate]);

  useEffect(() => {
    if (!socket || !activeConv) return;
    
    socket.emit('join_conversation', activeConv.id);
    
    const handleReceiveMessage = (msg: any) => {
      if (msg.conversationId === activeConv.id) {
        setMessages(prev => [...prev, msg]);
        // Update last message in conversation list
        setConversations(prev => prev.map(c => 
          c.id === activeConv.id ? { ...c, lastMessage: msg.text, updatedAt: msg.createdAt } : c
        ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        
        // Mark read
        if (msg.senderId !== user?.id) {
          apiService.markMessagesAsRead(activeConv.id, token!).catch(console.error);
        }
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, activeConv, user, token]);

  useEffect(() => {
    if (activeConv && token) {
      apiService.getMessages(activeConv.id, token).then(data => {
        setMessages(data);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
      // Mark read
      apiService.markMessagesAsRead(activeConv.id, token).catch(console.error);
    }
  }, [activeConv, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv || !socket || !user) return;
    
    socket.emit('send_message', {
      conversationId: activeConv.id,
      senderId: user.id || (user as any)._id,
      text: inputText
    });
    
    setInputText('');
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  return (
    <div style={{
      ...styles.container,
      ...(isMobile ? {
        margin: '80px 10px 20px 10px',
        height: 'calc(100vh - 100px)',
        borderRadius: '16px',
      } : {})
    }}>
      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        ...(isMobile ? {
          width: '100%',
          display: activeConv ? 'none' : 'flex',
          borderRight: 'none'
        } : {})
      }}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Messages</h2>
        </div>
        <ul style={styles.convList}>
          {conversations.length === 0 && (
            <li style={{ padding: '20px', textAlign: 'center', color: COLORS.gray500 }}>No conversations yet.</li>
          )}
          {conversations.map(conv => {
            const otherUser = conv.participants?.find((p: any) => p.id !== user.id) || conv.participants?.[0];
            const isActive = activeConv?.id === conv.id;
            return (
              <li 
                key={conv.id} 
                style={{ ...styles.convItem, ...(isActive ? styles.convItemActive : {}) }}
                onClick={() => setActiveConv(conv)}
              >
                <div style={styles.avatar}>
                  {otherUser.profileImage ? (
                    <img src={otherUser.profileImage} alt={otherUser.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (otherUser.fullName || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div style={styles.convContent}>
                  <div style={styles.convHeader}>
                    <span style={styles.convName}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {otherUser.fullName}
                        {otherUser.subscriptionTier === 'premium' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0ea5e9" stroke="#white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 5.09 19.5 5.5 20.91 9.91 24 12 20.91 14.09 19.5 18.5 15.09 18.91 12 22 8.91 18.91 4.5 18.5 3.09 14.09 0 12 3.09 9.91 4.5 5.5 8.91 5.09 12 2"></polygon>
                            <polyline points="9 12 11 14 15 10" stroke="white" strokeWidth="3"></polyline>
                          </svg>
                        )}
                      </span>
                    </span>
                    <span style={styles.convTime}>{formatTime(conv.updatedAt)}</span>
                  </div>
                  <p style={{ ...styles.convPreview, color: isActive ? COLORS.gray700 : COLORS.gray500 }}>
                    {conv.lastMessage || `Inquiry for ${conv.propertyId?.title || 'Property'}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Chat Area */}
      {activeConv ? (
        <div style={{
          ...styles.chatArea,
          ...(isMobile ? { display: 'flex', width: '100%' } : {})
        }}>
          <div style={{ ...styles.chatHeader, padding: isMobile ? '16px 20px' : '20px 32px' }}>
            {isMobile && (
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveConv(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  marginRight: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.gray700
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            )}
            <div 
              style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${(activeConv.participants?.find((p: any) => p.id !== user.id) || activeConv.participants?.[0]).id}`)}
            >
              <div style={{ ...styles.avatar, width: isMobile ? '42px' : '52px', height: isMobile ? '42px' : '52px', fontSize: '1.1rem', marginRight: '12px' }}>
                {(activeConv.participants?.find((p: any) => p.id !== user.id) || activeConv.participants?.[0]).profileImage ? (
                <img src={(activeConv.participants?.find((p: any) => p.id !== user.id) || activeConv.participants?.[0]).profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                ((activeConv.participants?.find((p: any) => p.id !== user.id) || activeConv.participants?.[0]).fullName || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, color: COLORS.gray900, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {(activeConv.participants?.find((p: any) => p.id !== user.id) || activeConv.participants?.[0]).fullName}
                {(activeConv.participants?.find((p: any) => p.id !== user.id) || activeConv.participants?.[0]).subscriptionTier === 'premium' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0ea5e9" stroke="#white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 5.09 19.5 5.5 20.91 9.91 24 12 20.91 14.09 19.5 18.5 15.09 18.91 12 22 8.91 18.91 4.5 18.5 3.09 14.09 0 12 3.09 9.91 4.5 5.5 8.91 5.09 12 2"></polygon>
                    <polyline points="9 12 11 14 15 10" stroke="white" strokeWidth="3"></polyline>
                  </svg>
                )}
              </h3>
              <p style={{ margin: 0, color: COLORS.teal600, fontSize: '0.85rem', fontWeight: 500 }}>
                Regarding: {activeConv.propertyId?.title || 'Property'}
              </p>
            </div>
            </div>
          </div>
          
          <div style={{
            ...styles.messageList,
            padding: isMobile ? '16px' : '32px'
          }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: COLORS.gray400, fontStyle: 'italic' }}>There are no messages yet.</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMine = msg.senderId === user.id;
                return (
                  <div key={i} style={{ ...styles.messageRow, ...(isMine ? styles.messageRowMine : styles.messageRowTheirs) }}>
                    <div style={isMine ? styles.messageBubbleMine : styles.messageBubbleTheirs}>
                      {msg.text}
                      <div style={{ fontSize: '0.65rem', textAlign: isMine ? 'right' : 'left', marginTop: '4px', opacity: 0.7 }}>
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ ...styles.inputArea, padding: isMobile ? '16px' : '24px 32px' }}>
            <form onSubmit={handleSendMessage} style={styles.inputForm}>
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                style={{ ...styles.input, padding: isMobile ? '12px 16px' : '16px 24px' }}
              />
              <button type="submit" style={{ ...styles.sendBtn, padding: isMobile ? '0 20px' : '0 32px' }} disabled={!inputText.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ ...styles.emptyState, display: isMobile ? 'none' : 'flex' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={COLORS.gray300} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3 style={{ margin: 0, color: COLORS.gray400 }}>Select a conversation to start chatting</h3>
        </div>
      )}
    </div>
  );
};
