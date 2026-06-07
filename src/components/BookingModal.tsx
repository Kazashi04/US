import React, { useState } from 'react';
import type { Property } from '../types';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, property }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [moveInDate, setMoveInDate] = useState<Date | null>(null);
  const [durationMonths, setDurationMonths] = useState(1);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Calculate 15% of the first month's rent as the reservation fee
  const reservationFee = property.price * 0.15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      
      const formattedDate = moveInDate ? moveInDate.toISOString().split('T')[0] : '';
      const landlordIdStr = typeof property.landlordId === 'object' && property.landlordId !== null
        ? (property.landlordId as any).id || (property.landlordId as any)._id || ''
        : property.landlordId || '';
      const response = await apiService.createBookingCheckout(
        property.id,
        landlordIdStr,
        formattedDate,
        durationMonths,
        message,
        reservationFee,
        token
      );

      // Redirect to Paymongo Checkout in new tab to preserve UniStay
      window.open(response.checkoutUrl, '_blank');
      
      // Close the modal and redirect to Student Hub
      onClose();
      navigate('/student-hub');

    } catch (err: any) {
      setError(err.message || 'Failed to initiate booking. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`}>
      <div className="modal" style={{ maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 style={{ marginBottom: 16 }}>Request to Book</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 24, fontSize: '0.9rem' }}>
          You are requesting to book <strong>{property.title}</strong>. A 15% reservation fee is required to hold your spot.
        </p>

        {error && (
          <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group animate-slide-up" style={{ animationDelay: '0.1s', position: 'relative', zIndex: 50 }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--gray-800)' }}>Move-in Date</label>
            <div className="custom-datepicker-wrapper">
              <DatePicker 
                selected={moveInDate}
                onChange={(date: Date | null) => setMoveInDate(date)}
                minDate={new Date()}
                required
                className="premium-input"
                placeholderText="Select your move-in date"
                dateFormat="MMMM d, yyyy"
              />
            </div>
          </div>

          <div className="form-group animate-slide-up" style={{ animationDelay: '0.2s', position: 'relative', zIndex: 40 }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--gray-800)' }}>Duration (Months)</label>
            <div 
              className="premium-input" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setIsDurationOpen(!isDurationOpen)}
            >
              <span>{durationMonths} {durationMonths === 1 ? 'Month' : 'Months'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isDurationOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            
            {isDurationOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: '1px solid var(--teal-200)', borderRadius: 10, overflow: 'hidden', zIndex: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', animation: 'slideUpFade 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
                {[1, 2, 3, 4, 5, 6, 10, 12].map(m => (
                  <div 
                    key={m} 
                    className="custom-dropdown-item"
                    onClick={() => {
                      setDurationMonths(m);
                      setIsDurationOpen(false);
                    }}
                  >
                    {m} {m === 1 ? 'Month' : 'Months'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group animate-slide-up" style={{ animationDelay: '0.3s', position: 'relative', zIndex: 30 }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--gray-800)' }}>Message to Landlord (Optional)</label>
            <textarea 
              className="premium-input" 
              rows={3}
              placeholder="Introduce yourself or ask any questions..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>

          <div className="receipt-box animate-slide-up" style={{ marginTop: 8, animationDelay: '0.4s', position: 'relative', zIndex: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 4 }}>
              <span style={{ color: 'var(--gray-600)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                Monthly Rent
              </span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>₱{property.price.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--teal-200)', paddingTop: 12, flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontWeight: 700, color: 'var(--gray-900)', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--teal-600)', flexShrink: 0 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Reservation Fee (15%)
              </span>
              <span style={{ fontWeight: 800, color: 'var(--teal-700)', fontSize: '1.1rem' }}>₱{reservationFee.toLocaleString()}</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--teal-800)', marginTop: 12, textAlign: 'center', opacity: 0.8 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, verticalAlign: '-2px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Securely processed by Paymongo
            </p>
          </div>

          <button 
            type="submit" 
            className="booking-pay-btn" 
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Preparing Checkout...' : `Pay ₱${reservationFee.toLocaleString()} via Paymongo`}
          </button>
        </form>
      </div>
    </div>
  );
};
