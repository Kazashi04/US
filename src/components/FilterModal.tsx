import React, { useState, useEffect } from 'react';

export interface FilterState {
  maxPrice: number;
  roomCapacity: number | '';
  hasWiFi: boolean;
  curfewMode: 'any' | 'no-curfew' | 'has-curfew';
  category: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultFilters: FilterState = {
  maxPrice: 15000,
  roomCapacity: '',
  hasWiFi: false,
  curfewMode: 'any',
  category: 'All'
};

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
}

const COLORS = {
  teal600: '#0d9488',
  teal700: '#0f766e',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray500: '#64748b',
  gray700: '#334155',
  gray900: '#0f172a',
  white: '#ffffff'
};

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, filters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  return (
    <div style={styles.overlay} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={e => e.stopPropagation()}>
        <header style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: COLORS.gray900 }}>Filters</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </header>

        <div style={styles.body}>
          {/* Max Price */}
          <div style={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={styles.label}>Max Rent Price</label>
              <span style={{ fontWeight: 800, color: COLORS.teal700, fontSize: '1.1rem' }}>₱{localFilters.maxPrice.toLocaleString()}</span>
            </div>
            <div style={{ position: 'relative', paddingTop: '10px', paddingBottom: '10px' }}>
              <input 
                type="range" 
                min="500" 
                max="15000" 
                step="500"
                value={localFilters.maxPrice}
                onChange={e => handleChange('maxPrice', Number(e.target.value))}
                style={{ width: '100%', accentColor: COLORS.teal600, height: '6px', borderRadius: '3px', outline: 'none' }}
              />
            </div>
          </div>

          {/* Category */}
          <div style={styles.field}>
            <label style={styles.label}>Property Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['All', 'Boarding House', 'Transient House', 'Apartment', 'Single Room'].map(cat => (
                <button
                  key={cat}
                  onClick={() => handleChange('category', cat)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: localFilters.category === cat ? COLORS.teal600 : COLORS.gray200,
                    background: localFilters.category === cat ? COLORS.teal50 : COLORS.white,
                    color: localFilters.category === cat ? COLORS.teal700 : COLORS.gray700,
                    fontWeight: localFilters.category === cat ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: localFilters.category === cat ? '0 2px 8px rgba(13, 148, 136, 0.15)' : 'none',
                    transform: localFilters.category === cat ? 'scale(1.02)' : 'scale(1)'
                  }}
                >
                  {cat === 'All' ? 'All Types' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Room Capacity */}
          <div style={styles.field}>
            <label style={styles.label}>Room Capacity (Beds)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[{val: '', label: 'Any'}, {val: 1, label: '1 Bed'}, {val: 2, label: '2 Beds'}, {val: 3, label: '3 Beds'}, {val: 4, label: '4+ Beds'}].map(cap => (
                <button
                  key={cap.val}
                  onClick={() => handleChange('roomCapacity', cap.val)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: localFilters.roomCapacity === cap.val ? COLORS.teal600 : COLORS.gray200,
                    background: localFilters.roomCapacity === cap.val ? COLORS.teal600 : COLORS.white,
                    color: localFilters.roomCapacity === cap.val ? COLORS.white : COLORS.gray700,
                    fontWeight: localFilters.roomCapacity === cap.val ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: localFilters.roomCapacity === cap.val ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none',
                    transform: localFilters.roomCapacity === cap.val ? 'translateY(-1px)' : 'none'
                  }}
                >
                  {cap.label}
                </button>
              ))}
            </div>
          </div>

          {/* Curfew Rules */}
          <div style={styles.field}>
            <label style={styles.label}>Curfew Rules</label>
            <div style={{ display: 'flex', background: COLORS.gray100, padding: '4px', borderRadius: '12px' }}>
              {(['any', 'no-curfew', 'has-curfew'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => handleChange('curfewMode', mode)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none',
                    background: localFilters.curfewMode === mode ? COLORS.white : 'transparent',
                    color: localFilters.curfewMode === mode ? COLORS.teal700 : COLORS.gray600,
                    fontWeight: localFilters.curfewMode === mode ? 700 : 500,
                    fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: localFilters.curfewMode === mode ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {mode === 'any' ? 'Any' : mode === 'no-curfew' ? 'No Curfew' : 'Has Curfew'}
                </button>
              ))}
            </div>
          </div>

          {/* WiFi Toggle */}
          <div style={{...styles.field, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px'}}>
            <div>
              <label style={{...styles.label, cursor: 'pointer'}} onClick={() => handleChange('hasWiFi', !localFilters.hasWiFi)}>Wi-Fi Required</label>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: COLORS.gray500 }}>Only show places with internet access</p>
            </div>
            <div 
              onClick={() => handleChange('hasWiFi', !localFilters.hasWiFi)}
              style={{
                width: '44px', height: '24px', background: localFilters.hasWiFi ? COLORS.teal600 : COLORS.gray300,
                borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease'
              }}
            >
              <div style={{
                position: 'absolute', top: '2px', left: localFilters.hasWiFi ? '22px' : '2px',
                width: '20px', height: '20px', background: COLORS.white, borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
          </div>
        </div>

        <footer style={styles.footer}>
          <button onClick={handleApply} style={styles.applyBtn}>Show Results</button>
        </footer>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 3000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
    padding: '20px', animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    background: COLORS.white, borderRadius: '24px', width: '100%', maxWidth: '480px',
    boxShadow: '0 24px 80px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column',
    overflow: 'hidden', transform: 'scale(1)', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  },
  header: {
    padding: '20px 24px', borderBottom: `1px solid ${COLORS.gray200}`,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: COLORS.gray500
  },
  body: {
    padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
    maxHeight: '70vh', overflowY: 'auto'
  },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.95rem', fontWeight: 600, color: COLORS.gray900 },
  select: {
    padding: '10px 14px', borderRadius: '8px', border: `1px solid ${COLORS.gray300}`,
    fontSize: '0.95rem', outline: 'none', background: COLORS.white
  },
  pillBtn: {
    padding: '8px 16px', borderRadius: '999px', border: '1px solid',
    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', flex: 1
  },
  footer: {
    padding: '16px 24px', borderTop: `1px solid ${COLORS.gray200}`,
    display: 'flex', justifyContent: 'center'
  },
  applyBtn: {
    background: COLORS.teal700, color: COLORS.white, border: 'none',
    padding: '14px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', flex: 1,
    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)', transition: 'all 0.2s', fontSize: '1rem'
  }
};

// Add global styles for animations if they don't exist
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);
