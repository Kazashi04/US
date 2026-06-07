import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col brand-col">
          <div className="footer-logo">
            <img src="/logo.png" alt="UniStay Logo" style={{ width: '52px', height: '52px', objectFit: 'contain', transform: 'translateY(-2px)' }} />
            <span className="logo-text" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f766e' }}>UniStay</span>
          </div>
          <p className="brand-desc">
            Connecting students with premium boarding houses in General Santos City.
          </p>
        </div>
        
        <div className="footer-col">
          <h4 className="footer-heading">COMPANY</h4>
          <ul className="footer-links">
            <li><a href="#">About Us</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h4 className="footer-heading">LEGAL</h4>
          <ul className="footer-links">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
        
        <div className="footer-col">
          <h4 className="footer-heading">FOLLOW US</h4>
          <div className="social-links">
            <a href="#" className="social-link" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 UniStay. Connecting students with premium boarding houses.</p>
      </div>
    </footer>
  );
};
