import React, { useState, useEffect } from 'react';
import type { Property } from '../types';
import { PropertyCard } from './PropertyCard';
import { propertiesData } from '../data/properties';
import { apiService } from '../services/api';

interface PropertyGridProps {
  searchQuery: string;
  verifiedOnly: boolean;
  onSelectProperty: (id: string) => void;
  onToggleVerified: () => void;
  onOpenMap: () => void;
  onResetSearch: () => void;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({
  searchQuery,
  verifiedOnly,
  onSelectProperty,
  onToggleVerified,
  onOpenMap,
  onResetSearch,
}) => {
  const [properties, setProperties] = useState<Property[]>(propertiesData);
  const [loading, setLoading] = useState(false);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(propertiesData);

  useEffect(() => {
    // Fetch live stays from MongoDB database via Express server
    apiService.getProperties()
      .then((data) => {
        if (data && data.length > 0) {
          setProperties(data);
          setFilteredProperties(data);
        }
      })
      .catch((err) => {
        console.warn('MongoDB server offline, falling back to static database.', err);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const query = searchQuery.trim().toLowerCase();
      let results = properties;

      if (query !== '') {
        results = results.filter(
          (p) =>
            p.location.toLowerCase().includes(query) ||
            p.title.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query)
        );
      }

      if (verifiedOnly) {
        results = results.filter((p) => p.isVerified);
      }

      setFilteredProperties(results);
      setLoading(false);
    }, 500); // 500ms feel responsive yet premium

    return () => clearTimeout(timer);
  }, [searchQuery, verifiedOnly, properties]);

  return (
    <section className="properties" id="properties">
      <div className="section-container">
        <div className="section-header">
          <p className="section-eyebrow">Featured Listings</p>
          <h2 className="section-title">Popular Boarding Houses</h2>
          <p className="section-subtitle">Hand-picked stays near top universities in General Santos City</p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <button 
              id="filter-verified-btn" 
              className={`btn-details ${verifiedOnly ? 'active' : ''}`}
              onClick={onToggleVerified}
              style={{ padding: '8px 16px', background: verifiedOnly ? 'var(--teal-600)' : '', color: verifiedOnly ? 'white' : '' }}
            >
              ✓ Verified Only
            </button>
            <button 
              id="filter-map-btn" 
              className="btn-details"
              onClick={onOpenMap}
              style={{ padding: '8px 16px' }}
            >
              📍 View Map
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-indicator active" id="loading-indicator">
            <div className="spinner"></div>
            <p>Loading results...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="no-results active" id="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No boarding houses found</h3>
            <p>Try searching for a different barangay or area.</p>
            <button className="btn-reset" id="btn-reset" onClick={onResetSearch}>
              Show All Listings
            </button>
          </div>
        ) : (
          <div className="property-grid" id="property-grid">
            {filteredProperties.map((prop) => (
              <PropertyCard 
                key={prop.id} 
                property={prop} 
                onSelect={onSelectProperty} 
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
