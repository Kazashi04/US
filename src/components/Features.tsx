import React from 'react';

interface FeaturesProps {
  onSearch: (query: string) => void;
  onToggleVerified: () => void;
  onOpenMap: () => void;
  onOpenChat: () => void;
}

export const Features: React.FC<FeaturesProps> = ({
  onSearch,
  onToggleVerified,
  onOpenMap,
  onOpenChat
}) => {
  return (
    <section className="features-section" id="features">
      <div className="section-container">
        <div className="features-header">
          <h2 className="features-title-badge">Key Features</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card" id="feat-search" onClick={() => onSearch('')}>
            <div className="feature-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3 className="feature-title">Easy Search</h3>
            <p className="feature-desc">Search by location, price, amenities, and more</p>
            <span className="feature-action">Try Search →</span>
          </div>

          <div className="feature-card" id="feat-verified" onClick={onToggleVerified}>
            <div className="feature-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 11 11 13 15 9"></polyline>
              </svg>
            </div>
            <h3 className="feature-title">Verified Listings</h3>
            <p className="feature-desc">Only verified boarding houses and trusted landlords</p>
            <span className="feature-action">Filter Verified →</span>
          </div>

          <div className="feature-card" id="feat-map" onClick={onOpenMap}>
            <div className="feature-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h3 className="feature-title">Map & Distance</h3>
            <p className="feature-desc">Find places near your campus with our smart app</p>
            <span className="feature-action">View Map →</span>
          </div>

          <div className="feature-card" id="feat-chat" onClick={onOpenChat}>
            <div className="feature-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3 className="feature-title">Direct Messaging</h3>
            <p className="feature-desc">Chat directly with landlords inside the app</p>
            <span className="feature-action">Open Chat →</span>
          </div>

          <div className="feature-card" id="feat-friendly">
            <div className="feature-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" strokeLinecap="round"
                strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                <line x1="12" y1="18" x2="12.01" y2="18"></line>
              </svg>
            </div>
            <h3 className="feature-title">User-Friendly</h3>
            <p className="feature-desc">Simple, clean, and easy to use for everyone</p>
            <span className="feature-action">See Interface →</span>
          </div>
        </div>
      </div>
    </section>
  );
};
