import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  area: string;
  images: string[];
  description: string;
  amenities: string[];
  isVerified: boolean;
  landlordId: string;
}

interface EditingProperty {
  id: string;
  title: string;
  price: number;
}

interface LandlordHubProps {
  onBackToHome: () => void;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const LandlordHub: React.FC<LandlordHubProps> = ({ onBackToHome }) => {
  const { user, token } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingProperty | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/properties/landlord/my-properties`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setProperties(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching properties');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (property: Property) => {
    setEditingId(property.id);
    setEditingData({
      id: property.id,
      title: property.title,
      price: property.price
    });
    setNewImages([]);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
    setNewImages([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages(Array.from(e.target.files));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingData) return;

    try {
      const formData = new FormData();
      formData.append('title', editingData.title);
      formData.append('price', editingData.price.toString());

      newImages.forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`${API_BASE_URL}/properties/${editingData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update property');
      }

      const updatedProperty = await response.json();
      setProperties(properties.map(p => p.id === editingData.id ? updatedProperty.property : p));
      setEditingId(null);
      setEditingData(null);
      setNewImages([]);
      alert('Property updated successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating property');
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete property');
      }

      setProperties(properties.filter(p => p.id !== propertyId));
      alert('Property deleted successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting property');
    }
  };

  if (!user || user.userType !== 'landlord') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', minHeight: '100vh' }}>
        <h2>Access Denied</h2>
        <p>Only landlords can access this page.</p>
        <button onClick={onBackToHome} className="form-btn" style={{ marginTop: '20px' }}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <nav className="navbar" style={{ borderBottom: '1px solid #e0e0e0' }}>
        <div className="nav-container">
          <a
            href="#"
            className="nav-logo"
            onClick={(e) => {
              e.preventDefault();
              onBackToHome();
            }}
          >
            <span className="logo-text">Uni<span className="logo-accent">Stay</span></span>
            <span style={{ marginLeft: '12px', fontSize: '14px', color: '#666' }}>Landlord Hub</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ color: '#666' }}>👤 {user.fullName}</span>
            <button
              onClick={onBackToHome}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </nav>

      <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '30px', fontSize: '28px' }}>My Properties</h1>

        {error && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading your properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <p style={{ fontSize: '16px', color: '#666' }}>No properties yet. Create your first listing!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {properties.map((property) => (
              <div
                key={property.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Property Image */}
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                  {editingId === property.id && newImages.length > 0 ? (
                    <img
                      src={URL.createObjectURL(newImages[0])}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                      📷 No Image
                    </div>
                  )}

                  {editingId === property.id && (
                    <label
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      📸 Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        multiple
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>

                {/* Property Details */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {editingId === property.id ? (
                    <>
                      <input
                        type="text"
                        value={editingData?.title || ''}
                        onChange={(e) => setEditingData({ ...editingData!, title: e.target.value })}
                        style={{
                          marginBottom: '12px',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      />
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          Price (per month)
                        </label>
                        <input
                          type="number"
                          value={editingData?.price || 0}
                          onChange={(e) => setEditingData({ ...editingData!, price: Number(e.target.value) })}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 style={{ marginBottom: '8px', fontSize: '16px', margin: 0 }}>{property.title}</h3>
                      <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>📍 {property.area}</p>
                      <p style={{ color: '#2c7a7b', fontSize: '16px', fontWeight: 'bold', margin: '8px 0' }}>
                        ₱{property.price.toLocaleString()}/month
                      </p>
                    </>
                  )}

                  {editingId === property.id && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      {newImages.length > 0 && (
                        <p>✅ {newImages.length} image(s) selected</p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                    {editingId === property.id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#2c7a7b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancel}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#f0f0f0',
                            color: '#666',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(property)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#f0f0f0',
                            color: '#333',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(property.id)}
                          style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#fee',
                            color: '#c33',
                            border: '1px solid #fcc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

