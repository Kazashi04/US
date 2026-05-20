import { useState } from 'react';
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
import { useAuth } from './contexts/AuthContext';

function App() {
  const [page, setPage] = useState<'home' | 'details' | 'hub'>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  const { user } = useAuth();

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
    showToast('Search query reset');
  };

  const handleSelectProperty = (id: string) => {
    setSelectedPropertyId(id);
    setPage('details');
  };

  const handleLoginSuccess = () => {
    showToast('Successfully signed in to UniStay');
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
    } else if (user.userType !== 'landlord') {
      showToast('Only landlords can list properties');
    } else {
      setPage('hub');
    }
  };

  return (
    <>
      {page !== 'hub' && (
        <Navbar 
          currentPage={page} 
          onNavigate={(p) => setPage(p)} 
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenSignup={() => setIsSignupOpen(true)}
        />
      )}

      {page === 'home' && (
        <>
          <Hero onSearch={handleSearch} />
          
          <PropertyGrid 
            searchQuery={searchQuery}
            verifiedOnly={verifiedOnly}
            onSelectProperty={handleSelectProperty}
            onToggleVerified={handleToggleVerified}
            onOpenMap={() => setIsMapOpen(true)}
            onResetSearch={handleResetSearch}
          />
          
          <CTASection onNavigateToHub={handleNavigateToHub} />
        </>
      )}

      {page === 'details' && (
        <PropertyDetails 
          propertyId={selectedPropertyId} 
          onBack={() => setPage('home')}
          onOpenLogin={handleBookRequest}
          onOpenMap={() => setIsMapOpen(true)}
        />
      )}

      {page === 'hub' && user?.userType === 'landlord' && (
        <LandlordHub onBackToHome={() => setPage('home')} />
      )}

      {page === 'hub' && (!user || user.userType !== 'landlord') && (
        <div style={{ padding: '40px', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <h2>Access Denied</h2>
          <p>Only landlords can access this page.</p>
          <button onClick={() => setPage('home')} className="form-btn" style={{ marginTop: '20px' }}>Back to Home</button>
        </div>
      )}

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

      <MapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />

      <ChatWidget />

      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#333',
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          zIndex: 9999
        }}>
          {toastMessage}
        </div>
      )}
    </>
  );
}

export default App;

