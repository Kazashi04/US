import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const COLORS = {
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal800: '#115e59',
  teal50: '#f0fdfa',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray900: '#0f172a',
  amber50: '#fffbeb',
  amber700: '#b45309',
  green50: '#f0fdf4',
  green700: '#15803d',
  red50: '#fef2f2',
  red700: '#b91c1c'
};

export const MyProfile: React.FC = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(user?.profileImage || null);
  const [loading, setLoading] = useState(false);

  if (!user || !token) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', color: COLORS.gray500 }}>
        <h2>Sign in required</h2>
        <p>Please sign in to view your profile.</p>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 20px', background: COLORS.teal600, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Back to Home</button>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('fullName', fullName);
      if (phoneNumber) formData.append('phoneNumber', phoneNumber);
      if (user.userType === 'student' && university) formData.append('university', university);
      if (profileImageFile) formData.append('profileImage', profileImageFile);

      await apiService.updateProfile(formData, token);
      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = () => {
    if (user.userType === 'student') return null;

    let vBg = COLORS.amber50;
    let vColor = COLORS.amber700;
    let vText = 'Pending Verification';

    if (user.verificationStatus === 'approved' || user.isVerified) {
      vBg = COLORS.green50;
      vColor = COLORS.green700;
      vText = 'Verified Landlord';
    } else if (user.verificationStatus === 'rejected') {
      vBg = COLORS.red50;
      vColor = COLORS.red700;
      vText = 'Verification Rejected';
    }

    let sBg = COLORS.gray100;
    let sColor = COLORS.gray700;
    let sText = 'Free Tier';

    if (user.subscriptionTier === 'premium') {
      sBg = '#e0f2fe';
      sColor = '#0369a1';
      sText = 'Premium Subscriber';
    } else if (user.subscriptionTier === 'regular') {
      sBg = COLORS.teal50;
      sColor = COLORS.teal700;
      sText = 'Regular Subscriber';
    }

    return (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
        <div style={{ padding: '6px 14px', background: vBg, color: vColor, borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
          {vText}
        </div>
        <div style={{ padding: '6px 14px', background: sBg, color: sColor, borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
          {sText}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '100px auto 40px auto', padding: '0 20px' }}>
      <div style={{ 
        background: '#fff', 
        borderRadius: '24px', 
        boxShadow: 'var(--shadow-xl)', 
        padding: '40px',
        border: `1px solid ${COLORS.gray200}`
      }}>
        
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: COLORS.gray900, marginBottom: '8px' }}>My Profile</h1>
        <p style={{ color: COLORS.gray500, marginBottom: '32px' }}>Manage your personal information and account status.</p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {/* Avatar Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '140px', 
                height: '140px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--teal-500), var(--teal-700))',
                boxShadow: '0 8px 24px rgba(13, 148, 136, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                color: '#fff',
                fontSize: '3rem',
                fontWeight: 700
              }}>
                {previewImage ? (
                  <img src={previewImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  background: 'none', 
                  border: `1px solid ${COLORS.gray300}`, 
                  padding: '8px 16px', 
                  borderRadius: '999px', 
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: COLORS.gray700,
                  transition: 'all 0.2s'
                }}
              >
                Change Photo
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>

            {/* Form Fields */}
            <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: COLORS.gray700, marginBottom: '8px' }}>
                  Account Type & Status
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.gray900, textTransform: 'capitalize' }}>
                  {user.userType}
                </div>
                {renderStatus()}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: COLORS.gray700, marginBottom: '8px' }}>
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={user.email} 
                  disabled 
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: `1px solid ${COLORS.gray300}`,
                    background: COLORS.gray50,
                    color: COLORS.gray500,
                    outline: 'none',
                    fontSize: '1rem',
                    cursor: 'not-allowed'
                  }} 
                />
                <span style={{ fontSize: '0.8rem', color: COLORS.gray400, marginTop: '4px', display: 'block' }}>Email cannot be changed directly.</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: COLORS.gray700, marginBottom: '8px' }}>
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: `1px solid ${COLORS.gray300}`,
                    outline: 'none',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s'
                  }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: COLORS.gray700, marginBottom: '8px' }}>
                  Phone Number
                </label>
                <input 
                  type="text" 
                  value={phoneNumber} 
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 09123456789"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '12px', 
                    border: `1px solid ${COLORS.gray300}`,
                    outline: 'none',
                    fontSize: '1rem'
                  }} 
                />
              </div>

              {user.userType === 'student' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: COLORS.gray700, marginBottom: '8px' }}>
                    University
                  </label>
                  <input 
                    type="text" 
                    value={university} 
                    onChange={e => setUniversity(e.target.value)}
                    placeholder="Enter your university"
                    style={{ 
                      width: '100%', 
                      padding: '12px 16px', 
                      borderRadius: '12px', 
                      border: `1px solid ${COLORS.gray300}`,
                      outline: 'none',
                      fontSize: '1rem'
                    }} 
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${COLORS.gray200}`, paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button 
              type="button"
              onClick={() => navigate('/')}
              style={{ 
                padding: '12px 24px', 
                background: '#fff', 
                color: COLORS.gray700, 
                border: `1px solid ${COLORS.gray300}`, 
                borderRadius: '999px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              style={{ 
                padding: '12px 32px', 
                background: 'linear-gradient(135deg, var(--teal-600), var(--teal-800))', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '999px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
