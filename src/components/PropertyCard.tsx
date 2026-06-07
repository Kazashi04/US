import React from 'react';
import type { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onSelect: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onSelect }) => {
  return (
    <article className="property-card">
      <div className="card-image" style={{ overflow: 'hidden' }}>
        {property.images && property.images.length > 0 ? (
          <img 
            src={property.images[0]} 
            alt={property.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div className="card-image-placeholder">
            <span className="placeholder-text">Coming Soon</span>
          </div>
        )}
        <div className="card-badges">
          {property.isVerified && (
            <span className="card-badge card-badge--verified" style={{ background: '#0d9488', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Verified
            </span>
          )}
          {property.badges.filter(badge => badge !== 'Verified').map((badge) => (
            <span 
              key={badge} 
              className={`card-badge ${badge === 'New' ? 'card-badge--new' : 'card-badge--top'}`}
            >
              {badge}
            </span>
          ))}
          {property.availableBeds === 0 ? (
            <span className="card-badge" style={{ background: 'rgba(254, 242, 242, 0.95)', color: '#b91c1c', border: '1px solid rgba(254, 202, 202, 0.6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '3px 8px', backdropFilter: 'blur(4px)', fontWeight: 600, fontSize: '.65rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
              Fully Occupied
            </span>
          ) : (
            <span className="card-badge" style={{ background: 'rgba(240, 253, 244, 0.95)', color: '#15803d', border: '1px solid rgba(187, 247, 208, 0.6)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '3px 8px', backdropFilter: 'blur(4px)', fontWeight: 600, fontSize: '.65rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 4px #22c55e' }}></span>
              {property.availableBeds !== undefined ? property.availableBeds : (property.roomCapacity || 1)} of {property.roomCapacity || 1} Beds Available
            </span>
          )}
        </div>
      </div>
      <div className="card-body">
        <div className="card-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {property.location}
        </div>
        <h3 className="card-title">{property.title}</h3>
        <p className="card-description">
          {property.description.split(/[-—]\s*Contact\s*[-—]/)[0].trim()}
        </p>
        <div className="card-amenities">
          {property.amenities.map((amenity) => (
            <span key={amenity} className="amenity">{amenity}</span>
          ))}
        </div>
        <div className="card-footer">
          <div className="card-price">
            <span className="price-amount">₱{property.price.toLocaleString()}</span>
            <span className="price-period">/{property.period}</span>
          </div>
          <a 
            href="#" 
            className="btn-details"
            onClick={(e) => {
              e.preventDefault();
              onSelect(property.id);
            }}
          >
            View Details
          </a>
        </div>
      </div>
    </article>
  );
};
