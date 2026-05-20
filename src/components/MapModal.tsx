import React from 'react';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active" id="map-modal" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal modal--wide" id="map-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" id="map-modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <span className="modal-icon">📍</span>
          <h2>UniStay Interactive Map</h2>
          <p>Explore boarding houses near GenSan universities</p>
        </div>
        <div className="map-placeholder">
          <div className="map-content">
            <div className="map-pin university" style={{ top: '25%', left: '15%' }}>Notre Dame of Dadiangas University</div>
            <div className="map-pin university" style={{ top: '50%', right: '15%' }}>Mindanao State University (MSU)</div>

            <div className="map-pin property" style={{ top: '28%', left: '45%' }}>Casa Verde Residences (250m)</div>
            <div className="map-pin property" style={{ top: '55%', right: '40%' }}>Sunrise Student Homes (400m)</div>
            <div className="map-pin property" style={{ top: '15%', right: '35%' }}>Metro Living Suites (800m)</div>
            <div className="map-pin property" style={{ top: '75%', left: '20%' }}>Greenfield Dormitory (600m)</div>
          </div>
        </div>
        <div className="map-modal-footer"
          style={{ paddingTop: '16px', fontSize: '0.85rem', color: 'var(--gray-500)', textAlign: 'center' }}>
          <p>Our smart distance algorithm automatically estimates walking distance to the nearest campus.</p>
        </div>
      </div>
    </div>
  );
};
