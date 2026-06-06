import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PropertyCard } from '../components/PropertyCard';
import type { Property } from '../types';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  userType: string;
  profileImage?: string;
  createdAt: string;
}

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await apiService.getUserProfile(id);
        setProfileUser(data.user);
        setProperties(data.properties);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleMessage = async () => {
    if (!user || !token) {
      alert("Please login to send a message.");
      return;
    }
    if (user.id === profileUser?.id) {
      alert("You cannot message yourself.");
      return;
    }

    setIsStartingChat(true);
    try {
      // Find a property to link the conversation, or pass null/default if none. 
      // Our startConversation expects a propertyId. If it's a landlord with properties, we can link the first one.
      // If it's a student, or a landlord with no properties, we might need a workaround or just pass a dummy ID.
      // For now, let's pass a special string or the first property ID.
      const propertyIdForChat = properties.length > 0 ? properties[0].id : 'general';
      await apiService.startConversation(propertyIdForChat, profileUser!.id, token);
      navigate('/messages');
    } catch (err) {
      console.error(err);
      alert("Could not start conversation.");
    } finally {
      setIsStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'red' }}>
        <p>{error || 'User not found'}</p>
      </div>
    );
  }

  const joinDate = new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      
      {/* Profile Header */}
      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start', background: 'var(--white)', padding: '40px', borderRadius: '20px', boxShadow: 'var(--shadow-md)', marginBottom: '40px' }}>
        
        {/* Profile Image */}
        <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--teal-100)', flexShrink: 0, background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {profileUser.profileImage ? (
            <img src={profileUser.profileImage} alt={profileUser.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '4rem', color: 'var(--gray-400)' }}>{profileUser.fullName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Profile Details */}
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', color: 'var(--gray-900)' }}>{profileUser.fullName}</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ background: profileUser.userType === 'landlord' ? 'var(--teal-100)' : 'var(--blue-100)', color: profileUser.userType === 'landlord' ? 'var(--teal-800)' : 'var(--blue-800)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {profileUser.userType}
            </span>
            <span style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Joined {joinDate}</span>
          </div>

          {/* Message Button */}
          {user?.id !== profileUser.id && (
            <button 
              onClick={handleMessage}
              disabled={isStartingChat}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '8px', background: 'var(--teal-600)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'var(--transition)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {isStartingChat ? 'Loading...' : 'Message'}
            </button>
          )}
        </div>
      </div>

      {/* Landlord Properties */}
      {profileUser.userType === 'landlord' && (
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--gray-800)', marginBottom: '24px' }}>Properties by {profileUser.fullName}</h2>
          
          {properties.length > 0 ? (
            <div className="properties-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {properties.map(property => (
                <div key={property.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/property/${property.id}`)}>
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'var(--white)', padding: '40px', borderRadius: '16px', textAlign: 'center', color: 'var(--gray-500)', border: '1px dashed var(--gray-300)' }}>
              No active properties currently listed.
            </div>
          )}
        </div>
      )}

    </div>
  );
};
