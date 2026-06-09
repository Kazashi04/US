import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

const COLORS = {
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal50: '#f0fdfa',
  teal100: '#ccfbf1',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray600: '#4b5563',
  gray800: '#1f2937',
  gray900: '#111827',
  green600: '#16a34a',
  red600: '#dc2626',
  blue50: '#eff6ff',
  blue600: '#2563eb'
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#fafafa',
    padding: '80px 24px',
    color: COLORS.gray900,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    textAlign: 'center',
    marginBottom: 56,
    maxWidth: 600,
  },
  title: {
    fontSize: 48,
    fontWeight: 800,
    marginBottom: 16,
    letterSpacing: '-1px',
    color: COLORS.gray900
  },
  titleHighlight: {
    color: COLORS.teal600,
    position: 'relative'
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.gray600,
    lineHeight: 1.6
  },
  grid: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 32,
    maxWidth: 900,
    width: '100%',
    flexWrap: 'wrap'
  },
  card: {
    flex: '1 1 340px',
    maxWidth: 420,
    background: '#fff',
    border: `1px solid ${COLORS.gray200}`,
    borderRadius: 16,
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  cardHover: {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  cardPremium: {
    borderColor: COLORS.teal600,
    borderWidth: 2,
    boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.2), 0 8px 10px -6px rgba(13, 148, 136, 0.1)',
  },
  badgePremium: {
    position: 'absolute',
    top: -14,
    left: '50%',
    transform: 'translateX(-50%)',
    background: COLORS.teal600,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    padding: '6px 16px',
    borderRadius: 20,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.3)'
  },
  tierName: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12,
    color: COLORS.gray900
  },
  tierDesc: {
    fontSize: 15,
    color: COLORS.gray600,
    marginBottom: 32,
    minHeight: 48,
    lineHeight: 1.6
  },
  priceWrap: {
    marginBottom: 32,
    display: 'flex',
    alignItems: 'baseline'
  },
  pricePrefix: {
    fontSize: 14,
    color: COLORS.gray600,
    display: 'block',
    marginBottom: 8,
    fontWeight: 500
  },
  price: {
    fontSize: 48,
    fontWeight: 800,
    color: COLORS.gray900,
    letterSpacing: '-1px'
  },
  priceMo: {
    fontSize: 16,
    color: COLORS.gray600,
    marginLeft: 8,
    fontWeight: 500
  },
  btn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: 8,
    border: 'none',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 40,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnPrimary: {
    background: COLORS.teal600,
    color: '#fff',
    boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)'
  },
  btnSecondary: {
    background: COLORS.teal50,
    color: COLORS.teal700,
    border: `1px solid ${COLORS.teal100}`
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 20,
    color: COLORS.gray900,
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    flex: 1
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
    fontSize: 15,
    color: COLORS.gray800,
    lineHeight: 1.5
  },
  checkIcon: {
    color: COLORS.teal600,
    flexShrink: 0,
    marginTop: 2
  },
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    background: '#fff',
    padding: '16px 24px',
    borderRadius: 12,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderLeft: `4px solid ${COLORS.red600}`
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(17, 24, 39, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: '#fff',
    padding: 40,
    borderRadius: 20,
    maxWidth: 440,
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  }
};

