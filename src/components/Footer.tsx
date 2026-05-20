import React from 'react';

interface FooterProps {
  onNavigate: (page: 'home' | 'details' | 'hub') => void;
  onSearchArea: (area: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSearchArea }) => {
  const handleAreaClick = (e: React.MouseEvent, area: string) => {
    e.preventDefault();
    onNavigate('home');
    onSearchArea(area);
    setTimeout(() => {
      const propGrid = document.getElementById('properties');
      if (propGrid) propGrid.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <footer className="footer" id="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <a 
            href="#" 
            className="footer-logo"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="logo-text">Uni<span className="logo-accent">Stay</span></span>
          </a>
          <p className="footer-description">
            Helping students find safe, affordable, and comfortable boarding houses in General
            Santos City since 2026.
          </p>
        </div>
        <div className="footer-links-group">
          <h4>Explore</h4>
          <a 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
              setTimeout(() => {
                const el = document.getElementById('properties');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          >
            Browse Listings
          </a>
          <a 
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
              setTimeout(() => {
                const el = document.getElementById('list-property');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          >
            List a Property
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>About Us</a>
        </div>
        <div className="footer-links-group">
          <h4>Barangays</h4>
          {['Lagao', 'Calumpang', 'Dadiangas', 'City Heights'].map((area) => (
            <a 
              key={area} 
              href="#" 
              onClick={(e) => handleAreaClick(e, area)}
            >
              {area}
            </a>
          ))}
        </div>
        <div className="footer-links-group">
          <h4>Support</h4>
          <a href="#" onClick={(e) => e.preventDefault()}>Help Center</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Contact Us</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 UniStay GenSan. All rights reserved.</p>
      </div>
    </footer>
  );
};
