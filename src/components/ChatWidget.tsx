import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: "Hello! I'm Maria, the landlord of Casa Verde Residences. How can I help you today?",
      sender: 'received',
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (text === '') return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'sent',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    setTimeout(() => {
      const landlordResponses = [
        "Yes, Casa Verde Residences is available! Single rooms start at ₱3,500/month. Would you like to schedule a viewing?",
        "Mindanao State University is only a 5-minute walk from there! Super convenient.",
        "Sure! Water and electricity are sub-metered. Wi-Fi is completely free of charge.",
        "We require 1 month advance and 1 month deposit. Let me know if you would like to reserve a spot!"
      ];

      let responseText = landlordResponses[Math.floor(Math.random() * landlordResponses.length)];
      const query = text.toLowerCase();

      if (query.includes('avail') || query.includes('vacant') || query.includes('room') || query.includes('space')) {
        responseText = landlordResponses[0];
      } else if (query.includes('msu') || query.includes('university') || query.includes('far') || query.includes('walk') || query.includes('nddu')) {
        responseText = landlordResponses[1];
      } else if (query.includes('wifi') || query.includes('internet') || query.includes('util') || query.includes('bill') || query.includes('water') || query.includes('light')) {
        responseText = landlordResponses[2];
      } else if (query.includes('price') || query.includes('reserve') || query.includes('deposit') || query.includes('rent') || query.includes('how much')) {
        responseText = landlordResponses[3];
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'received',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <>
      <button 
        id="chat-launcher" 
        className={`chat-launcher ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open chat with Maria"
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
          transition: 'var(--transition)'
        }}
      >
        💬
      </button>

      <div className={`chat-widget ${isOpen ? 'active' : ''}`} id="chat-widget">
        <div className="chat-widget-header">
          <div className="chat-landlord-info">
            <span className="chat-avatar">👩‍💼</span>
            <div>
              <h4 className="chat-name">Landlord Maria</h4>
              <span className="chat-status">Online</span>
            </div>
          </div>
          <button className="chat-close" id="chat-close" onClick={() => setIsOpen(false)}>&times;</button>
        </div>
        <div className="chat-messages" id="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input-area" id="chat-input-form" onSubmit={handleSendMessage}>
          <input 
            type="text" 
            id="chat-input" 
            placeholder="Ask about availability, rules..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoComplete="off" 
          />
          <button type="submit" className="chat-send-btn" aria-label="Send message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </>
  );
};
