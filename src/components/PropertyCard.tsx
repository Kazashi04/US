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
          {property.badges.map((badge) => (
            <span 
              key={badge} 
              className={`card-badge ${badge === 'Verified' ? 'card-badge--verified' : badge === 'New' ? 'card-badge--new' : 'card-badge--top'}`}
            >
              {badge === 'Verified' ? '✓ Verified' : badge}
            </span>
          ))}
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
        <p className="card-description">{property.description}</p>
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
