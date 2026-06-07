import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Property } from '../types';
import { apiService } from '../services/api';

// Fix for default Leaflet markers
 
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  focusedPropertyId?: string | null;
}

const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose, focusedPropertyId }) => {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (isOpen) {
      apiService.getProperties()
        .then(data => setProperties(data))
        .catch(err => console.error('Error fetching properties for map:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // General Santos City center
  const defaultCenter: [number, number] = [6.1164, 125.1716];
  
  const focusedProperty = properties.find(p => p.id === focusedPropertyId);
  const center: [number, number] = focusedProperty?.latitude && focusedProperty?.longitude 
    ? [focusedProperty.latitude, focusedProperty.longitude] 
    : defaultCenter;
  const zoom = focusedProperty ? 16 : 13;

  return (
    <div className="modal-overlay active" id="map-modal" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal modal--wide" id="map-modal-box" onClick={(e) => e.stopPropagation()} style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <button className="modal-close" id="map-modal-close" onClick={onClose}>&times;</button>
        <div className="modal-header" style={{ marginBottom: '10px' }}>
          <h2>{focusedProperty ? focusedProperty.title : 'UniStay Interactive Map'}</h2>
          <p>{focusedProperty ? 'Property location view' : 'Explore boarding houses near GenSan universities'}</p>
        </div>
        <div style={{ flex: 1, width: '100%', borderRadius: '8px', overflow: 'hidden', position: 'relative', zIndex: 0 }}>
          <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
            <MapUpdater center={center} zoom={zoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {properties.map(p => (
              p.latitude && p.longitude ? (
                <Marker key={p.id} position={[p.latitude, p.longitude]}>
                  <Popup>
                    <strong>{p.title}</strong><br />
                    ₱{p.price}/{p.period}
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
