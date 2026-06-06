import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess: () => void;
}

export const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSignupSuccess }) => {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'student' | 'landlord'>('student');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    university: '',
    phoneNumber: ''
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (e.target.name === 'document') {
        setDocumentFile(file);
      } else if (e.target.name === 'profileImage') {
        setProfileImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validation
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (userType === 'student' && !formData.university) {
        throw new Error('University is required for students');
      }

      if (userType === 'landlord' && !documentFile) {
        throw new Error('Please upload a valid Business Permit or ID');
      }

      if (userType === 'landlord' && !profileImage) {
        throw new Error('Please upload a formal profile picture or selfie');
      }

      await register(
        formData.fullName,
        formData.email,
        formData.password,
        formData.confirmPassword,
        userType,
        formData.university || undefined,
        formData.phoneNumber || undefined,
        documentFile || undefined,
        profileImage || undefined
      );

      onSignupSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay active" id="signup-modal" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal" id="signup-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" id="modal-close-signup" onClick={onClose}>&times;</button>
        <div className="modal-header">
          <span className="modal-icon"></span>
          <h2>Create Account</h2>
          <p>Join UniStay as a {userType === 'student' ? 'Student' : 'Landlord'}</p>
        </div>

        {error && (
          <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', color: '#c33', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form className="modal-form" id="signup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>I am a</label>
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '6px',
              borderRadius: '12px',
              gap: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                type="button"
                onClick={() => {
                  setUserType('student');
                  setFormData(prev => ({ ...prev, university: '' }));
                  setDocumentFile(null);
                  setProfileImage(null);
                  setProfileImagePreview(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: userType === 'student' ? '#ffffff' : 'transparent',
                  color: userType === 'student' ? '#0d9488' : '#64748b',
                  fontWeight: userType === 'student' ? 700 : 500,
                  boxShadow: userType === 'student' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  border: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Student / Guest
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserType('landlord');
                  setFormData(prev => ({ ...prev, university: '' }));
                  setDocumentFile(null);
                  setProfileImage(null);
                  setProfileImagePreview(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: userType === 'landlord' ? '#ffffff' : 'transparent',
                  color: userType === 'landlord' ? '#0d9488' : '#64748b',
                  fontWeight: userType === 'landlord' ? 700 : 500,
                  boxShadow: userType === 'landlord' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  border: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                Landlord
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-fullname">Full Name</label>
            <input 
              type="text" 
              id="signup-fullname" 
              name="fullName"
              placeholder="John Doe" 
              value={formData.fullName}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email Address</label>
            <input 
              type="email" 
              id="signup-email" 
              name="email"
              placeholder="you@example.com" 
              value={formData.email}
              onChange={handleInputChange}
              required 
            />
          </div>

          {userType === 'student' && (
            <div className="form-group">
              <label htmlFor="signup-university">University</label>
              <input 
                type="text" 
                id="signup-university" 
                name="university"
                placeholder="Your university name" 
                value={formData.university}
                onChange={handleInputChange}
                required 
              />
            </div>
          )}

          {userType === 'landlord' && (
            <>
              <div className="form-group">
                <label htmlFor="signup-document">Business Permit or ID</label>
                <input 
                  type="file" 
                  id="signup-document" 
                  name="document"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required 
                  style={{
                    padding: '8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    width: '100%'
                  }}
                />
                <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Required to verify your account and prevent ghost listings.
                </small>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label htmlFor="signup-profile-image" style={{ width: '100%', marginBottom: '16px' }}>Formal Profile Picture</label>
                
                <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '12px' }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: 'var(--gray-100)',
                    border: '2px dashed var(--gray-300)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }} onClick={() => document.getElementById('signup-profile-image')?.click()}>
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    id="signup-profile-image" 
                    name="profileImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    required 
                    style={{ display: 'none' }}
                  />
                  
                  {/* Plus Icon Badge */}
                  <div 
                    onClick={() => document.getElementById('signup-profile-image')?.click()}
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      background: 'var(--teal-600)',
                      color: 'white',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                </div>

                <small style={{ color: '#64748b', marginTop: '4px', textAlign: 'center', display: 'block', width: '100%' }}>
                  Upload a formal selfie or profile picture to build trust with potential tenants and guests.
                </small>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="signup-phone">Phone Number (Optional)</label>
            <input 
              type="tel" 
              id="signup-phone" 
              name="phoneNumber"
              placeholder="+63 9XX XXX XXXX" 
              value={formData.phoneNumber}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">Password</label>
            <input 
              type="password" 
              id="signup-password" 
              name="password"
              placeholder="••••••••" 
              value={formData.password}
              onChange={handleInputChange}
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <input 
              type="password" 
              id="signup-confirm-password" 
              name="confirmPassword"
              placeholder="••••••••" 
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required 
            />
          </div>

          <button type="submit" className="form-btn" id="form-submit-btn-signup" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
          <p className="form-footer">Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onClose(); }}>Sign In</a></p>
        </form>
      </div>
    </div>
  );
};
