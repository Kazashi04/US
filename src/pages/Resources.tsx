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
    <div className="details-page" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <main className="details-container">
        <div className="section-container" style={{ paddingTop: '24px', paddingBottom: '24px' }}>
          <button 
            onClick={onBackToHome}
            className="btn-back"
            style={{ marginBottom: '16px', alignSelf: 'flex-start' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Home
          </button>
        </div>

        <section className="section-header" style={{ marginBottom: '40px' }}>
          <p className="section-eyebrow">Knowledge Base</p>
          <h1 className="section-title">UniStay Resources</h1>
          <p className="section-subtitle">
            Everything you need to know about renting or hosting in General Santos City.
          </p>
        </section>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <div style={{ 
            display: 'inline-flex', background: 'var(--white)', padding: '6px', 
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', gap: '8px' 
          }}>
            <button
              onClick={() => setActiveTab('students')}
              style={{
                padding: '12px 32px', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: '600',
                background: activeTab === 'students' ? 'var(--teal-600)' : 'transparent',
                color: activeTab === 'students' ? 'var(--white)' : 'var(--gray-600)',
                transition: 'var(--transition)'
              }}
            >
               For Guests
            </button>
            <button
              onClick={() => setActiveTab('landlords')}
              style={{
                padding: '12px 32px', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: '600',
                background: activeTab === 'landlords' ? 'var(--teal-600)' : 'transparent',
                color: activeTab === 'landlords' ? 'var(--white)' : 'var(--gray-600)',
                transition: 'var(--transition)'
              }}
            >
               For Landlords
            </button>
          </div>
        </div>

        <div className="info-grid">
          {activeTab === 'students' ? (
            <div className="features-area" style={{ gridColumn: '1 / -1', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <h2 className="section-label">Guest Success Guide</h2>
              
              <div style={{ marginBottom: '32px', background: 'var(--white)', padding: '32px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--gray-100)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--teal-50)', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--gray-900)', margin: 0, fontWeight: 700 }}>First-Time Renter's Checklist</h3>
                </div>
                <ul className="tips-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px' }}><strong style={{ color: 'var(--teal-700)' }}>Water & Electricity:</strong> Always ask if utilities are included in the rent or sub-metered.</li>
                  <li style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px' }}><strong style={{ color: 'var(--teal-700)' }}>Security:</strong> Check if the boarding house has a secure gate, locks on the room doors, and clear fire exits.</li>
                  <li style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px' }}><strong style={{ color: 'var(--teal-700)' }}>Curfew:</strong> Many dorms in GenSan have curfews (usually 10 PM). Make sure this aligns with your study or part-time job schedule.</li>
                </ul>
              </div>

              <div style={{ marginBottom: '32px', background: 'var(--white)', padding: '32px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--gray-100)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--teal-50)', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--gray-900)', margin: 0, fontWeight: 700 }}>Neighborhoods Overview</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px' }}>
                    <strong style={{ color: 'var(--teal-700)', fontSize: '1.05rem', display: 'block', marginBottom: '6px' }}>Lagao</strong>
                    <p style={{ margin: 0, color: 'var(--gray-600)' }}>Very close to Notre Dame of Dadiangas University (NDDU) and STI. Great access to carenderias and laundry shops.</p>
                  </div>
                  <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px' }}>
                    <strong style={{ color: 'var(--teal-700)', fontSize: '1.05rem', display: 'block', marginBottom: '6px' }}>Fatima/Uhaw</strong>
                    <p style={{ margin: 0, color: 'var(--gray-600)' }}>The best spot if you attend Mindanao State University (MSU). It's generally quieter but has everything a guest needs.</p>
                  </div>
                  <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px' }}>
                    <strong style={{ color: 'var(--teal-700)', fontSize: '1.05rem', display: 'block', marginBottom: '6px' }}>City Heights</strong>
                    <p style={{ margin: 0, color: 'var(--gray-600)' }}>Central, peaceful, and accessible to malls like SM and Robinsons. Good for visitors who want a balance of city life and quiet time.</p>
                  </div>
                </div>
              </div>

              <h2 className="section-label" style={{ marginTop: '48px' }}>Common Questions (Guests)</h2>
              <div className="accordion">
                <div className={`accordion-item ${activeAccordion === 's1' ? 'active' : ''}`}>
                  <button className="accordion-header" onClick={() => toggleAccordion('s1')}>
                    <span>Is it free to use UniStay?</span>
                  </button>
                  <div className="accordion-content">
                    <p>Yes! UniStay is 100% free for guests searching for boarding houses.</p>
                  </div>
                </div>
                <div className={`accordion-item ${activeAccordion === 's2' ? 'active' : ''}`}>
                  <button className="accordion-header" onClick={() => toggleAccordion('s2')}>
                    <span>How do I contact a landlord?</span>
                  </button>
                  <div className="accordion-content">
                    <p>Click "Request to Book" on any property details page. You will need to create an account first. Once logged in, you can see the landlord's contact details or use the chat widget.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="features-area" style={{ gridColumn: '1 / -1', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <h2 className="section-label">Landlord Toolkit</h2>
              
              <div style={{ marginBottom: '32px', background: 'linear-gradient(135deg, var(--teal-50) 0%, var(--teal-100) 100%)', padding: '32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--teal-200)', transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: 'var(--shadow-md)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--white)', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--teal-900)', margin: 0, fontWeight: 700 }}>How to get "Verified"</h3>
                </div>
                <p style={{ color: 'var(--teal-900)', fontSize: '1rem', lineHeight: '1.7', background: 'rgba(255,255,255,0.5)', padding: '20px', borderRadius: '12px', margin: 0 }}>
                  <strong style={{ color: 'var(--teal-800)' }}>Verified listings get 3x more bookings!</strong><br/><br/>
                  To get verified, ensure you upload clear photos, a complete description, and provide your valid contact information. Our admin team reviews listings within 24 hours.
                </p>
              </div>

              <div style={{ marginBottom: '32px', background: 'var(--white)', padding: '32px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--gray-100)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--teal-50)', color: 'var(--teal-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--gray-900)', margin: 0, fontWeight: 700 }}>Photography Tips</h3>
                </div>
                <ul className="tips-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <li style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px' }}><strong style={{ color: 'var(--teal-700)' }}>Use Natural Light:</strong> Open all curtains and windows. Take photos during the morning or early afternoon.</li>
                  <li style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px' }}><strong style={{ color: 'var(--teal-700)' }}>Clean Up:</strong> Ensure the room is tidy, beds are made, and floors are clean before taking photos.</li>
                  <li style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '8px' }}><strong style={{ color: 'var(--teal-700)' }}>Shoot Wide:</strong> Stand in the corner of the room to capture as much of the space as possible.</li>
                </ul>
              </div>

              <h2 className="section-label" style={{ marginTop: '48px' }}>Common Questions (Landlords)</h2>
              <div className="accordion">
                <div className={`accordion-item ${activeAccordion === 'l1' ? 'active' : ''}`}>
                  <button className="accordion-header" onClick={() => toggleAccordion('l1')}>
                    <span>How much does it cost to list?</span>
                  </button>
                  <div className="accordion-content">
                    <p>Listing a property on UniStay is currently free for all landlords in General Santos City during our beta period.</p>
                  </div>
                </div>
                <div className={`accordion-item ${activeAccordion === 'l2' ? 'active' : ''}`}>
                  <button className="accordion-header" onClick={() => toggleAccordion('l2')}>
                    <span>Why was my listing rejected?</span>
                  </button>
                  <div className="accordion-content">
                    <p>Listings are usually rejected due to blurry photos, inappropriate language, or missing contact information. Check your "My Hub" page for specific feedback from the admin.</p>
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
