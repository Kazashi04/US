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
    <main style={{ padding: '100px 20px 60px', maxWidth: 1200, margin: '0 auto', minHeight: '80vh' }}>
      
      {/* Header Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--teal-600), var(--teal-800))', 
        borderRadius: '24px', 
        padding: '40px', 
        color: 'white', 
        marginBottom: '40px',
        boxShadow: '0 10px 30px rgba(13, 148, 136, 0.2)'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 8px 0' }}>My Dashboard</h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>Welcome back, {user.fullName}! Manage your boarding house reservations here.</p>
      </div>

      <h2 style={{ fontSize: '1.5rem', color: 'var(--gray-900)', marginBottom: '24px', fontWeight: 700 }}>Your Reservations</h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray-500)' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--gray-200)', borderTopColor: 'var(--teal-600)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          Loading your reservations...
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--gray-50)', borderRadius: '24px', border: '2px dashed var(--gray-200)' }}>
          <div style={{ 
            width: '80px', height: '80px', background: 'var(--teal-50)', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--teal-600)' 
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--gray-900)', marginBottom: 8 }}>No reservations yet</h3>
          <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>It looks like you haven't booked any boarding houses yet.</p>
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
             style={{ display: 'inline-block', padding: '12px 24px', background: 'var(--teal-600)', color: 'white', borderRadius: '50px', fontWeight: 600, textDecoration: 'none' }}>
            Find a Stay
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {bookings.map(booking => (
            <div key={booking.id} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              background: 'white', 
              border: '1px solid var(--gray-100)', 
              borderRadius: '24px', 
              overflow: 'hidden', 
              boxShadow: 'var(--shadow-lg)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            >
              {/* Card Image */}
              <div style={{ height: '200px', width: '100%', background: 'var(--gray-100)', position: 'relative' }}>
                {booking.propertyId?.images?.[0] ? (
                  <img src={booking.propertyId.images[0]} alt="Property" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>No Image Available</div>
                )}
                <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                  {getStatusBadge(booking.status)}
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', color: 'var(--gray-900)', fontWeight: 700, lineHeight: 1.3 }}>
                  {booking.propertyId?.title || 'Unknown Property'}
                </h3>
                <p style={{ margin: '0 0 20px 0', color: 'var(--gray-500)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {booking.propertyId?.location || 'Location not specified'}
                </p>

                <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Move-in</span>
                    <strong style={{ color: 'var(--gray-900)' }}>{new Date(booking.moveInDate).toLocaleDateString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Duration</span>
                    <strong style={{ color: 'var(--gray-900)' }}>{booking.durationMonths} Month{booking.durationMonths > 1 ? 's' : ''}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--gray-200)', paddingTop: '12px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem', fontWeight: 600 }}>Total Fee</span>
                    <strong style={{ color: 'var(--teal-600)', fontSize: '1.1rem' }}>
                      ₱{booking.totalPrice.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {booking.status === 'payment_pending' && (
                    <>
                      <button 
                        onClick={() => {
                          if (booking.checkoutUrl) window.location.href = booking.checkoutUrl;
                          else toast.error("Checkout URL not found.");
                        }}
                        style={{ width: '100%', padding: '12px', background: 'var(--gray-900)', color: 'white', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        Proceed to Payment
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleVerifyPayment(booking.id)}
                        disabled={verifyingId === booking.id}
                        style={{ width: '100%', padding: '12px', background: 'var(--teal-50)', color: 'var(--teal-700)', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                      >
                        {verifyingId === booking.id ? 'Verifying...' : 'I have already paid'}
                      </button>
                      <button 
                        onClick={() => handleCancelReservation(booking.id)}
                        style={{ width: '100%', padding: '12px', background: 'transparent', color: 'var(--gray-500)', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                      >
                        Cancel Reservation
                      </button>
                    </>
                  )}
                  {(booking.status === 'pending_landlord_approval' || booking.status === 'approved') && (
                    <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '0.9rem', fontStyle: 'italic', padding: '8px 0' }}>
                      Landlord: {booking.landlordId?.fullName || 'Unknown'}
                    </div>
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
