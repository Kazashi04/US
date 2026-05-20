import React, { useState, useEffect } from 'react';
import type { Property } from '../types';
import { propertiesData } from '../data/properties';
import { apiService } from '../services/api';

interface PropertyDetailsProps {
  propertyId: string;
  onBack: () => void;
  onOpenLogin: () => void;
  onOpenMap: () => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({
  propertyId,
  onBack,
  onOpenLogin,
  onOpenMap,
}) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Attempt dynamic fetch from MongoDB
    apiService.getPropertyById(propertyId)
      .then(data => setProperty(data))
      .catch(() => {
        // Fallback to static mock data
        const local = propertiesData.find((p) => p.id === propertyId) || propertiesData[0];
        setProperty(local);
      });
  }, [propertyId]);

  const handleAccordionToggle = (item: string) => {
    setActiveAccordion((prev) => (prev === item ? null : item));
  };

  if (!property) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--gray-500)' }}>
        <p>Loading stay details...</p>
      </div>
    );
  }

  return (
    <main className="details-container">
      <div className="section-container" style={{ paddingTop: '24px', paddingBottom: '12px' }}>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--teal-600)',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 0',
          }}
        >
          ← Back to Search
        </button>
      </div>

      <section className="gallery-section">
        <div className="gallery-grid">
          <div className="main-image" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
            {property.images && property.images.length > 0 ? (
              <img 
                src={property.images[0]} 
                alt={property.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div className="card-image-placeholder" style={{ height: '100%', minHeight: '350px' }}>
                <span className="placeholder-text">{property.title}</span>
              </div>
            )}
            <button className="nav-arrow prev" onClick={(e) => e.preventDefault()}>‹</button>
            <button className="nav-arrow next" onClick={(e) => e.preventDefault()}>›</button>
          </div>
          <div className="side-images">
            {[1, 2, 3, 4].map((i) => {
              const imgUrl = property.images && property.images[i];
              return (
                <div key={i} className="side-image" style={{ overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                  {imgUrl ? (
                    <img 
                      src={imgUrl} 
                      alt={`Room View ${i}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div className="card-image-placeholder" style={{ height: '100%' }}>
                      <span className="placeholder-text" style={{ fontSize: '0.8rem' }}>Room View {i}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="info-header">
          <div className="title-area">
            <h1 className="property-title">{property.title}</h1>
            <p className="property-address">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {property.location}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div className="card-price" style={{ margin: 0 }}>
              <span className="price-amount" style={{ fontSize: '1.8rem' }}>₱{property.price.toLocaleString()}</span>
              <span className="price-period">/{property.period}</span>
            </div>
            <button className="btn-book" onClick={onOpenLogin}>Request to Book</button>
          </div>
        </div>

        <div className="info-grid">
          <div className="features-area">
            <h2 className="section-label">Property Features</h2>
            <div className="accordion">
              <div className={`accordion-item ${activeAccordion === 'wifi' ? 'active' : ''}`}>
                <button className="accordion-header" onClick={() => handleAccordionToggle('wifi')}>
                  <span>📶 WiFi</span>
                  <span className="arrow">⌄</span>
                </button>
                <div className="accordion-content">
                  <p>High-speed fiber internet included in the rent.</p>
                </div>
              </div>
              
              <div className={`accordion-item ${activeAccordion === 'bed' ? 'active' : ''}`}>
                <button className="accordion-header" onClick={() => handleAccordionToggle('bed')}>
                  <span>🛏️ Bed Space</span>
                  <span className="arrow">⌄</span>
                </button>
                <div className="accordion-content">
                  <p>Comfortable single bed space with provided mattress and study lamp.</p>
                </div>
              </div>
              
              <div className={`accordion-item ${activeAccordion === 'study' ? 'active' : ''}`}>
                <button className="accordion-header" onClick={() => handleAccordionToggle('study')}>
                  <span>📖 Study Desk</span>
                  <span className="arrow">⌄</span>
                </button>
                <div className="accordion-content">
                  <p>Dedicated desk and chair for focused study sessions.</p>
                </div>
              </div>
              
              <div className={`accordion-item ${activeAccordion === 'kitchen' ? 'active' : ''}`}>
                <button className="accordion-header" onClick={() => handleAccordionToggle('kitchen')}>
                  <span>🍳 Shared Kitchen</span>
                  <span className="arrow">⌄</span>
                </button>
                <div className="accordion-content">
                  <p>Access to a fully equipped kitchen with stove, refrigerator, and cabinet space.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="map-area">
            <div className="map-placeholder" onClick={onOpenMap} style={{ cursor: 'pointer' }}>
              <div className="map-content">
                <div className="map-pin university">📍 Nearest Campus</div>
                <div className="map-pin property">📍 {property.title}</div>
              </div>
              <button className="map-expand">⛶</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