const CheckIcon = () => (
  <svg style={styles.checkIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [loadingTier, setLoadingTier] = useState<'regular' | 'premium' | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  
  // Modals
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // We determine pricing based on current tier
  const isRegular = user?.subscriptionTier === 'regular';
  const premiumPrice = isRegular ? 129 : 429;
  const premiumDesc = isRegular ? 'Upgrade from Regular to Premium for only ₱129' : 'Starting at';

  const handleCheckout = async (tier: 'regular' | 'premium') => {
    if (!token) {
      navigate('/?login=true');
      return;
    }
    
    if (user?.userType !== 'landlord') {
      setError('Only landlords can purchase subscriptions.');
      return;
    }

    setLoadingTier(tier);
    setError('');

    // Open a new tab immediately to bypass mobile pop-up blockers
    const newWindow = window.open('about:blank', '_blank');
    if (newWindow) {
      newWindow.document.write('<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#333;">Redirecting to PayMongo...</div>');
    }

    try {
      const { checkoutUrl } = await apiService.createSubscriptionCheckout(tier, token);
      
      // Update the opened tab's URL
      if (newWindow) {
        newWindow.location.href = checkoutUrl;
      } else {
        // Fallback if pop-up was completely blocked
        window.location.href = checkoutUrl;
      }
      
      // Show verification modal
      setShowVerifyModal(true);
    } catch (err) {
      if (newWindow) newWindow.close();
      setError((err as Error).message || 'Failed to create checkout session.');
    } finally {
      setLoadingTier(null);
    }
  };

  const handleVerify = async () => {
    if (!token) return;
    setVerifying(true);
    setError('');
    
    try {
      const { success, status } = await apiService.verifySubscriptionPayment(token);
      if (success) {
        // We force a logout to refresh token and claims properly, or redirect to hub
        // Actually, redirecting to hub might just have stale Context unless we update Context.
        // For simplicity, we just reload the window.
        window.location.href = '/landlord-hub';
      } else {
        setError(`Payment status is: ${status}. Please complete payment in the PayMongo tab.`);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to verify payment.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          Upgrade for more access to <span style={styles.titleHighlight}>UniStay</span>
        </h1>
        <p style={styles.subtitle}>
          Cancel at any time. By subscribing, you agree to the UniStay Terms of Service. Reach more guests and boost your rentals.
        </p>
      </header>

      <div style={styles.grid}>
        {/* REGULAR TIER */}
        <div 
          style={styles.card}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: styles.card.boxShadow })}
        >
          <div style={styles.tierName}>UniStay Regular</div>
          <div style={styles.tierDesc}>Start hosting guests with the essential tools for property management.</div>
          
          <div style={styles.priceWrap}>
            <div style={styles.price}>₱300</div>
            <span style={styles.priceMo}>/mo</span>
          </div>

          <button 
            style={{ ...styles.btn, ...(user?.subscriptionTier === 'regular' ? styles.btnSecondary : styles.btnPrimary) }}
            onClick={() => handleCheckout('regular')}
            disabled={loadingTier !== null || user?.subscriptionTier === 'premium'}
          >
            {loadingTier === 'regular' ? 'Preparing...' : user?.subscriptionTier === 'regular' ? 'Current Plan' : 'Get Regular'}
          </button>

          <div style={styles.featuresTitle}>Features</div>
          <ul style={styles.featureList}>
            <li style={styles.featureItem}><CheckIcon /> List up to 2 properties</li>
            <li style={styles.featureItem}><CheckIcon /> Access to Landlord Hub analytics</li>
            <li style={styles.featureItem}><CheckIcon /> Accept online reservations directly</li>
          </ul>
        </div>

        {/* PREMIUM TIER */}
        <div 
          style={{ ...styles.card, ...styles.cardPremium }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { transform: 'translateY(0)', boxShadow: styles.cardPremium.boxShadow })}
        >
          <div style={styles.badgePremium}>Recommended</div>
          <div style={styles.tierName}>UniStay Premium</div>
          <div style={styles.tierDesc}>Work smarter and rent faster with expanded benefits and priority placement.</div>
          
          <div style={styles.priceWrap}>
            {isRegular && <span style={styles.pricePrefix}>{premiumDesc}</span>}
            <div style={styles.price}>₱{premiumPrice}</div>
            <span style={styles.priceMo}>/mo</span>
          </div>

          <button 
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={() => handleCheckout('premium')}
            disabled={loadingTier !== null || user?.subscriptionTier === 'premium'}
          >
            {loadingTier === 'premium' ? 'Preparing...' : user?.subscriptionTier === 'premium' ? 'Current Plan' : 'Get Premium'}
          </button>

          <div style={styles.featuresTitle}>Premium Benefits</div>
          <ul style={styles.featureList}>
            <li style={styles.featureItem}>
              <CheckIcon />
              <div>
                <strong>Boosted Visibility</strong><br/>
                Your listings always appear at the top of search results.
              </div>
            </li>
            <li style={styles.featureItem}>
              <CheckIcon />
              <div>
                <strong>Verified Badge</strong><br/>
                Build extreme trust with guests via an exclusive verification badge.
              </div>
            </li>
            <li style={styles.featureItem}>
              <CheckIcon />
              <div>
                <strong>List up to 5 properties</strong><br/>
                Manage a larger portfolio of rentals seamlessly.
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 48 }}>
        <button onClick={() => navigate('/landlord-hub')} style={{ background: 'none', border: 'none', color: COLORS.teal600, cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
          &larr; Back to Landlord Hub
        </button>
      </div>

      {error && (
        <div style={styles.toast}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <div style={{ fontWeight: 600, color: COLORS.gray800 }}>Error</div>
            <div style={{ fontSize: 14, color: COLORS.gray600 }}>{error}</div>
          </div>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', marginLeft: 'auto', cursor: 'pointer', fontSize: 18, color: COLORS.gray600 }}>&times;</button>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: COLORS.blue50, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.blue600} strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
            <h2 style={{ fontSize: 24, marginBottom: 16 }}>Complete Payment</h2>
            <p style={{ color: COLORS.gray600, marginBottom: 32, lineHeight: 1.5 }}>
              A PayMongo checkout page has been opened in a new tab. Please complete your payment there, and click the button below when finished.
            </p>
            <button 
              onClick={handleVerify}
              disabled={verifying}
              style={{ ...styles.btn, ...styles.btnPrimary, marginBottom: 12 }}
            >
              {verifying ? 'Verifying...' : 'I have completed payment'}
            </button>
            <button 
              onClick={() => setShowVerifyModal(false)}
              style={{ ...styles.btn, ...styles.btnSecondary, marginBottom: 0 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
