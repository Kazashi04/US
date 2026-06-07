import React, { useState, useEffect } from 'react';
import type { Property } from '../types';
import { propertiesData } from '../data/properties';
import { apiService } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookingModal } from '../components/BookingModal';
import toast from 'react-hot-toast';

// Fix for default Leaflet markers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
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

  const handleAccordionToggle = (item: string) => {
    setActiveAccordion((prev) => (prev === item ? null : item));
  };

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
    } catch (error) {
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

      <section className="gallery-section">
        <div className="gallery-grid">
          <div className="main-image" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
            {property.images && property.images.length > 0 ? (
              <img 
                src={property.images[activeImageIndex] || property.images[0]} 
                alt={property.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div className="card-image-placeholder" style={{ height: '100%', minHeight: '350px' }}>
                <span className="placeholder-text">{property.title}</span>
              </div>
            )}
            {property.images && property.images.length > 1 && (
              <>
                <button className="nav-arrow prev" onClick={handlePrevImage}>‹</button>
                <button className="nav-arrow next" onClick={handleNextImage}>›</button>
              </>
            )}
          </div>
          <div className="side-images">
            {[1, 2, 3, 4].map((i) => {
              const imgUrl = property.images && property.images[i];
              return (
                  <div 
                    key={i} 
                    className="side-image" 
                    style={{ 
                      overflow: 'hidden', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: imgUrl ? 'pointer' : 'default',
                      border: activeImageIndex === i ? '2px solid var(--teal-600)' : 'none'
                    }}
                    onClick={() => imgUrl && setActiveImageIndex(i)}
                  >
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
            <div className="title-area" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h1 className="property-title" style={{ margin: 0 }}>{property.title}</h1>
              {property.isVerified && (
                <span style={{ 
                  background: '#0d9488', color: 'white', padding: '4px 12px', 
                  borderRadius: '50px', fontSize: '0.85rem', fontWeight: 'bold', 
                  display: 'inline-flex', alignItems: 'center', gap: '6px' 
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Verified
                </span>
              )}
            </div>
            <div style={{ marginTop: '8px' }}>
              <p className="property-address">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {property.location}
            </p>
            <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: property.availableBeds === 0 ? 'var(--red-50)' : 'var(--teal-50)', borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: property.availableBeds === 0 ? 'var(--red-700)' : 'var(--teal-700)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: property.availableBeds === 0 ? 'var(--red-500)' : 'var(--teal-500)' }}></span>
              {property.availableBeds === 0 ? 'Fully Occupied - No beds available' : `${property.availableBeds} out of ${property.roomCapacity || 1} Beds Currently Available!`}
            </div>
          </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div className="card-price" style={{ margin: 0 }}>
                <span className="price-amount" style={{ fontSize: '1.8rem' }}>₱{property.price.toLocaleString()}</span>
                <span className="price-period">/{property.period}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                className="btn-secondary" 
                onClick={handleMessageLandlord}
                disabled={isStartingChat}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '8px', fontWeight: 600, border: '1px solid var(--teal-600)', color: 'var(--teal-700)', backgroundColor: 'var(--teal-50)', cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {isStartingChat ? 'Loading...' : 'Message'}
              </button>
              <button 
                className="btn-book" 
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
                Request to Book
              </button>
            </div>
          </div>
          </div>

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
                  {property.landlordId.isVerified && (
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

        <div className="info-grid">
          <div className="features-area">
            <h2 className="section-label">Detailed Features</h2>
            <div className="accordion">
              {property.features && property.features.length > 0 ? (
                property.features.map((feat, idx) => (
                  <div key={idx} className={`accordion-item ${activeAccordion === `feat-${idx}` ? 'active' : ''}`}>
                    <button className="accordion-header" onClick={() => handleAccordionToggle(`feat-${idx}`)}>
                      <span>{feat.name}</span>
                    </button>
                    <div className="accordion-content">
                      <p>{feat.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem' }}>No detailed features listed.</p>
              )}
            </div>
          </div>

          <div className="map-area">
            <div style={{ height: '350px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', zIndex: 0, border: '1px solid var(--gray-200)' }}>
              {property.latitude && property.longitude ? (
                <MapContainer center={[property.latitude, property.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[property.latitude, property.longitude]}>
                    <Popup>{property.title}</Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="map-placeholder" onClick={onOpenMap} style={{ cursor: 'pointer', height: '100%' }}>
                  <div className="map-content">
                    <div className="map-pin university">Nearest Campus</div>
                    <div className="map-pin property">{property.title}</div>
                  </div>
                  <button className="map-expand">⛶</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

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
