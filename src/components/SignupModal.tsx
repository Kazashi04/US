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
    confirmPassword: '',
    university: '',
    phoneNumber: ''
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      await register(
        formData.fullName,
        formData.email,
        formData.password,
        formData.confirmPassword,
        userType,
        formData.university || undefined,
        formData.phoneNumber || undefined
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
          <span className="modal-icon">📝</span>
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
            <label htmlFor="user-type">I am a</label>
            <select 
              id="user-type"
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value as 'student' | 'landlord');
                setFormData(prev => ({ ...prev, university: '' }));
              }}
              required
            >
              <option value="student">Student/Guest</option>
              <option value="landlord">Landlord</option>
            </select>
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
