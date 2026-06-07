import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

const COLORS = {
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
    marginTop: '72px',
    height: 'calc(100vh - 72px)',
    backgroundColor: '#fff',
    overflow: 'hidden'
  },
  sidebar: {
    width: '320px',
    borderRight: `1px solid ${COLORS.gray200}`,
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: COLORS.gray50
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: `1px solid ${COLORS.gray200}`,
    backgroundColor: '#fff'
  },
  sidebarTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
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
    padding: '16px',
    borderBottom: `1px solid ${COLORS.gray200}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  convItemActive: {
    backgroundColor: '#e6f4f1'
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: COLORS.teal600,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 600,
    marginRight: '12px',
    flexShrink: 0,
    overflow: 'hidden',
    border: '2px solid var(--teal-100)'
  },
  convContent: {
    flex: 1,
    minWidth: 0
  },
  convHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '4px'
  },
  convName: {
    fontWeight: 600,
    color: COLORS.gray900,
    fontSize: '0.95rem',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  convTime: {
    fontSize: '0.75rem',
    color: COLORS.gray500
  },
  convPreview: {
    fontSize: '0.85rem',
    color: COLORS.gray500,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    margin: 0
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#fff'
  },
  chatHeader: {
    padding: '20px',
    borderBottom: `1px solid ${COLORS.gray200}`,
    display: 'flex',
    alignItems: 'center'
  },
  messageList: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
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
    backgroundColor: COLORS.teal600,
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '16px',
    borderBottomRightRadius: '4px',
    maxWidth: '70%',
    wordBreak: 'break-word' as const
  },
  messageBubbleTheirs: {
    backgroundColor: COLORS.gray100,
    color: COLORS.gray900,
    padding: '10px 16px',
    borderRadius: '16px',
    borderBottomLeftRadius: '4px',
    maxWidth: '70%',
    wordBreak: 'break-word' as const
  },
  inputArea: {
    padding: '20px',
    borderTop: `1px solid ${COLORS.gray200}`,
    backgroundColor: '#fff'
  },
  inputForm: {
    display: 'flex',
    gap: '12px'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '24px',
    border: `1px solid ${COLORS.gray300}`,
    outline: 'none',
    fontSize: '0.95rem'
  },
  sendBtn: {
    backgroundColor: COLORS.teal600,
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    padding: '0 24px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
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
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
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
        <div style={styles.chatArea}>
          <div style={{ ...styles.chatHeader, cursor: 'pointer' }} onClick={() => navigate(`/profile/${(activeConv.participants?.find((p: any) => p.id !== user.id) || activeConv.participants?.[0]).id}`)}>
            <div style={styles.avatar}>
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
          
          <div style={styles.messageList}>
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

          <div style={styles.inputArea}>
            <form onSubmit={handleSendMessage} style={styles.inputForm}>
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                style={styles.input}
              />
              <button type="submit" style={styles.sendBtn} disabled={!inputText.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={COLORS.gray300} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3 style={{ margin: 0, color: COLORS.gray400 }}>Select a conversation to start chatting</h3>
        </div>
      )}
    </div>
  );
};
