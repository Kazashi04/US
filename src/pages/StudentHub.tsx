import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import type { Booking } from '../types';

export const StudentHub: React.FC = () => {
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchBookings = React.useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await apiService.getMyBookings(token);
      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchBookings();
  }, [fetchBookings]);

  const handleVerifyPayment = async (bookingId: string) => {
    if (!token) return;
    setVerifyingId(bookingId);
    try {
      const res = await apiService.verifyPayment(bookingId, token);
      if (res.success) {
        toast.success("Payment verified successfully! Your booking is now pending landlord approval.");
        fetchBookings();
      } else {
        toast.error(`Payment status is currently: ${res.status}. If you just paid, please wait a moment and try again.`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to verify payment.");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCancelReservation = async (bookingId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to cancel this reservation? This action cannot be undone.')) return;
    
    try {
      const res = await apiService.deleteBooking(bookingId, token);
      if (res.success) {
        toast.success("Reservation cancelled successfully.");
        fetchBookings();
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to cancel reservation.");
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Sign in required</h2>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'payment_pending':
        return <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>Payment Pending</span>;
      case 'pending_landlord_approval':
        return <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>Awaiting Approval</span>;
      case 'approved':
        return <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>Approved</span>;
      case 'rejected':
      case 'cancelled':
        return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <main style={{ padding: '100px 20px 40px', maxWidth: 1400, margin: '0 auto', minHeight: '80vh' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--gray-900)', marginBottom: '8px' }}>My Dashboard</h1>
      <p style={{ color: 'var(--gray-600)', marginBottom: '32px' }}>Welcome back, {user.fullName}. Here are your reservations.</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading reservations...</div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--gray-50)', borderRadius: 12, border: '1px dashed var(--gray-300)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{ marginBottom: 16 }}>
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <h3 style={{ color: 'var(--gray-800)', marginBottom: 8 }}>No reservations yet</h3>
          <p style={{ color: 'var(--gray-500)' }}>Find a stay and request to book to see it here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {bookings.map(booking => (
            <div key={booking.id} style={{ display: 'flex', flexWrap: 'wrap', background: 'white', border: '1px solid var(--gray-200)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ flex: '1 1 200px', minWidth: 200, maxWidth: '100%', background: 'var(--gray-100)' }}>
                {booking.propertyId?.images?.[0] ? (
                  <img src={booking.propertyId.images[0]} alt="Property" style={{ width: '100%', height: '100%', minHeight: 200, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>No Image</div>
                )}
              </div>
              <div style={{ padding: '20px', flex: '2 1 300px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: 'var(--gray-900)' }}>{booking.propertyId?.title || 'Unknown Property'}</h3>
                    <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.9rem' }}>{booking.propertyId?.location || ''}</p>
                  </div>
                  <div>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: 16, fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: 2 }}>Move-in Date</span>
                    <strong style={{ color: 'var(--gray-800)' }}>{new Date(booking.moveInDate).toLocaleDateString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: 2 }}>Duration</span>
                    <strong style={{ color: 'var(--gray-800)' }}>{booking.durationMonths} {booking.durationMonths === 1 ? 'Month' : 'Months'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: 2 }}>Reservation Fee</span>
                    <strong style={{ color: 'var(--gray-800)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      ₱{booking.totalPrice.toLocaleString()}
                      {booking.status !== 'payment_pending' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 12, fontSize: 10, fontWeight: 700 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3 }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                          VERIFIED BY PAYMONGO
                        </span>
                      )}
                    </strong>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
                  {booking.status === 'payment_pending' && (
                    <>
                      <button 
                        className="btn-verify" 
                        onClick={() => handleVerifyPayment(booking.id)}
                        disabled={verifyingId === booking.id}
                      >
                        {verifyingId === booking.id ? 'Verifying...' : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            I have paid, verify now
                          </>
                        )}
                      </button>
                      <button 
                        className="btn-paylink" 
                        onClick={() => {
                          if (booking.checkoutUrl) {
                            window.location.href = booking.checkoutUrl;
                          } else {
                            toast.error("Checkout URL not found. Please contact support.");
                          }
                        }}
                      >
                        Pay Link
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </button>
                      <button 
                        className="btn-cancel" 
                        onClick={() => handleCancelReservation(booking.id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {(booking.status === 'pending_landlord_approval' || booking.status === 'approved') && (
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      Landlord: {booking.landlordId?.fullName || 'Unknown'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};
