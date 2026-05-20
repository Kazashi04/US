import type { Property } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

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
  }
};
