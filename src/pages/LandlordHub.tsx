import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Property, Booking } from '../types';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix for default Leaflet markers
 
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LandlordHubProps {
  onBackToHome: () => void;
}

type Category = 'Boarding House' | 'Single Room' | 'Apartment' | 'Transient House';
type Period = 'month' | 'night';

const CATEGORIES: Category[] = ['Boarding House', 'Single Room', 'Apartment', 'Transient House'];

const AMENITY_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'Wi-Fi', label: 'Wi-Fi', icon: '' },
  { value: 'Air Conditioning', label: 'Air Conditioning', icon: '️' },
  { value: 'Submeter Electricity', label: 'Submeter Electricity', icon: '' },
  { value: 'Cooking Allowed', label: 'Cooking Allowed', icon: '' },
  { value: 'Private Bathroom', label: 'Private Bathroom', icon: '' },
  { value: 'Water Filter', label: 'Water Filter', icon: '' }
];

const COLORS = {
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal800: '#115e59',
  teal50: '#f0fdfa',
  teal100: '#ccfbf1',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  amber50: '#fffbeb',
  amber600: '#d97706',
  amber700: '#b45309',
  red50: '#fef2f2',
  red200: '#fecaca',
  red600: '#dc2626',
  red700: '#b91c1c',
  green50: '#f0fdf4',
  green600: '#16a34a',
  green700: '#15803d'
};

type Status = 'pending' | 'approved' | 'rejected';

const getStatus = (p: Property): Status =>
  (p.verificationStatus as Status | undefined) || (p.isVerified ? 'approved' : 'pending');

const statusMeta: Record<Status, { label: string; bg: string; color: string; border: string }> = {
  pending:  { label: 'Pending',  bg: COLORS.amber50, color: COLORS.amber700, border: '#fde68a' },
  approved: { label: 'Approved', bg: COLORS.green50, color: COLORS.green700, border: '#bbf7d0' },
  rejected: { label: 'Needs changes', bg: COLORS.red50, color: COLORS.red700, border: '#fecaca' }
};

interface FormState {
  title: string;
  category: Category;
  price: string;
  period: Period;
  roomCapacity: number | '';
  availableBeds: number | '';
  hasCurfew: boolean;
  address: string;
  landmarks: string;
  description: string;
  amenities: string[];
  features: { name: string; description: string }[];
  quickStats: { value: string; label: string }[];
  phone: string;
  messenger: string;
  latitude: string;
  longitude: string;
  images: File[];
}

