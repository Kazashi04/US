import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PropertyGrid } from './components/PropertyGrid';
import { CTASection } from './components/CTASection';
import { LoginModal } from './components/LoginModal';
import { SignupModal } from './components/SignupModal';
import { MapModal } from './components/MapModal';
import { ChatWidget } from './components/ChatWidget';
import { PropertyDetails } from './pages/PropertyDetails';
import { LandlordHub } from './pages/LandlordHub';
import { AdminHub } from './pages/AdminHub';
import { StudentHub } from './pages/StudentHub';
import { Resources } from './pages/Resources';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { Pricing } from './pages/Pricing';
import { FilterModal, defaultFilters } from './components/FilterModal';
import type { FilterState } from './components/FilterModal';
import { useAuth } from './contexts/AuthContext';

function App() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleToggleVerified = () => {
    setVerifiedOnly((prev) => {
      const next = !prev;
      showToast(next ? 'Showing only verified boarding houses' : 'Showing all boarding houses');
      return next;
    });
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setVerifiedOnly(false);
    setFilters(defaultFilters);
    showToast('Search query reset');
  };

  const handleSelectProperty = (id: string) => {
    setSelectedPropertyId(id);
    navigate(`/property/${id}`);
  };

  const handleLoginSuccess = () => {
    showToast('Successfully signed in to UniStay');
    // Auth state updates async after this fires, so read fresh from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('user') || 'null');
      if (saved?.userType === 'admin') navigate('/admin');
    } catch { /* ignore */ }
  };

  const handleSignupSuccess = () => {
    showToast('Account created successfully!');
  };

  const handleBookRequest = () => {
    if (!user) {
      setIsLoginOpen(true);
    }
  };

  const handleNavigateToHub = () => {
    if (!user) {
      showToast('Please sign up as a landlord to list properties');
      setIsSignupOpen(true);
    } else if (user.userType === 'admin') {
      navigate('/admin');
    } else if (user.userType === 'student') {
      navigate('/student-hub');
    } else {
      navigate('/landlord-hub');
    }
  };

  return (
    <div className="app">
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route 
          path="/" 
          element={
            <>
              <Navbar 
                currentPage="home" 
                onNavigate={(p) => {
                  if (p === 'home') navigate('/');
                  if (p === 'hub') handleNavigateToHub();
                  if (p === 'resources') navigate('/resources');
                  if (p === 'messages') navigate('/messages');
                }}
                onOpenLogin={() => setIsLoginOpen(true)}
                onOpenSignup={() => setIsSignupOpen(true)}
              />
              <Hero onSearch={handleSearch} onOpenFilter={() => setIsFilterOpen(true)} />
              <PropertyGrid 
                searchQuery={searchQuery}
                verifiedOnly={verifiedOnly}
                filters={filters}
                onSelectProperty={handleSelectProperty}
                onToggleVerified={handleToggleVerified}
                onOpenMap={() => setIsMapOpen(true)}
                onResetSearch={handleResetSearch}
              />
              <CTASection onNavigateToHub={handleNavigateToHub} />
            </>
          } 
        />
        
        <Route 
          path="/property/:id" 
          element={
            <PropertyDetails 
              propertyId={selectedPropertyId} 
              onBack={() => navigate('/')}
              onOpenLogin={handleBookRequest}
              onOpenMap={() => setIsMapOpen(true)}
            />
          } 
        />

        <Route
          path="/landlord-hub"
          element={
            user?.userType === 'landlord' ? (
              <LandlordHub onBackToHome={() => navigate('/')} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <h2>Access Denied</h2>
                <p>Only landlords can access this page.</p>
                <button onClick={() => navigate('/')} className="form-btn" style={{ marginTop: '20px' }}>Back to Home</button>
              </div>
            )
          }
        />

        <Route path="/pricing" element={<Pricing />} />

        <Route
          path="/admin"
          element={
            user?.userType === 'admin' ? (
              <AdminHub onBackToHome={() => navigate('/')} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <h2>Admin access required</h2>
                <p>Sign in with the admin account to access this page.</p>
                <button onClick={() => navigate('/')} className="form-btn" style={{ marginTop: '20px' }}>Back to Home</button>
              </div>
            )
          }
        />

        <Route
          path="/student-hub"
          element={
            <>
              <Navbar 
                currentPage="hub" 
                onNavigate={(p) => {
                  if (p === 'home') navigate('/');
                  if (p === 'hub') handleNavigateToHub();
                  if (p === 'resources') navigate('/resources');
                  if (p === 'messages') navigate('/messages');
                }}
                onOpenLogin={() => setIsLoginOpen(true)}
                onOpenSignup={() => setIsSignupOpen(true)}
              />
              <StudentHub />
            </>
          }
        />

        <Route
          path="/resources"
          element={<Resources onBackToHome={() => navigate('/')} />}
        />

        <Route
          path="/profile/:id"
          element={
            <>
              <Navbar 
                currentPage="" 
                onNavigate={(p) => {
                  if (p === 'home') navigate('/');
                  if (p === 'hub') handleNavigateToHub();
                  if (p === 'resources') navigate('/resources');
                  if (p === 'messages') navigate('/messages');
                }}
                onOpenLogin={() => setIsLoginOpen(true)}
                onOpenSignup={() => setIsSignupOpen(true)}
              />
              <Profile />
            </>
          }
        />

        <Route
          path="/messages"
          element={
            user ? (
              <>
                <Navbar 
                  currentPage="messages" 
                  onNavigate={(p) => {
                    if (p === 'home') navigate('/');
                    if (p === 'hub') handleNavigateToHub();
                    if (p === 'resources') navigate('/resources');
                    if (p === 'messages') navigate('/messages');
                  }}
                  onOpenLogin={() => setIsLoginOpen(true)}
                  onOpenSignup={() => setIsSignupOpen(true)}
                />
                <Messages />
              </>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <h2>Sign in required</h2>
                <p>Please sign in to view your messages.</p>
                <button onClick={() => navigate('/')} className="form-btn" style={{ marginTop: '20px' }}>Back to Home</button>
              </div>
            )
          }
        />
      </Routes>

      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
      />

      <SignupModal 
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSignupSuccess={handleSignupSuccess}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
      />

      <MapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />

      {location.pathname !== '/messages' && location.pathname !== '/pricing' && <ChatWidget />}

      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          backgroundColor: '#333',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          zIndex: 9999
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;
