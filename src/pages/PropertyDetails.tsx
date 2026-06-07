import React, { useState, useEffect } from 'react';
import type { Property } from '../types';
import { propertiesData } from '../data/properties';
import { apiService } from '../services/api';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookingModal } from '../components/BookingModal';
import toast from 'react-hot-toast';

// Fix for default Leaflet markers
 
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
  const { id: urlId } = useParams<{ id: string }>();
  const activePropertyId = urlId || propertyId;
  const [property, setProperty] = useState<Property | null>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const navigate = useNavigate();
  const { user, token } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Attempt dynamic fetch from MongoDB
    apiService.getPropertyById(activePropertyId)
      .then(data => setProperty(data))
      .catch(() => {
        // Fallback to static mock data
        const local = propertiesData.find((p) => p.id === activePropertyId);
        setProperty(local || null);
      });
  }, [activePropertyId]);



  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (property?.images && property.images.length > 0) {
      setActiveImageIndex((prev) => (prev === 0 ? property.images!.length - 1 : prev - 1));
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (property?.images && property.images.length > 0) {
      setActiveImageIndex((prev) => (prev === property.images!.length - 1 ? 0 : prev + 1));
    }
  };

  const handleMessageLandlord = async () => {
    const landlordIdStr = typeof property?.landlordId === 'object' && property.landlordId !== null ? property.landlordId.id : property?.landlordId;
    if (!user || !token) {
      onOpenLogin();
      return;
    }
    if (user.id === landlordIdStr) {
      toast.error("You cannot message yourself.");
      return;
    }
    setIsStartingChat(true);
    try {
      await apiService.startConversation(property!.id, landlordIdStr as string, token);
      navigate('/messages');
    } catch {
      toast.error("Could not start conversation. Please try again.");
    } finally {
      setIsStartingChat(false);
    }
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
          className="btn-back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Search
        </button>
      </div>

      <section className="property-hero-grid">
        <div className="hero-left-column">
          <div className="premium-badge-pill">
            <div className="dot"></div>
            {property.isVerified ? 'VERIFIED PROPERTY' : 'PREMIUM BOARDING HOUSE'}
          </div>
          
          <h1 className="hero-title-main">
            {property.title.split(' ')[0]} <span>{property.title.substring(property.title.indexOf(' ') + 1)}</span>
          </h1>

          <p className="property-hero-subtitle">
            <strong style={{ color: 'var(--teal-700)' }}>{property.location}</strong> • Advanced housing intelligence. Real-time availability, spatial analytics, and seamless booking for the modern academic lifestyle.
          </p>

          <div className="premium-action-bar">
            <div 
              className="action-input-group" 
              onClick={() => onOpenMap()}
            >
              <div className="icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div>
                <div className="text">View on Map</div>
                <div className="subtext">Check campus distance</div>
              </div>
            </div>

            <div className="action-input-group" onClick={handleMessageLandlord} style={{ opacity: isStartingChat ? 0.7 : 1 }}>
              <div className="icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <div>
                <div className="text">{isStartingChat ? 'Loading...' : 'Message Landlord'}</div>
                <div className="subtext">Available to chat</div>
              </div>
            </div>

            <button 
              className="btn-analyze" 
              onClick={() => {
                const landlordIdStr = typeof property?.landlordId === 'object' && property.landlordId !== null ? property.landlordId.id : property?.landlordId;
                if (!user) {
                  onOpenLogin();
                } else if (user.userType === 'landlord' && user.id === landlordIdStr) {
                  toast.error("You cannot book your own property.");
                } else {
                  setIsBookingOpen(true);
                }
              }}
            >
              BOOK NOW
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"></polyline><line x1="6" y1="12" x2="18" y2="12"></line></svg>
            </button>
          </div>

          <div className="social-proof-stack">
            <div className="avatar-stack">
              <img src="https://i.pravatar.cc/100?img=1" alt="student" />
              <img src="https://i.pravatar.cc/100?img=5" alt="student" />
              <img src="https://i.pravatar.cc/100?img=9" alt="student" />
              <div className="more-count">+15</div>
            </div>
            <div className="social-proof-text">
              <strong>30+ students</strong> viewed this property today
            </div>
          </div>
        </div>

        <div className="hero-right-column">
          <div className="premium-image-container">
            {property.isVerified && (
              <div className="floating-badge-orange">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                VERIFIED SECURE
              </div>
            )}
            
            <img 
              key={activeImageIndex}
              className="animated-image"
              src={property.images && property.images.length > 0 ? (property.images[activeImageIndex] || property.images[0]) : "https://via.placeholder.com/600x400?text=No+Image"} 
              alt={property.title} 
            />
            
            {property.images && property.images.length > 1 && (
              <div style={{ position: 'absolute', top: '50%', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 16px', transform: 'translateY(-50%)', zIndex: 5, pointerEvents: 'none' }}>
                <button className="nav-arrow prev" onClick={handlePrevImage} style={{ pointerEvents: 'auto', background: 'var(--white)', color: 'var(--gray-800)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', boxShadow: 'var(--shadow-md)', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                <button className="nav-arrow next" onClick={handleNextImage} style={{ pointerEvents: 'auto', background: 'var(--white)', color: 'var(--gray-800)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', boxShadow: 'var(--shadow-md)', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              </div>
            )}
            
            <div className="glass-pricing-bar">
              <div>
                <div className="label">Monthly Rent</div>
                <div className="price">₱{property.price.toLocaleString()} <span className="period">/{property.period}</span></div>
              </div>
            </div>
          </div>
          
          {/* Small thumbnail gallery below the main image to preserve functionality */}
          {property.images && property.images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
              {property.images.slice(0, 4).map((imgUrl, i) => (
                <div 
                  key={i} 
                  onClick={() => setActiveImageIndex(i)}
                  style={{ 
                    width: '60px', height: '40px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer',
                    border: activeImageIndex === i ? '2px solid var(--teal-600)' : '2px solid transparent',
                    opacity: activeImageIndex === i ? 1 : 0.6
                  }}
                >
                  <img src={imgUrl} alt={`Thumb ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {property.quickStats && property.quickStats.length > 0 && (
        <div className="stats-strip-container">
          {property.quickStats.map((stat, idx) => (
            <div key={idx} className="stat-item">
              <div className={`stat-value ${idx === property.quickStats!.length - 1 ? 'orange' : ''}`} style={{ fontSize: '1.8rem' }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

          {typeof property.landlordId === 'object' && property.landlordId !== null && (
            <div style={{ marginBottom: '40px', padding: '24px', backgroundColor: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--teal-100)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--teal-700)' }}>
                {property.landlordId.profileImage ? (
                  <img src={property.landlordId.profileImage} alt={property.landlordId.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  property.landlordId.fullName?.charAt(0) || 'L'
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--gray-900)' }}>{property.landlordId.fullName}</h3>
                  {property.landlordId.subscriptionTier === 'premium' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0ea5e9" stroke="#white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px' }}>
                      <polygon points="12 2 15.09 5.09 19.5 5.5 20.91 9.91 24 12 20.91 14.09 19.5 18.5 15.09 18.91 12 22 8.91 18.91 4.5 18.5 3.09 14.09 0 12 3.09 9.91 4.5 5.5 8.91 5.09 12 2"></polygon>
                      <polyline points="9 12 11 14 15 10" stroke="white" strokeWidth="3"></polyline>
                    </svg>
                  )}
                </div>
                <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.95rem' }}>Property Landlord</p>
              </div>
            </div>
          )}

        <div className="features-area-full">
          <h2 className="section-label" style={{ fontSize: '1.8rem', marginBottom: '32px' }}>Detailed Features</h2>
          <div className="premium-features-grid">
            {property.features && property.features.length > 0 ? (
              property.features.map((feat, idx) => (
                <div key={idx} className="feature-card-premium">
                  <div className="feature-icon-wrapper">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <div className="feature-content">
                    <h4>{feat.name}</h4>
                    <p>{feat.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>No detailed features listed.</p>
            )}
          </div>
        </div>

      {property && (
        <BookingModal 
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
          property={property} 
        />
      )}
    </main>
  );
};