const emptyForm: FormState = {
  title: '',
  category: 'Boarding House',
  price: '',
  period: 'month',
  roomCapacity: 1,
  availableBeds: 1,
  hasCurfew: false,
  address: '',
  landmarks: '',
  description: '',
  amenities: [],
  features: [],
  quickStats: [],
  phone: '',
  messenger: '',
  latitude: '',
  longitude: '',
  images: []
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export const LandlordHub: React.FC<LandlordHubProps> = ({ onBackToHome }) => {
  const navigate = useNavigate();
  const { user, token, refreshUser } = useAuth();
  
  // Refresh user data on mount to ensure we have the latest verification status
  useEffect(() => {
    refreshUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'listings' | 'reservations' | 'subscription'>('listings');
  const [reservations, setReservations] = useState<Booking[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);



  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const data = await apiService.getLandlordProperties(token);
        if (!cancelled) setProperties(data);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load your listings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const loadRes = async () => {
      try {
        setLoadingReservations(true);
        const data = await apiService.getManageBookings(token);
        if (!cancelled) setReservations(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoadingReservations(false);
      }
    };
    loadRes();
    return () => { cancelled = true; };
  }, [token]);

  const firstName = useMemo(() => (user.fullName?.split(' ')[0] || 'Host'), [user.fullName]);

  // Auto-dismiss success toast
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const openModal = (property?: Property) => {
    if (property) {
      setEditingPropertyId(property.id);
      
      let rawDesc = property.description || '';
      let extractedPhone = '';
      let extractedMessenger = '';
      if (rawDesc.includes('- Contact -') || rawDesc.includes('— Contact —')) {
        const parts = rawDesc.split(/[-—]\s*Contact\s*[-—]/);
        rawDesc = parts[0].trim();
        const contactPart = parts[1];
        const phoneMatch = contactPart.match(/Phone:\s*(.*)/);
        if (phoneMatch) extractedPhone = phoneMatch[1].trim();
        const messengerMatch = contactPart.match(/Messenger:\s*(.*)/);
        if (messengerMatch) extractedMessenger = messengerMatch[1].trim();
      }

      setForm({
        title: property.title,
        category: (property.badges && property.badges[0] as Category) || 'Boarding House',
        price: String(property.price),
        period: (property.period as Period) || 'month',
        roomCapacity: property.roomCapacity || 1,
        availableBeds: property.availableBeds !== undefined ? property.availableBeds : (property.roomCapacity || 1),
        hasCurfew: property.hasCurfew || false,
        address: property.location,
        landmarks: property.area,
        description: rawDesc,
        amenities: property.amenities || [],
        features: property.features || [],
        phone: extractedPhone,
        messenger: extractedMessenger,
        latitude: property.latitude ? String(property.latitude) : '',
        longitude: property.longitude ? String(property.longitude) : '',
        images: [],
        quickStats: property.quickStats || []
      });
    } else {
      setEditingPropertyId(null);
      setForm(emptyForm);
    }
    setErrors({});
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleAmenity = (value: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(value)
        ? prev.amenities.filter(a => a !== value)
        : [...prev.amenities, value]
    }));
  };

  const addFiles = (incoming: FileList | File[]) => {
    const files = Array.from(incoming).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) return;
    setForm(prev => {
      const combined = [...prev.images, ...files].slice(0, 8); // backend allows up to 8
      return { ...prev, images: combined };
    });
    setErrors(prev => {
      if (!prev.images) return prev;
      const next = { ...prev };
      delete next.images;
      return next;
    });
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!form.title.trim()) next.title = 'Please give your listing a title';
    else if (form.title.trim().length < 6) next.title = 'Title should be at least 6 characters';

    const priceNum = Number(form.price);
    if (!form.price.trim()) next.price = 'Price is required';
    else if (!Number.isFinite(priceNum) || priceNum <= 0) next.price = 'Enter a valid price';

    if (!form.address.trim()) next.address = 'Address is required';
    if (!form.landmarks.trim()) next.landmarks = 'Add at least one nearby landmark';
    if (!form.description.trim()) next.description = 'A short description helps guests decide';
    else if (form.description.trim().length < 20) next.description = 'Describe your place in a bit more detail (20+ characters)';

    if (!editingPropertyId && form.images.length === 0) next.images = 'Please add at least one photo';

    if (!form.phone.trim() && !form.messenger.trim()) {
      next.phone = 'Add a phone number or a Messenger link so guests can reach you';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !token) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('location', form.address.trim());
      fd.append('area', form.landmarks.trim());
      fd.append('price', String(Number(form.price)));
      fd.append('period', form.period);

      const contactLines: string[] = [];
      if (form.phone.trim()) contactLines.push(`Phone: ${form.phone.trim()}`);
      if (form.messenger.trim()) contactLines.push(`Messenger: ${form.messenger.trim()}`);
      const fullDescription = contactLines.length
        ? `${form.description.trim()}\n\n- Contact -\n${contactLines.join('\n')}`
        : form.description.trim();
      fd.append('description', fullDescription);

      if (form.latitude) fd.append('latitude', form.latitude);
      if (form.longitude) fd.append('longitude', form.longitude);
      fd.append('amenities', JSON.stringify(form.amenities));
      fd.append('features', JSON.stringify(form.features));
      fd.append('badges', JSON.stringify([form.category]));
      fd.append('hasCurfew', String(form.hasCurfew));
      fd.append('roomCapacity', String(form.roomCapacity));
      fd.append('availableBeds', String(form.availableBeds));
      fd.append('isVerified', 'false');

      form.images.forEach(file => fd.append('images', file));

      if (editingPropertyId) {
        const { property: updated } = await apiService.updateProperty(editingPropertyId, fd, token);
        setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
        setSuccessMsg(`"${updated.title}" has been updated.`);
      } else {
        const created = await apiService.createProperty(fd, token);
        setProperties(prev => [created, ...prev]);
        setSuccessMsg(`"${created.title}" has been published.`);
      }
      setIsModalOpen(false);
      setForm(emptyForm);
      setEditingPropertyId(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong publishing your listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (property: Property) => {
    if (!token) return;
    const ok = window.confirm(`Delete "${property.title}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await apiService.deleteProperty(property.id, token);
      setProperties(prev => prev.filter(p => p.id !== property.id));
      toast.success('Listing deleted successfully');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Could not delete the listing');
    }
  };

  const handleResubmit = async (property: Property) => {
    if (!token) return;
    try {
      const { property: updated } = await apiService.resubmitProperty(property.id, token);
      setProperties(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      toast.success('Listing resubmitted for verification successfully');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Could not resubmit the listing');
    }
  };

  // Authoritative access guard. App.tsx also gates this route, but we keep
  // this as a defense-in-depth check in case the component is mounted elsewhere.
  if (!user || user.userType !== 'landlord') {
    return (
      <div style={styles.guardPage}>
        <div style={styles.guardCard}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Landlord access required</h2>
          <p style={{ color: COLORS.gray500, marginTop: 8 }}>
            This area is only available to verified landlord accounts.
          </p>
          <button onClick={onBackToHome} style={{ ...styles.primaryBtn, marginTop: 20 }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (user && user.userType === 'landlord' && !user.isVerified) {
    return (
      <div style={styles.guardPage}>
        <div style={styles.guardCard}>
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.gray900 }}>
            {user.verificationStatus === 'rejected' ? 'Account Rejected' : 'Account under review'}
          </h2>
          {user.verificationStatus === 'pending' || !user.verificationStatus ? (
            <p style={{ color: COLORS.gray500, marginTop: 8 }}>
              Your landlord account is currently pending verification. Please wait for an admin to verify your Business Permit or ID before you can post properties.
            </p>
          ) : (
            <>
              <p style={{ color: COLORS.red600, marginTop: 8, fontWeight: 600 }}>
                Your landlord application was rejected.
              </p>
              {user.rejectionReason && (
                <p style={{ color: COLORS.gray700, marginTop: 8, background: COLORS.red50, padding: 12, borderRadius: 8 }}>
                  Reason: {user.rejectionReason}
                </p>
              )}
            </>
          )}
          <button onClick={onBackToHome} style={{ ...styles.primaryBtn, marginTop: 20 }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>


      <main style={styles.main}>
        {/* Welcome + CTA */}
        <section style={styles.welcomeRow}>
          <div>
            <p style={styles.eyebrow}>Welcome back, Host!</p>
            <h1 style={styles.welcomeTitle}>Manage your GenSan listings</h1>
            <p style={styles.welcomeSub}>
              Post a new boarding house, transient stay, or apartment - and reach guests looking for a home in GenSan.
            </p>
          </div>
          <button onClick={() => openModal()} style={styles.primaryBtn} aria-label="Post a new property">
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
            <span>Post New Property</span>
          </button>
        </section>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${COLORS.gray200}`, marginBottom: 32 }}>
          <button 
            onClick={() => setActiveTab('listings')}
            style={{ 
              background: 'none', border: 'none', padding: '12px 4px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'listings' ? COLORS.teal700 : COLORS.gray500,
              borderBottom: activeTab === 'listings' ? `3px solid ${COLORS.teal600}` : '3px solid transparent'
            }}
          >
            My Listings
          </button>
          <button 
            onClick={() => setActiveTab('reservations')}
            style={{ 
              background: 'none', border: 'none', padding: '12px 4px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'reservations' ? COLORS.teal700 : COLORS.gray500,
              borderBottom: activeTab === 'reservations' ? `3px solid ${COLORS.teal600}` : '3px solid transparent'
            }}
          >
            Reservations {(reservations.filter(r => r.status === 'pending_landlord_approval' || r.status === 'payment_pending').length > 0) && <span style={{ background: COLORS.red600, color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 12, marginLeft: 8 }}>{reservations.filter(r => r.status === 'pending_landlord_approval' || r.status === 'payment_pending').length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('subscription')}
            style={{ 
              background: 'none', border: 'none', padding: '12px 4px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'subscription' ? COLORS.teal700 : COLORS.gray500,
              borderBottom: activeTab === 'subscription' ? `3px solid ${COLORS.teal600}` : '3px solid transparent'
            }}
          >
            Subscription
          </button>
        </div>

        {activeTab === 'subscription' ? (
          <div style={{ padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${COLORS.gray200}` }}>
            <h2 style={{ marginBottom: 16, color: COLORS.teal800 }}>My Subscription</h2>
            
            <div style={{ padding: 24, background: user?.subscriptionTier === 'premium' ? '#fdf4ff' : user?.subscriptionTier === 'regular' ? '#f0fdf4' : COLORS.red50, borderRadius: 8, border: `1px solid ${user?.subscriptionTier === 'premium' ? '#f5d0fe' : user?.subscriptionTier === 'regular' ? '#bbf7d0' : COLORS.red200}`, marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.gray900, marginBottom: 8, textTransform: 'capitalize' }}>
                Current Tier: {user?.subscriptionTier || 'None'}
              </div>
              <div style={{ fontSize: 15, color: COLORS.gray700 }}>
                {user?.subscriptionExpiry ? `Expires on: ${new Date(user?.subscriptionExpiry).toLocaleDateString()}` : 'Your properties are currently hidden. Please pay the subscription fee.'}
              </div>
            </div>

            <h3 style={{ marginBottom: 12, color: COLORS.gray800 }}>Upgrade or Renew</h3>
            <p style={{ color: COLORS.gray600, lineHeight: 1.6, marginBottom: 24 }}>
              Unlock the ability to post up to 5 properties, get the Verified Badge, and boost your listings to the top of the search results!
            </p>
            <button 
              onClick={() => navigate('/pricing')}
              style={{ background: COLORS.teal600, color: '#fff', border: 'none', padding: '12px 24px', fontSize: 16, fontWeight: 600, borderRadius: 8, cursor: 'pointer' }}
            >
              View Pricing & Upgrade
            </button>
          </div>
        ) : activeTab === 'listings' ? (
          <>
            {/* Stats strip */}
        <section style={styles.statsRow}>
          <StatCard label="Total Listings" value={properties.length} icon="" />
          <StatCard
            label="Approved"
            value={properties.filter(p => getStatus(p) === 'approved').length}
            icon=""
            tint={COLORS.green50}
          />
          <StatCard
            label="Pending Review"
            value={properties.filter(p => getStatus(p) === 'pending').length}
            icon=""
            tint={COLORS.amber50}
          />
          <StatCard
            label="Needs Changes"
            value={properties.filter(p => getStatus(p) === 'rejected').length}
            icon="️"
            tint={COLORS.red50}
          />
        </section>

        {/* My Listings */}
        <section>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>My Listings</h2>
            <span style={styles.sectionCount}>{properties.length} {properties.length === 1 ? 'property' : 'properties'}</span>
          </div>

          {loadError && (
            <div style={styles.alertError}>
              <strong>Couldn't load your listings.</strong> {loadError}
            </div>
          )}

          {loading ? (
            <div style={styles.emptyCard}>
              <div style={styles.spinner} aria-hidden="true" />
              <p style={{ color: COLORS.gray500, marginTop: 12 }}>Loading your listings…</p>
            </div>
          ) : properties.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={{ fontSize: 48 }}></div>
              <h3 style={{ margin: '12px 0 6px', color: COLORS.gray900 }}>No listings yet</h3>
              <p style={{ color: COLORS.gray500, marginBottom: 20, textAlign: 'center', maxWidth: 360 }}>
                Get your first property in front of guests this week. It only takes a couple of minutes.
              </p>
              <button onClick={() => openModal()} style={styles.primaryBtn}>+ Post your first listing</button>
            </div>
          ) : (
            <div style={styles.grid}>
              {properties.map(p => (
                <ListingCard
                  key={p.id}
                  property={p}
                  onEdit={() => openModal(p)}
                  onDelete={() => handleDelete(p)}
                  onResubmit={() => handleResubmit(p)}
                />
              ))}
            </div>
          )}
        </section>
        </>
        ) : (
          <section>
            <div style={styles.sectionHead}>
              <h2 style={styles.sectionTitle}>Incoming Reservations</h2>
            </div>
            {loadingReservations ? (
              <div style={styles.emptyCard}>Loading reservations...</div>
            ) : reservations.length === 0 ? (
              <div style={styles.emptyCard}>No reservations found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reservations.map(res => (
                  <div key={res.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 20, border: `1px solid ${COLORS.gray200}`, borderRadius: 12, padding: 20, background: '#fff' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0' }}>{res.propertyId?.title}</h3>
                      <p style={{ margin: '0 0 4px 0', color: COLORS.gray600 }}><strong>Guest:</strong> {res.studentId?.fullName}</p>
                      <p style={{ margin: '0 0 4px 0', color: COLORS.gray600 }}><strong>Move-in:</strong> {new Date(res.moveInDate).toLocaleDateString()}</p>
                      <p style={{ margin: '0 0 4px 0', color: COLORS.gray600 }}><strong>Duration:</strong> {res.durationMonths} {res.durationMonths === 1 ? 'Month' : 'Months'}</p>
                      <p style={{ margin: '0 0 16px 0', color: COLORS.gray600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong>Deposit Paid:</strong> ₱{res.totalPrice.toLocaleString()}
                        {res.status !== 'payment_pending' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polyline points="20 6 9 17 4 12"></polyline></svg>
                            VERIFIED BY PAYMONGO
                          </span>
                        )}
                      </p>
                      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, background: res.status === 'pending_landlord_approval' ? COLORS.amber50 : res.status === 'approved' ? COLORS.green50 : COLORS.gray100, color: res.status === 'pending_landlord_approval' ? COLORS.amber700 : res.status === 'approved' ? COLORS.green700 : COLORS.gray700 }}>
                        {res.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    {res.status === 'pending_landlord_approval' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                        <button 
                          onClick={async () => {
                            try {
                              await apiService.updateBookingStatus(res.id, 'approved', token);
                              setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: 'approved' } : r));
                              setSuccessMsg('Reservation approved!');
                            } catch { toast.error('Failed to update subscription.'); }
                          }}
                          style={{ padding: '10px 20px', background: COLORS.green600, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                        >Approve</button>
                        <button 
                          onClick={async () => {
                            try {
                              await apiService.updateBookingStatus(res.id, 'rejected', token);
                              setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: 'rejected' } : r));
                              setSuccessMsg('Reservation rejected.');
                            } catch { toast.error('Failed to update status.'); }
                          }}
                          style={{ padding: '10px 20px', background: COLORS.red50, color: COLORS.red700, border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                        >Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Post Property Modal */}
      {isModalOpen && (
        <PostPropertyModal
          isEditing={!!editingPropertyId}
          form={form}
          errors={errors}
          submitting={submitting}
          submitError={submitError}
          isDraggingFile={isDraggingFile}
          fileInputRef={fileInputRef}
          onFieldChange={updateField}
          onToggleAmenity={toggleAmenity}
          onAddFiles={addFiles}
          onRemoveImage={removeImage}
          onDragOverChange={setIsDraggingFile}
          onDrop={onDrop}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {/* Success toast */}
      {successMsg && (
        <div role="status" aria-live="polite" style={styles.toast}>
          <span style={{ fontSize: 18 }}></span>
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};

// ---------- Sub-components ----------

const StatCard: React.FC<{ label: string; value: number; icon: string; tint?: string }> = ({ label, value, icon, tint }) => (
  <div style={{ ...styles.statCard, background: tint ?? '#fff' }}>
    <div style={{ fontSize: 24 }}>{icon}</div>
    <div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const ListingCard: React.FC<{
  property: Property;
  onEdit: () => void;
  onDelete: () => void;
  onResubmit: () => void;
}> = ({ property, onEdit, onDelete, onResubmit }) => {
  const period = property.period || 'month';
  const status = getStatus(property);
  const meta = statusMeta[status];
  return (
    <article style={styles.card}>
      <div style={styles.cardImageWrap}>
        {property.images && property.images.length > 0 ? (
          <img src={property.images[0]} alt={property.title} style={styles.cardImage} />
        ) : (
          <div style={styles.cardImagePlaceholder}> No image</div>
        )}
        <span
          style={{
            ...styles.statusBadge,
            background: meta.bg,
            color: meta.color,
            border: `1px solid ${meta.border}`
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: meta.color
          }} />
          {meta.label}
        </span>
      </div>
      <div style={styles.cardBody}>
        <h3 style={styles.cardTitle}>{property.title}</h3>
        <p style={styles.cardArea}> {property.area}</p>
        <p style={styles.cardPrice}>
          ₱{Number(property.price).toLocaleString()}
          <span style={styles.cardPeriod}>/{period}</span>
        </p>
        <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: property.availableBeds === 0 ? COLORS.red50 : COLORS.teal50, borderRadius: '6px', fontSize: '13px', fontWeight: 500, color: property.availableBeds === 0 ? COLORS.red700 : COLORS.teal700, display: 'inline-block' }}>
          {property.availableBeds === 0 ? 'Fully Occupied' : `${property.availableBeds} / ${property.roomCapacity || 1} Beds Available`}
        </div>

        {status === 'rejected' && property.rejectionReason && (
          <div style={styles.rejectBanner}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 16, lineHeight: 1.2 }}>️</span>
              <div>
                <strong style={{ display: 'block', fontSize: 13, color: COLORS.red700, marginBottom: 2 }}>
                  Admin feedback:
                </strong>
                <span style={{ fontSize: 13, color: '#7f1d1d', lineHeight: 1.4 }}>
                  {property.rejectionReason}
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={styles.cardActions}>
          {status === 'rejected' && (
            <button
              onClick={onResubmit}
              style={{ ...styles.primaryBtnSm }}
              aria-label={`Resubmit ${property.title}`}
            >
              ↻ Resubmit
            </button>
          )}
          <button onClick={onEdit} style={{ background: COLORS.teal100, color: COLORS.teal800, padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem' }} aria-label={`Edit ${property.title}`}>
            Edit
          </button>
          <button onClick={onDelete} style={styles.dangerGhostBtn} aria-label={`Delete ${property.title}`}>
            ️ Remove
          </button>
        </div>
      </div>
    </article>
  );
};

interface PostModalProps {
  isEditing?: boolean;
  form: FormState;
  errors: FieldErrors;
  submitting: boolean;
  submitError: string | null;
  isDraggingFile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFieldChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onToggleAmenity: (value: string) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveImage: (index: number) => void;
  onDragOverChange: (dragging: boolean) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AnimatedDropdown: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}> = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];
  
  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div 
        className="hub-input-animated"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px 14px', borderRadius: 10, border: `1px solid ${COLORS.gray300}`, background: '#fff' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ fontSize: 15, color: COLORS.gray900 }}>{selected.label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.gray500} strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: '#fff', border: `1px solid ${COLORS.gray200}`, borderRadius: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 50,
          animation: 'modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              style={{
                padding: '12px 14px', cursor: 'pointer',
                background: opt.value === value ? '#f0fdfa' : '#fff',
                color: opt.value === value ? COLORS.teal700 : COLORS.gray700,
                fontWeight: opt.value === value ? 600 : 400,
                fontSize: 15, transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = opt.value === value ? '#f0fdfa' : '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = opt.value === value ? '#f0fdfa' : '#fff'; }}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PostPropertyModal: React.FC<PostModalProps> = ({
  isEditing, form, errors, submitting, submitError, isDraggingFile, fileInputRef,
  onFieldChange, onToggleAmenity, onAddFiles, onRemoveImage, onDragOverChange, onDrop, onClose, onSubmit
}) => {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('hide-chat-widget');
    return () => { 
      document.body.style.overflow = prev; 
      document.body.classList.remove('hide-chat-widget');
    };
  }, []);
          const handleAddFeature = () => {
    onFieldChange('features', [...(form.features || []), { name: '', description: '' }]);
  };

  const handleFeatureChange = (index: number, key: 'name' | 'description', value: string) => {
    const updated = [...(form.features || [])];
    updated[index] = { ...updated[index], [key]: value };
    onFieldChange('features', updated);
  };

  const handleRemoveFeature = (index: number) => {
    onFieldChange('features', (form.features || []).filter((_, i) => i !== index));
  };

  const handleAddQuickStat = () => {
    if ((form.quickStats || []).length >= 4) return;
    onFieldChange('quickStats', [...(form.quickStats || []), { value: '', label: '' }]);
  };

  const handleQuickStatChange = (index: number, key: 'value' | 'label', val: string) => {
    const updated = [...(form.quickStats || [])];
    updated[index] = { ...updated[index], [key]: val };
    onFieldChange('quickStats', updated);
  };

  const handleRemoveQuickStat = (index: number) => {
    const updated = [...(form.quickStats || [])];
    updated.splice(index, 1);
    onFieldChange('quickStats', updated);
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    ...styles.input,
    borderColor: hasError ? COLORS.red600 : COLORS.gray300
  });

  return (
    <div className="hub-modal-overlay" style={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="post-modal-title" onMouseDown={onClose}>
      <div className="hub-modal-content" style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <header className="hub-modal-header-gradient" style={styles.modalHeader}>
          <div>
            <h2 id="post-modal-title" style={{ margin: 0, fontSize: 22, color: COLORS.gray900 }}>{isEditing ? 'Edit property' : 'List a new property'}</h2>
            <p style={{ margin: '4px 0 0', color: COLORS.gray500, fontSize: 14 }}>
              Fill in the details below. Fields marked <span style={{ color: COLORS.red600 }}>*</span> are required.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="hub-modal-close-btn" style={styles.modalCloseBtn} disabled={submitting}>×</button>
        </header>

        <form onSubmit={onSubmit} style={styles.modalBody} noValidate>
          {/* Title */}
          <Field
            label="Property Title"
            required
            help="A clear, descriptive name helps your listing stand out."
            error={errors.title}
          >
            <input
              type="text"
              value={form.title}
              onChange={(e) => onFieldChange('title', e.target.value)}
              placeholder='e.g., "Cozy 2-BR Apartment near MSU GenSan"'
              className="hub-input-animated"
              style={inputStyle(!!errors.title)}
              maxLength={60}
            />
          </Field>

          {/* Category pills */}
          <Field
            label="Property Category"
            required
            help="Choose the option that best describes your space."
          >
            <div style={styles.pillRow}>
              {CATEGORIES.map(c => {
                const active = form.category === c;
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => onFieldChange('category', c)}
                    className={`hub-category-pill ${active ? 'active-pill' : ''}`}
                    style={{
                      ...styles.pill,
                      background: active ? COLORS.teal600 : '#fff',
                      color: active ? '#fff' : COLORS.gray700,
                      borderColor: active ? COLORS.teal600 : COLORS.gray300,
                      fontWeight: active ? 600 : 500
                    }}
                    aria-pressed={active}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Pricing row */}
          <div style={styles.row2}>
            <Field
              label="Price"
              required
              help="Enter the rental amount in Philippine Peso (₱)."
              error={errors.price}
            >
              <div className="hub-input-animated" style={{
                ...styles.input,
                display: 'flex',
                alignItems: 'center',
                padding: 0,
                overflow: 'hidden',
                borderColor: errors.price ? COLORS.red600 : COLORS.gray300
              }}>
                <span style={styles.currencyPrefix}>₱</span>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => onFieldChange('price', e.target.value)}
                  placeholder="e.g., 4500"
                  style={{ ...styles.input, border: 'none', flex: 1, padding: '12px 14px', boxShadow: 'none' }}
                />
              </div>
            </Field>

            <Field label="Billing cycle" required>
              <AnimatedDropdown
                value={form.period}
                onChange={(val) => onFieldChange('period', val as Period)}
                options={[
                  { value: 'month', label: 'Per month' },
                  { value: 'night', label: 'Per night' }
                ]}
              />
            </Field>
          </div>

          {/* Capacity & Availability */}
          <div style={styles.row2}>
            <Field label="Room Capacity (Max Beds)" help="Total beds in the room/property.">
              <input
                type="number"
                min={1}
                value={form.roomCapacity}
                onChange={(e) => onFieldChange('roomCapacity', e.target.value === '' ? '' : Number(e.target.value))}
                style={styles.input}
              />
            </Field>

            <Field label="Available Beds" help="Currently vacant beds.">
              <input
                type="number"
                min={0}
                max={typeof form.roomCapacity === 'number' ? form.roomCapacity : undefined}
                value={form.availableBeds}
                onChange={(e) => onFieldChange('availableBeds', e.target.value === '' ? '' : Number(e.target.value))}
                className="hub-input-animated"
                style={styles.input}
              />
            </Field>
          </div>

          <Field label="Curfew Rule" help="Does this property enforce a curfew?">
            <label className="hub-checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={form.hasCurfew}
                onChange={(e) => onFieldChange('hasCurfew', e.target.checked)}
                style={{ width: 18, height: 18, accentColor: COLORS.teal600 }}
              />
              <span style={{ fontSize: 15, fontWeight: 500 }}>Yes, this property has a curfew</span>
            </label>
          </Field>

          {/* Location */}
          <Field
            label="Exact Address"
            required
            help="Street name, barangay, city - visible only on the listing."
            error={errors.address}
          >
            <input
              type="text"
              value={form.address}
              onChange={(e) => onFieldChange('address', e.target.value)}
              placeholder="e.g., Purok Maharlika, Brgy. Labangal, General Santos City"
              className="hub-input-animated"
              style={inputStyle(!!errors.address)}
              maxLength={100}
            />
          </Field>

          <Field
            label="Nearby Landmarks"
            required
            help="What's within walking distance? Schools, malls, terminals…"
            error={errors.landmarks}
          >
            <input
              type="text"
              value={form.landmarks}
              onChange={(e) => onFieldChange('landmarks', e.target.value)}
              placeholder='e.g., "Walking distance to Notre Dame of Dadiangas University, near KCC Mall"'
              className="hub-input-animated"
              style={inputStyle(!!errors.landmarks)}
              maxLength={100}
            />
          </Field>

          {/* Map picker */}
          <Field
            label="Map Location"
            help="Click on the map to drop a pin at the exact location of your boarding house."
          >
            <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden', zIndex: 0, border: '1px solid ' + COLORS.gray300 }}>
              <MapContainer center={[6.1164, 125.1716]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker 
                  position={form.latitude && form.longitude ? [Number(form.latitude), Number(form.longitude)] : null} 
                  setPosition={(pos) => {
                    onFieldChange('latitude', String(pos[0]));
                    onFieldChange('longitude', String(pos[1]));
                  }} 
                />
              </MapContainer>
            </div>
            {form.latitude && form.longitude && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: COLORS.teal700 }}>
                ✓ Location pinned at {Number(form.latitude).toFixed(4)}, {Number(form.longitude).toFixed(4)}
              </div>
            )}
          </Field>

          {/* Image upload */}
          <Field
            label="Photos"
            required={!isEditing}
            help={isEditing ? "Leave empty to keep existing photos, or upload new ones to replace them." : "The first photo is shown as the cover. Up to 8 images."}
            error={errors.images}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); onDragOverChange(true); }}
              onDragLeave={() => onDragOverChange(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              className="hub-dropzone-animated"
              style={{
                ...styles.dropzone,
                borderColor: errors.images
                  ? COLORS.red600
                  : isDraggingFile ? COLORS.teal600 : COLORS.gray300,
                background: isDraggingFile ? COLORS.teal50 : COLORS.gray50
              }}
            >
              <div style={{ fontSize: 32 }}></div>
              <div style={{ fontWeight: 600, color: COLORS.gray700 }}>
                {isDraggingFile ? 'Drop to upload' : 'Drag & drop photos here'}
              </div>
              <div style={{ color: COLORS.gray500, fontSize: 13 }}>
                or <span style={{ color: COLORS.teal700, textDecoration: 'underline' }}>browse from your device</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => { if (e.target.files) onAddFiles(e.target.files); e.target.value = ''; }}
                style={{ display: 'none' }}
              />
            </div>

            {form.images.length > 0 && (
              <div style={styles.previewGrid}>
                {form.images.map((file, idx) => (
                  <div key={idx} style={styles.previewItem}>
                    <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} style={styles.previewImg} />
                    {idx === 0 && <span style={styles.coverTag}>Cover</span>}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onRemoveImage(idx); }}
                      style={styles.previewRemove}
                      aria-label={`Remove image ${idx + 1}`}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          {/* Description */}
          <Field
            label="Property Description"
            required
            help="Tell guests what makes your place a great stay."
            error={errors.description}
          >
            <textarea
              value={form.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              placeholder="Describe the room, the neighborhood, house rules, and anything that makes it feel like home…"
              rows={5}
              className="hub-input-animated"
              style={{ ...inputStyle(!!errors.description), resize: 'vertical', fontFamily: 'inherit' }}
              maxLength={800}
            />
          </Field>

          {/* Amenities */}
          <Field label="Amenities" help="Pick everything that applies. You can update these later.">
            <div style={styles.amenitiesGrid}>
              {AMENITY_OPTIONS.map(opt => {
                const checked = form.amenities.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    style={{
                      ...styles.amenityChip,
                      background: checked ? COLORS.teal50 : '#fff',
                      borderColor: checked ? COLORS.teal600 : COLORS.gray300,
                      color: checked ? COLORS.teal700 : COLORS.gray700
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleAmenity(opt.value)}
                      style={{ accentColor: COLORS.teal600, width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </Field>

          {/* Dynamic Features */}
          <Field label="Detailed Features" help="Add custom features with your own descriptions (e.g. WiFi: 50Mbps Fiber, Bed: Single bed with mattress).">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {form.features?.map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <input
                    type="text"
                    value={feat.name}
                    onChange={(e) => handleFeatureChange(idx, 'name', e.target.value)}
                    placeholder="Feature (e.g. WiFi)"
                    className="hub-input-animated"
                    style={{ ...inputStyle(false), flex: '1', minWidth: '120px' }}
                  />
                  <input
                    type="text"
                    value={feat.description}
                    onChange={(e) => handleFeatureChange(idx, 'description', e.target.value)}
                    placeholder="Description (e.g. Fast fiber connection)"
                    className="hub-input-animated"
                    style={{ ...inputStyle(false), flex: '2' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    style={{ ...styles.dangerGhostBtn, padding: '12px 16px', marginTop: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddFeature}
                style={{ ...styles.ghostBtn, alignSelf: 'flex-start', padding: '8px 16px', fontSize: '0.9rem' }}
              >
                + Add Feature
              </button>
            </div>
          </Field>

          {/* Quick Stats */}
          <Field label="Quick Highlights (Stats Strip)" help="Add up to 4 quick highlights to show in the premium stats strip (e.g. 5 Mins, Walking Distance).">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {form.quickStats?.map((stat, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => handleQuickStatChange(idx, 'value', e.target.value)}
                    placeholder="Short Title (e.g. 5 Mins)"
                    className="hub-input-animated"
                    style={{ ...inputStyle(false), flex: '1', minWidth: '120px' }}
                    maxLength={15}
                  />
                  <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => handleQuickStatChange(idx, 'label', e.target.value)}
                    placeholder="Subtitle (e.g. Walking Distance)"
                    className="hub-input-animated"
                    style={{ ...inputStyle(false), flex: '2' }}
                    maxLength={30}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveQuickStat(idx)}
                    style={{ ...styles.dangerGhostBtn, padding: '12px 16px', marginTop: 0 }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {(form.quickStats?.length || 0) < 4 && (
                <button
                  type="button"
                  onClick={handleAddQuickStat}
                  style={{ ...styles.ghostBtn, alignSelf: 'flex-start', padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  + Add Highlight
                </button>
              )}
            </div>
          </Field>
          <div style={styles.row2}>
            <Field
              label="Phone Number"
              help="Mobile or landline. Will be visible to interested guests."
              error={errors.phone}
            >
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => onFieldChange('phone', e.target.value)}
                placeholder="e.g., 0917 123 4567"
                className="hub-input-animated"
                style={inputStyle(!!errors.phone)}
                maxLength={20}
              />
            </Field>

            <Field
              label="Messenger Link"
              help="Paste your m.me/ link or Facebook profile URL."
            >
              <input
                type="url"
                value={form.messenger}
                onChange={(e) => onFieldChange('messenger', e.target.value)}
                placeholder="e.g., https://m.me/yourpage"
                className="hub-input-animated"
                style={inputStyle(false)}
                maxLength={100}
              />
            </Field>
          </div>

          {submitError && (
            <div style={styles.alertError}>
              <strong>Couldn't publish your listing.</strong> {submitError}
            </div>
          )}

          <div style={styles.modalFooter}>
            <button type="button" onClick={onClose} className="hub-animated-ghost-btn" style={styles.ghostBtn} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="hub-animated-primary-btn" style={styles.primaryBtn} disabled={submitting}>
              {submitting ? 'Publishing…' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, help, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={styles.fieldLabel}>
      {label}
      {required && <span style={{ color: COLORS.red600, marginLeft: 4 }}>*</span>}
    </label>
    {children}
    {error ? (
      <span style={styles.errorText}> {error}</span>
    ) : help ? (
      <span style={styles.helpText}>{help}</span>
    ) : null}
  </div>
);

function LocationPicker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// ---------- Styles ----------

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: COLORS.gray50,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: COLORS.gray900,
    paddingTop: 100
  },
  topbar: {
    position: 'sticky',
    top: 20,
    maxWidth: 1200,
    margin: '20px auto 32px',
    zIndex: 50,
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
  },
  topbarInner: {
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap'
  },
  logoLink: { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: COLORS.gray900 },
  logoText: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' },
  logoBadge: {
    fontSize: 12, fontWeight: 600, padding: '4px 10px',
    background: COLORS.teal50, color: COLORS.teal700,
    borderRadius: 999, border: `1px solid ${COLORS.teal100}`
  },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  userChip: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 12px 6px 6px', background: COLORS.gray100,
    borderRadius: 999, fontSize: 14, color: COLORS.gray700
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: COLORS.teal600, color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 13
  },

  main: { maxWidth: 1600, margin: '0 auto', padding: '32px 20px 80px' },

  welcomeRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 24, flexWrap: 'wrap', marginBottom: 32,
    background: 'linear-gradient(160deg, #134e4a 0%, #0f766e 40%, #14b8a6 100%)',
    padding: '40px 32px', borderRadius: 24,
    boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
  },
  eyebrow: {
    margin: 0, color: '#ccfbf1',
    fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase'
  },
  welcomeTitle: { margin: '4px 0 8px', fontSize: 'clamp(1.7rem, 3.4vw, 2.2rem)', fontWeight: 800, color: '#fff' },
  welcomeSub: { margin: 0, color: 'rgba(255,255,255,0.8)', maxWidth: 620, lineHeight: 1.55 },

  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16, marginBottom: 36
  },
  statCard: {
    border: `1px solid ${COLORS.gray200}`, borderRadius: 14,
    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  statValue: { fontSize: 24, fontWeight: 800, color: COLORS.gray900, lineHeight: 1 },
  statLabel: { fontSize: 13, color: COLORS.gray500, marginTop: 4 },

  sectionHead: {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
    gap: 12, marginBottom: 16, flexWrap: 'wrap'
  },
  sectionTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: COLORS.gray900 },
  sectionCount: { color: COLORS.gray500, fontSize: 14 },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20
  },
  card: {
    background: '#fff', borderRadius: 14, overflow: 'hidden',
    border: `1px solid ${COLORS.gray200}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    display: 'flex', flexDirection: 'column',
    transition: 'transform .2s ease, box-shadow .2s ease'
  },
  cardImageWrap: { position: 'relative', height: 180, background: COLORS.gray100 },
  cardImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  cardImagePlaceholder: {
    width: '100%', height: '100%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: COLORS.gray400, fontSize: 14
  },
  statusBadge: {
    position: 'absolute', top: 12, left: 12,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600
  },
  cardBody: { padding: 16, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: COLORS.gray900, lineHeight: 1.3 },
  cardArea: { margin: '2px 0 0', color: COLORS.gray500, fontSize: 13 },
  cardPrice: {
    margin: '10px 0 0', color: COLORS.teal700, fontSize: 18, fontWeight: 800
  },
  cardPeriod: { color: COLORS.gray500, fontSize: 13, fontWeight: 500, marginLeft: 2 },
  cardActions: { marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8 },

  emptyCard: {
    background: '#fff', border: `1px dashed ${COLORS.gray300}`, borderRadius: 14,
    padding: '48px 24px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center'
  },

  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '12px 22px', background: COLORS.teal600, color: '#fff',
    border: 'none', borderRadius: 12, cursor: 'pointer',
    fontSize: 15, fontWeight: 600,
    boxShadow: '0 4px 12px rgba(13,148,136,0.25)',
    transition: 'background .2s, transform .1s'
  },
  ghostBtn: {
    padding: '10px 18px', background: '#fff', color: COLORS.gray700,
    border: `1px solid ${COLORS.gray300}`, borderRadius: 10, cursor: 'pointer',
    fontSize: 14, fontWeight: 500
  },
  dangerGhostBtn: {
    flex: 1, padding: '9px 12px', background: '#fff', color: COLORS.red600,
    border: `1px solid #fecaca`, borderRadius: 10, cursor: 'pointer',
    fontSize: 13, fontWeight: 500
  },
  primaryBtnSm: {
    flex: 1, padding: '9px 12px', background: COLORS.teal600, color: '#fff',
    border: 'none', borderRadius: 10, cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
    boxShadow: '0 2px 6px rgba(13,148,136,0.25)'
  },
  rejectBanner: {
    marginTop: 10, padding: '10px 12px',
    background: COLORS.red50, border: `1px solid #fecaca`,
    borderRadius: 10
  },

  alertError: {
    padding: '12px 16px', background: COLORS.red50,
    border: `1px solid #fecaca`, borderRadius: 10,
    color: '#991b1b', fontSize: 14, marginBottom: 16
  },

  spinner: {
    width: 32, height: 32, borderRadius: '50%',
    border: `3px solid ${COLORS.gray200}`, borderTopColor: COLORS.teal600,
    animation: 'spin 1s linear infinite'
  },

  // Modal
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
    backdropFilter: 'blur(4px)', zIndex: 100,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '24px 16px', overflowY: 'auto'
  },
  modal: {
    width: '100%', maxWidth: 720, background: '#fff', borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column'
  },
  modalHeader: {
    padding: '20px 24px', borderBottom: `1px solid ${COLORS.gray200}`,
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16
  },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 10, border: 'none',
    background: COLORS.gray100, color: COLORS.gray700, cursor: 'pointer',
    fontSize: 22, lineHeight: 1
  },
  modalBody: { padding: 24, display: 'flex', flexDirection: 'column', gap: 18 },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: 10,
    paddingTop: 8, borderTop: `1px solid ${COLORS.gray100}`, marginTop: 4
  },

  // Fields
  fieldLabel: { fontSize: 14, fontWeight: 600, color: COLORS.gray700 },
  helpText: { fontSize: 12.5, color: COLORS.gray500 },
  errorText: { fontSize: 12.5, color: COLORS.red600, fontWeight: 500 },
  input: {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 14px', borderRadius: 10,
    border: `1px solid ${COLORS.gray300}`, background: '#fff',
    fontSize: 15, color: COLORS.gray900, outline: 'none',
    transition: 'border-color .15s, box-shadow .15s'
  },
  currencyPrefix: {
    padding: '0 14px', fontSize: 16, fontWeight: 600,
    color: COLORS.gray500, borderRight: `1px solid ${COLORS.gray200}`
  },
  row2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 },

  pillRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  pill: {
    padding: '10px 16px', borderRadius: 999, border: `1px solid ${COLORS.gray300}`,
    background: '#fff', color: COLORS.gray700, fontSize: 14, cursor: 'pointer'
  },

  dropzone: {
    border: `2px dashed ${COLORS.gray300}`, borderRadius: 12,
    padding: '28px 16px', textAlign: 'center', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    transition: 'border-color .15s, background .15s'
  },
  previewGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: 10, marginTop: 12
  },
  previewItem: {
    position: 'relative', borderRadius: 10, overflow: 'hidden',
    border: `1px solid ${COLORS.gray200}`, aspectRatio: '4 / 3', background: COLORS.gray100
  },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  previewRemove: {
    position: 'absolute', top: 6, right: 6,
    width: 24, height: 24, borderRadius: '50%',
    border: 'none', background: 'rgba(15,23,42,0.7)', color: '#fff',
    cursor: 'pointer', fontSize: 16, lineHeight: 1
  },
  coverTag: {
    position: 'absolute', top: 6, left: 6,
    background: COLORS.teal600, color: '#fff',
    padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600
  },

  amenitiesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10
  },
  amenityChip: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', border: `1px solid ${COLORS.gray300}`,
    borderRadius: 10, cursor: 'pointer', fontSize: 14
  },

  // Toast
  toast: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 200,
    background: '#fff', color: COLORS.gray900,
    border: `1px solid ${COLORS.gray200}`, borderLeft: `4px solid ${COLORS.green600}`,
    borderRadius: 12, padding: '14px 18px',
    display: 'flex', alignItems: 'center', gap: 10,
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)', maxWidth: 360
  },

  // Guard
  guardPage: {
    minHeight: '100vh', background: COLORS.gray50,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
  },
  guardCard: {
    background: '#fff', borderRadius: 16, padding: 32,
    border: `1px solid ${COLORS.gray200}`, textAlign: 'center', maxWidth: 420,
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
  }
};
