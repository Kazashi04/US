import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onNavigate: (page: 'home' | 'details' | 'hub') => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  currentPage: 'home' | 'details' | 'hub';
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenLogin, onOpenSignup, currentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (page: 'home' | 'details' | 'hub', sectionId?: string) => {
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
          {user?.userType === 'landlord' && (
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
          <li>
            <a 
              href="#" 
              className="nav-link"
              onClick={(e) => e.preventDefault()}
            >
              Resources <span style={{ fontSize: '0.7rem' }}>⌄</span>
            </a>
          </li>
          {user ? (
            <>
              <li>
                <div style={{ paddingLeft: '12px', paddingRight: '12px', color: '#666', fontSize: '14px' }}>
                  👤 {user.fullName}
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
