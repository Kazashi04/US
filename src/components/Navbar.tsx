import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onNavigate: (page: 'home' | 'details' | 'hub' | 'resources' | 'messages') => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  currentPage: 'home' | 'details' | 'hub' | 'resources' | 'messages';
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenLogin, onOpenSignup, currentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, token, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user && token) {
      let interval: any;
      import('../services/api').then(({ apiService }) => {
        const fetchUnread = () => {
          apiService.getUnreadCount(token).then(data => {
            setUnreadCount(data.unreadCount);
          }).catch(console.error);
        };
        fetchUnread();
        // Poll every 10 seconds for simplicity instead of putting socket in navbar
        interval = setInterval(fetchUnread, 10000);
      });
      return () => { if (interval) clearInterval(interval); };
    }
  }, [user, token]);

  const handleLinkClick = (page: 'home' | 'details' | 'hub' | 'resources' | 'messages', sectionId?: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);

    if (sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`} id="navbar">
      <div className="nav-container">
        <a 
          href="#" 
          className="nav-logo" 
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home');
          }}
        >
          <span className="logo-text">Uni<span className="logo-accent">Stay</span></span>
        </a>

        <button 
          className={`nav-toggle ${isMobileMenuOpen ? 'active' : ''}`} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span><span></span><span></span>
        </button>

        <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="nav-links">
          <li>
            <a 
              href="#" 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('home', 'properties');
              }}
            >
              Find a Stay
            </a>
          </li>
          {(user?.userType === 'landlord' || user?.userType === 'student') && (
            <li>
              <a 
                href="#" 
                className={`nav-link ${currentPage === 'hub' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick('hub');
                }}
              >
                My Hub
              </a>
            </li>
          )}
          {user?.userType === 'admin' && (
            <li>
              <a 
                href="#" 
                className={`nav-link ${currentPage === 'hub' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick('hub');
                }}
              >
                Admin Hub
              </a>
            </li>
          )}
          <li>
            <a 
              href="#" 
              className={`nav-link ${currentPage === 'resources' ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('resources');
              }}
            >
              Resources
            </a>
          </li>
          {user ? (
            <>
              <li>
                <a 
                  href="#" 
                  className={`nav-link ${currentPage === 'messages' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('messages');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Messages
                  {unreadCount > 0 && (
                    <span style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      marginLeft: '4px'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </a>
              </li>
              <li>
                <div style={{ paddingLeft: '12px', paddingRight: '12px', color: '#666', fontSize: '14px' }}>
                   {user.fullName}
                </div>
              </li>
              <li>
                <a 
                  href="#" 
                  className="nav-link nav-link--login"
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                    setIsMobileMenuOpen(false);
                    onNavigate('home');
                  }}
                >
                  Log Out
                </a>
              </li>
            </>
          ) : (
            <>
              <li>
                <a 
                  href="#" 
                  className="nav-link" 
                  id="nav-login"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLogin();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Log in
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="nav-link nav-link--login"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenSignup();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};
