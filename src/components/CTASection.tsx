import React from 'react';

interface CTASectionProps {
  onNavigateToHub: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onNavigateToHub }) => {
  return (
    <section className="cta-section" id="list-property">
      <div className="cta-container">
        <div className="cta-content">
          <p className="cta-eyebrow">For Property Owners</p>
          <h2 className="cta-title">Have a Boarding House?</h2>
          <p className="cta-subtitle">
            List your property on UniStay and connect with thousands of guests looking for a place
            to stay in General Santos City.
          </p>
          <button className="cta-btn" id="cta-list-btn" onClick={onNavigateToHub}>
            List Your Property →
          </button>
        </div>
        <div className="cta-visual">
          <div className="cta-stat-card">
            <span className="cta-stat-number">1,200+</span>
            <span className="cta-stat-label">Guests Searching</span>
          </div>
          <div className="cta-stat-card">
            <span className="cta-stat-number">85+</span>
            <span className="cta-stat-label">Listed Properties</span>
          </div>
          <div className="cta-stat-card">
            <span className="cta-stat-number">98%</span>
            <span className="cta-stat-label">Satisfaction Rate</span>
          </div>
        </div>
      </div>
    </section>
  );
};
