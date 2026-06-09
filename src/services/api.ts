import type { Property, Booking } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiService = {
  // Fetch all stays from MongoDB
  async getProperties(): Promise<Property[]> {
    const response = await fetch(`${API_BASE_URL}/properties`);
    if (!response.ok) {
      throw new Error('Failed to fetch properties from server.');
    }
    return response.json();
  },

  // Fetch details for a specific stay
  async getPropertyById(id: string): Promise<Property> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch property details.');
    }
    return response.json();
  },

  // Fetch user profile and properties
  async getUserProfile(id: string) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user profile.');
    }
    return response.json();
  },

  // Update current user profile
  async updateProfile(data: FormData, token: string) {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: data
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update profile.');
    }
    return response.json();
  },

  trackPropertyView: async (id: string, token: string): Promise<{ success: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/properties/${id}/view`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to track view');
    }
    return response.json();
  },

  // Upload stay listing with multiple images to Express/MongoDB (protected route)
  async createProperty(formData: FormData, token: string): Promise<Property> {
    const response = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to submit stay listing.');
    }
    return response.json();
  },

  // Get landlord's own properties (protected route)
  async getLandlordProperties(token: string): Promise<Property[]> {
    const response = await fetch(`${API_BASE_URL}/properties/landlord/my-properties`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch your properties.');
    }
    return response.json();
  },

  // Update property (title, price, images) - protected route
  async updateProperty(id: string, formData: FormData, token: string): Promise<{ message: string; property: Property }> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Failed to update property.');
    }
    return response.json();
  },

  // Delete stay listing (protected route)
  async deleteProperty(id: string, token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to delete property.');
    }
    return response.json();
  },

  // Helper to trigger database seeding
  async seedDatabase(): Promise<{ message: string; count: number }> {
    const response = await fetch(`${API_BASE_URL}/properties/seed`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Seeding database failed.');
    }
    return response.json();
  },

  // Landlord: resubmit a rejected listing
  async resubmitProperty(id: string, token: string): Promise<{ message: string; property: Property }> {
    const response = await fetch(`${API_BASE_URL}/properties/${id}/resubmit`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to resubmit listing.');
    }
    return response.json();
  },

  // Admin: fetch listings (optionally filtered by status)
  async getAdminListings(token: string, status?: 'pending' | 'approved' | 'rejected'): Promise<Property[]> {
    const url = status
      ? `${API_BASE_URL}/admin/listings?status=${status}`
      : `${API_BASE_URL}/admin/listings`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch listings.');
    return response.json();
  },

  // Admin: dashboard stats
  async getAdminStats(token: string): Promise<{ pending: number; approved: number; rejected: number; total: number; landlords: number }> {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch stats.');
    return response.json();
  },

  // Admin: approve a listing
  async approveListing(id: string, token: string): Promise<{ message: string; property: Property }> {
    const response = await fetch(`${API_BASE_URL}/admin/listings/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to approve.');
    }
    return response.json();
  },

  // Admin: reject a listing with reason
  async rejectListing(id: string, reason: string, token: string): Promise<{ message: string; property: Property }> {
    const response = await fetch(`${API_BASE_URL}/admin/listings/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to reject.');
    }
    return response.json();
  },

  // Admin: fetch landlords
  async getAdminLandlords(token: string, status?: 'pending' | 'approved' | 'rejected'): Promise<unknown[]> {
    const url = status
      ? `${API_BASE_URL}/admin/landlords?status=${status}`
      : `${API_BASE_URL}/admin/landlords`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch landlords.');
    return response.json();
  },

  // Admin: approve a landlord
  async approveLandlord(id: string, token: string): Promise<{ message: string; user: unknown }> {
    const response = await fetch(`${API_BASE_URL}/admin/landlords/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to approve landlord.');
    }
    return response.json();
  },

  // Admin: reject a landlord
  async rejectLandlord(id: string, reason: string, token: string): Promise<{ message: string; user: unknown }> {
    const response = await fetch(`${API_BASE_URL}/admin/landlords/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to reject landlord.');
    }
    return response.json();
  },

  // Admin: update landlord subscription
  async updateLandlordSubscription(id: string, tier: 'none' | 'regular' | 'premium', token: string): Promise<{ message: string; user: unknown }> {
    const response = await fetch(`${API_BASE_URL}/admin/landlords/${id}/subscription`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tier })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update subscription.');
    }
    return response.json();
  },

  // Subscription Paymongo
  async createSubscriptionCheckout(targetTier: 'regular' | 'premium', token: string): Promise<{ checkoutUrl: string }> {
    const response = await fetch(`${API_BASE_URL}/subscriptions/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetTier })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create subscription checkout.');
    }
    return response.json();
  },

  async verifySubscriptionPayment(token: string): Promise<{ success: boolean; user?: unknown; status?: string }> {
    const response = await fetch(`${API_BASE_URL}/subscriptions/verify-payment`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to verify payment.');
    }
    return response.json();
  },

  // Chat
  async getUnreadCount(token: string): Promise<{ unreadCount: number }> {
    const response = await fetch(`${API_BASE_URL}/messages/unread-count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch unread count');
    return response.json();
  },

  async getConversations(token: string): Promise<unknown[]> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  },

  async startConversation(propertyId: string, landlordId: string, token: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ propertyId, landlordId })
    });
    if (!response.ok) throw new Error('Failed to start conversation');
    return response.json();
  },

  async getMessages(conversationId: string, token: string): Promise<unknown[]> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },

  async markMessagesAsRead(conversationId: string, token: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to mark messages as read');
    return response.json();
  },

  async createBookingCheckout(propertyId: string, landlordId: string, moveInDate: string, durationMonths: number, message: string, totalPrice: number, token: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/bookings/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ propertyId, landlordId, moveInDate, durationMonths, message, totalPrice })
    });
    if (!response.ok) throw new Error('Failed to create checkout link');
    return response.json();
  },

  async verifyPayment(bookingId: string, token: string): Promise<{ success: boolean; status?: string }> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/verify-payment`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to verify payment');
    return response.json();
  },

  async deleteBooking(bookingId: string, token: string): Promise<{ success: boolean; message?: string }> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to cancel reservation.');
    }
    return response.json();
  },

  async getMyBookings(token: string): Promise<Booking[]> {
    const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  },

  async getManageBookings(token: string): Promise<Booking[]> {
    const response = await fetch(`${API_BASE_URL}/bookings/manage`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch reservations');
    return response.json();
  },

  async updateBookingStatus(bookingId: string, status: string, token: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error('Failed to update booking status');
    return response.json();
  }
};
