import React, { useState, useEffect } from 'react';

type Tab = 'students' | 'landlords';

interface ResourcesProps {
  onBackToHome: () => void;
}

export const Resources: React.FC<ResourcesProps> = ({ onBackToHome }) => {
  const [activeTab, setActiveTab] = useState<Tab>('students');
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleAccordion = (id: string) => {
    setActiveAccordion((prev) => (prev === id ? null : id));
  };

  return (
    <div className="details-page" style={{ minHeight: '100vh', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>
      {/* Background Animated Floaters */}
      <div className="saas-floater-1"></div>
      <div className="saas-floater-2"></div>
      
      <main className="details-container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ paddingTop: '100px', paddingBottom: '24px' }}>
          <button 
            onClick={onBackToHome}
            className="btn-back"
            style={{ marginBottom: '16px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </button>
        </div>

        <section className="saas-header">
          <span className="saas-eyebrow">Knowledge Base</span>
          <h1 className="saas-title">UniStay Resources</h1>
          <p className="saas-subtitle">
            Everything you need to know about renting or hosting in General Santos City. Clear, formal, and organized.
          </p>
        </section>

        {/* Segmented Control */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="saas-segmented-control">
            <button
              className={`saas-segmented-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              For Guests
            </button>
            <button
              className={`saas-segmented-btn ${activeTab === 'landlords' ? 'active' : ''}`}
              onClick={() => setActiveTab('landlords')}
            >
              For Landlords
            </button>
          </div>
        </div>

        <div>
          {activeTab === 'students' ? (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div className="saas-grid">
                
                <div className="saas-card">
                  <div className="saas-card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    </svg>
                  </div>
                  <h3 className="saas-card-title">Renter's Checklist</h3>
                  <p className="saas-card-desc">Essential items to review before signing a contract or moving into a new space.</p>
                  <ul className="saas-list">
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span><strong>Utilities:</strong> Verify if water and electricity are sub-metered or included.</span>
                    </li>
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span><strong>Security:</strong> Ensure gates and room doors have sturdy, reliable locks.</span>
                    </li>
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span><strong>Curfew Rules:</strong> Check if the schedule aligns with your lifestyle.</span>
                    </li>
                  </ul>
                </div>

                <div className="saas-card">
                  <div className="saas-card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <h3 className="saas-card-title">Neighborhoods</h3>
                  <p className="saas-card-desc">An overview of the most popular areas to reside in General Santos City.</p>
                  <ul className="saas-list">
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span><strong>Lagao:</strong> Excellent access to NDDU, STI, and local carenderias.</span>
                    </li>
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span><strong>Fatima/Uhaw:</strong> Quiet residential area near MSU.</span>
                    </li>
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span><strong>City Heights:</strong> Centralized location close to SM and Robinsons malls.</span>
                    </li>
                  </ul>
                </div>

              </div>

              <h2 className="section-label" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Frequently Asked Questions</h2>
              <div className="saas-accordion">
                <div className={`saas-accordion-item ${activeAccordion === 's1' ? 'active' : ''}`}>
                  <button className="saas-accordion-header" onClick={() => toggleAccordion('s1')}>
                    <span>Is it free to use UniStay?</span>
                    <svg style={{ transform: activeAccordion === 's1' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                  <div className="saas-accordion-content">
                    <div className="saas-accordion-body">
                      Yes. The platform is entirely free for guests searching for boarding houses and apartments.
                    </div>
                  </div>
                </div>
                <div className={`saas-accordion-item ${activeAccordion === 's2' ? 'active' : ''}`}>
                  <button className="saas-accordion-header" onClick={() => toggleAccordion('s2')}>
                    <span>How do I contact a landlord?</span>
                    <svg style={{ transform: activeAccordion === 's2' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                  <div className="saas-accordion-content">
                    <div className="saas-accordion-body">
                      Select "Book Now" on any property listing page. Once registered and logged in, you can view the landlord's contact details or send a direct message.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div className="saas-grid">
                
                <div className="saas-card">
                  <div className="saas-card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <h3 className="saas-card-title">Verification Process</h3>
                  <p className="saas-card-desc">Verified listings receive up to 3x more views and bookings on our platform.</p>
                  <ul className="saas-list">
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Upload clear, high-resolution photos.</span>
                    </li>
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Provide a detailed description of the property.</span>
                    </li>
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span>Ensure your contact information is accurate. Our team reviews submissions within 24 hours.</span>
                    </li>
                  </ul>
                </div>

                <div className="saas-card">
                  <div className="saas-card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </div>
                  <h3 className="saas-card-title">Photography Tips</h3>
                  <p className="saas-card-desc">High-quality photos are the most crucial factor in securing bookings.</p>
                  <ul className="saas-list">
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span><strong>Lighting:</strong> Open curtains and utilize natural sunlight.</span>
                    </li>
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span><strong>Staging:</strong> Tidy the room and ensure floors are clean.</span>
                    </li>
                    <li className="saas-list-item">
                      <svg className="saas-list-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      <span><strong>Angles:</strong> Shoot from the corners to maximize space visibility.</span>
                    </li>
                  </ul>
                </div>

              </div>

              <h2 className="section-label" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Frequently Asked Questions</h2>
              <div className="saas-accordion">
                <div className={`saas-accordion-item ${activeAccordion === 'l1' ? 'active' : ''}`}>
                  <button className="saas-accordion-header" onClick={() => toggleAccordion('l1')}>
                    <span>What are the listing fees?</span>
                    <svg style={{ transform: activeAccordion === 'l1' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                  <div className="saas-accordion-content">
                    <div className="saas-accordion-body">
                      During our beta period, listing your property on UniStay is completely free of charge.
                    </div>
                  </div>
                </div>
                <div className={`saas-accordion-item ${activeAccordion === 'l2' ? 'active' : ''}`}>
                  <button className="saas-accordion-header" onClick={() => toggleAccordion('l2')}>
                    <span>Why was my listing rejected?</span>
                    <svg style={{ transform: activeAccordion === 'l2' ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                  <div className="saas-accordion-content">
                    <div className="saas-accordion-body">
                      Rejections typically occur due to insufficient photo quality, incomplete descriptions, or missing contact details. Please refer to your "My Hub" dashboard for specific administrator feedback.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
};
