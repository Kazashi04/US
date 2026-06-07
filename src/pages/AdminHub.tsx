import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import type { Property } from '../types';

interface AdminHubProps {
  onBackToHome: () => void;
}

type Tab = 'overview' | 'queue' | 'landlords';
type QueueFilter = 'pending' | 'all';

interface AdminStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  landlords: number;
}

const COLORS = {
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal50: '#f0fdfa',
  teal100: '#ccfbf1',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray700: '#334155',
  gray900: '#0f172a',
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber600: '#d97706',
  amber700: '#b45309',
  red50: '#fef2f2',
  red100: '#fee2e2',
  red600: '#dc2626',
  red700: '#b91c1c',
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green600: '#16a34a',
  green700: '#15803d',
  indigo600: '#4f46e5',
  indigo50: '#eef2ff'
};

const statusMeta: Record<NonNullable<Property['verificationStatus']>, { label: string; bg: string; color: string; border: string }> = {
  pending: { label: 'Pending', bg: COLORS.amber50, color: COLORS.amber700, border: '#fde68a' },
  approved: { label: 'Approved', bg: COLORS.green50, color: COLORS.green700, border: '#bbf7d0' },
  rejected: { label: 'Rejected', bg: COLORS.red50, color: COLORS.red700, border: '#fecaca' }
};

const getStatus = (p: Property): NonNullable<Property['verificationStatus']> =>
  p.verificationStatus || (p.isVerified ? 'approved' : 'pending');

const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
};

const getLandlord = (p: Property) => {
  if (p.landlordId && typeof p.landlordId === 'object') return p.landlordId;
  return null;
};

export const AdminHub: React.FC<AdminHubProps> = ({ onBackToHome }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('overview');
  const [filter, setFilter] = useState<QueueFilter>('pending');
  const [listings, setListings] = useState<Property[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Property | null>(null);
  const [selectedLandlord, setSelectedLandlord] = useState<any | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [landlords, setLandlords] = useState<any[]>([]);
  const [rejectionDraft, setRejectionDraft] = useState('');
  const [showRejectField, setShowRejectField] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);



  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const [items, s, l] = await Promise.all([
        apiService.getAdminListings(token, filter === 'pending' ? 'pending' : undefined),
        apiService.getAdminStats(token),
        apiService.getAdminLandlords(token, filter === 'pending' ? 'pending' : undefined)
      ]);
      setListings(items);
      setStats(s);
      setLandlords(l);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data');
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const closePanel = useCallback(() => {
    if (actionBusy) return;
    setSelected(null);
    setSelectedLandlord(null);
    setRejectionDraft('');
    setShowRejectField(false);
  }, [actionBusy]);

  const openPanel = (p: Property) => {
    setSelected(p);
    setRejectionDraft('');
    setShowRejectField(false);
  };

  const openLandlordPanel = (l: any) => {
    setSelectedLandlord(l);
    setRejectionDraft('');
    setShowRejectField(false);
  };

  // Esc closes side panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (selected || selectedLandlord)) closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, selectedLandlord, closePanel]);

  const refreshAfterAction = async (updated: Property) => {
    // Reload counters
    if (token) {
      try { setStats(await apiService.getAdminStats(token)); } catch { /* non-fatal */ }
    }
    // Update or remove from current list
    setListings(prev => {
      const status = getStatus(updated);
      if (filter === 'pending' && status !== 'pending') {
        return prev.filter(p => p.id !== updated.id);
      }
      return prev.map(p => (p.id === updated.id ? updated : p));
    });
    // Update or close the panel
    if (filter === 'pending' && getStatus(updated) !== 'pending') {
      setSelected(null);
    } else {
      setSelected(updated);
    }
  };

  const handleApprove = async (p: Property) => {
    if (!token) return;
    setActionBusy(true);
    try {
      const { property } = await apiService.approveListing(p.id, token);
      setToast({ kind: 'success', msg: `Approved "${property.title}"` });
      await refreshAfterAction(property);
    } catch (err) {
      setToast({ kind: 'error', msg: err instanceof Error ? err.message : 'Could not approve' });
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async (p: Property) => {
    if (!token) return;
    if (!rejectionDraft.trim()) {
      setShowRejectField(true);
      return;
    }
    setActionBusy(true);
    try {
      const { property } = await apiService.rejectListing(p.id, rejectionDraft.trim(), token);
      setToast({ kind: 'success', msg: `Rejected "${property.title}"` });
      setShowRejectField(false);
      setRejectionDraft('');
      await refreshAfterAction(property);
    } catch (err) {
      setToast({ kind: 'error', msg: err instanceof Error ? err.message : 'Could not reject' });
    } finally {
      setActionBusy(false);
    }
  };

  const refreshLandlordAfterAction = async (updated: any) => {
    if (token) {
      try { setStats(await apiService.getAdminStats(token)); } catch { /* non-fatal */ }
    }
    setLandlords(prev => {
      const status = updated.verificationStatus || 'pending';
      if (filter === 'pending' && status !== 'pending') {
        return prev.filter(l => (l.id || l._id) !== (updated.id || updated._id));
      }
      return prev.map(l => ((l.id || l._id) === (updated.id || updated._id) ? updated : l));
    });
    if (filter === 'pending' && updated.verificationStatus !== 'pending') {
      setSelectedLandlord(null);
    } else {
      setSelectedLandlord(updated);
    }
  };

  const handleApproveLandlord = async (l: any) => {
    if (!token) return;
    setActionBusy(true);
    try {
      const landlordId = l.id || l._id;
      const { user } = await apiService.approveLandlord(landlordId, token);
      setToast({ kind: 'success', msg: `Approved landlord "${(user as any).fullName}"` });
      await refreshLandlordAfterAction(user);
    } catch (err) {
      setToast({ kind: 'error', msg: err instanceof Error ? err.message : 'Could not approve' });
    } finally {
      setActionBusy(false);
    }
  };

  const handleRejectLandlord = async (l: any) => {
    if (!token) return;
    if (!rejectionDraft.trim()) {
      setShowRejectField(true);
      return;
    }
    setActionBusy(true);
    try {
      const landlordId = l.id || l._id;
      const { user } = await apiService.rejectLandlord(landlordId, rejectionDraft.trim(), token);
      setToast({ kind: 'success', msg: `Rejected landlord "${(user as any).fullName}"` });
      setShowRejectField(false);
      setRejectionDraft('');
      await refreshLandlordAfterAction(user);
    } catch (err) {
      setToast({ kind: 'error', msg: err instanceof Error ? err.message : 'Could not reject' });
    } finally {
      setActionBusy(false);
    }
  };

  const handleUpdateSubscription = async (l: any, tier: 'none' | 'regular' | 'premium') => {
    if (!token) return;
    setActionBusy(true);
    try {
      const landlordId = l.id || l._id;
      const { user } = await apiService.updateLandlordSubscription(landlordId, tier, token);
      setToast({ kind: 'success', msg: `Updated subscription for "${(user as any).fullName}" to ${tier.toUpperCase()}` });
      await refreshLandlordAfterAction(user);
    } catch (err) {
      setToast({ kind: 'error', msg: err instanceof Error ? err.message : 'Could not update subscription' });
    } finally {
      setActionBusy(false);
    }
  };

  const pendingFeed = useMemo(
    () => listings.filter(l => getStatus(l) === 'pending').slice(0, 5),
    [listings]
  );

  // Guard
  if (!user || user.userType !== 'admin') {
    return (
      <div style={styles.guardPage}>
        <div style={styles.guardCard}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Admin access required</h2>
          <p style={{ color: COLORS.gray500, marginTop: 8 }}>
            Sign in with the team admin account to manage the platform.
          </p>
          <button onClick={onBackToHome} style={{ ...styles.primaryBtn, marginTop: 20 }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Topbar */}
      <header style={styles.topbar}>
        <div style={styles.topbarInner}>
          <a href="#" onClick={(e) => { e.preventDefault(); onBackToHome(); }} style={styles.logoLink}>
            <span style={styles.logoText}>Uni<span style={{ color: COLORS.teal600 }}>Stay</span></span>
            <span style={styles.logoBadge}>Admin</span>
          </a>
          <div style={styles.topbarRight}>
            <span style={styles.userChip}>
              <span style={styles.avatar}>A</span>
              <span style={{ fontWeight: 500 }}>{user.fullName}</span>
            </span>
            <button onClick={onBackToHome} style={styles.ghostBtn}>Back to site</button>
            <button onClick={() => { logout(); onBackToHome(); }} style={styles.ghostBtn}>Sign out</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav style={styles.tabsBar}>
        <div style={styles.tabsInner}>
          {([
            { id: 'overview', label: 'Overview', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
            { id: 'queue', label: 'Listings Queue', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, badge: stats?.pending ?? 0 },
            { id: 'landlords', label: 'Landlords', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, badge: landlords.filter(l => l.verificationStatus === 'pending').length }
          ] as Array<{ id: Tab; label: string; icon: React.ReactNode; badge?: number }>).map(t => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  ...styles.tabBtn,
                  borderBottomColor: active ? COLORS.teal600 : 'transparent',
                  color: active ? COLORS.teal700 : COLORS.gray500,
                  fontWeight: active ? 700 : 500
                }}
              >
                <span style={{ marginRight: 8 }}>{t.icon}</span>
                {t.label}
                {!!t.badge && t.badge > 0 && (
                  <span style={styles.tabBadge}>{t.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main style={styles.main}>
        {error && (
          <div style={styles.alertError}>
            <strong>Something went wrong.</strong> {error}
          </div>
        )}

        {tab === 'overview' && (
          <Overview
            stats={stats}
            loading={loading}
            pendingFeed={pendingFeed}
            onOpenQueue={() => setTab('queue')}
            onSelect={openPanel}
          />
        )}

        {tab === 'queue' && (
          <Queue
            filter={filter}
            onFilterChange={setFilter}
            listings={listings}
            loading={loading}
            stats={stats}
            selectedId={selected?.id}
            onSelect={openPanel}
          />
        )}

        {tab === 'landlords' && (
          <LandlordsQueue
            filter={filter}
            onFilterChange={setFilter}
            landlords={landlords}
            loading={loading}
            selectedId={selectedLandlord?._id}
            onSelect={openLandlordPanel}
          />
        )}
      </main>

      {/* Side panel */}
      {selected && (
        <ListingPanel
          key={selected.id}
          property={selected}
          busy={actionBusy}
          showRejectField={showRejectField}
          rejectionDraft={rejectionDraft}
          onSetRejectionDraft={setRejectionDraft}
          onShowReject={() => setShowRejectField(true)}
          onCancelReject={() => { setShowRejectField(false); setRejectionDraft(''); }}
          onApprove={() => handleApprove(selected)}
          onReject={() => handleReject(selected)}
          onClose={closePanel}
          onViewProfile={(landlordId) => navigate(`/profile/${landlordId}`)}
          onMessageLandlord={async (landlordId) => {
            try {
              setActionBusy(true);
              const conv = await apiService.startConversation(selected.id, landlordId, token!);
              navigate('/messages', { state: { conversationId: (conv as any).id } });
            } catch (err: any) {
              setToast({ kind: 'error', msg: err.message || 'Failed to start conversation' });
            } finally {
              setActionBusy(false);
            }
          }}
        />
      )}

      {selectedLandlord && (
        <LandlordPanel
          key={selectedLandlord._id}
          landlord={selectedLandlord}
          busy={actionBusy}
          showRejectField={showRejectField}
          rejectionDraft={rejectionDraft}
          onSetRejectionDraft={setRejectionDraft}
          onShowReject={() => setShowRejectField(true)}
          onCancelReject={() => { setShowRejectField(false); setRejectionDraft(''); }}
          onApprove={() => handleApproveLandlord(selectedLandlord)}
          onReject={() => handleRejectLandlord(selectedLandlord)}
          onUpdateSubscription={(tier) => handleUpdateSubscription(selectedLandlord, tier)}
          onClose={closePanel}
          onViewProfile={() => navigate(`/profile/${selectedLandlord._id}`)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            ...styles.toast,
            borderLeftColor: toast.kind === 'success' ? COLORS.green600 : COLORS.red600
          }}
        >
          <span style={{ fontSize: 18 }}>{toast.kind === 'success' ? '' : '️'}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

// ----- Overview tab -----

const Overview: React.FC<{
  stats: AdminStats | null;
  loading: boolean;
  pendingFeed: Property[];
  onOpenQueue: () => void;
  onSelect: (p: Property) => void;
}> = ({ stats, loading, pendingFeed, onOpenQueue, onSelect }) => (
  <>
    <section style={styles.welcomeRow}>
      <div>
        <p style={styles.eyebrow}>Admin Dashboard</p>
        <h1 style={styles.welcomeTitle}>Trust & moderation</h1>
        <p style={styles.welcomeSub}>
          Keep UniStay safe by reviewing new listings, approving the good ones, and explaining clear next steps for the rest.
        </p>
      </div>
      <button onClick={onOpenQueue} className="hub-animated-primary-btn" style={styles.primaryBtn}>
        Open Listings Queue →
      </button>
    </section>

    <section style={styles.statsRow}>
      <StatCard label="Pending Review" value={stats?.pending ?? 0} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.amber600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} tint={COLORS.amber50} accent={COLORS.amber700} />
      <StatCard label="Approved" value={stats?.approved ?? 0} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.green600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} tint={COLORS.green50} accent={COLORS.green700} />
      <StatCard label="Rejected" value={stats?.rejected ?? 0} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.red600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>} tint={COLORS.red50} accent={COLORS.red700} />
      <StatCard label="Total Listings" value={stats?.total ?? 0} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.gray700} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>} />
      <StatCard label="Landlords" value={stats?.landlords ?? 0} icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.indigo600} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} tint={COLORS.indigo50} accent={COLORS.indigo600} />
    </section>

    <section>
      <div style={styles.sectionHead}>
        <h2 style={styles.sectionTitle}>Needs your attention</h2>
        {!!pendingFeed.length && (
          <button onClick={onOpenQueue} style={styles.linkBtn}>See all pending →</button>
        )}
      </div>

      {loading ? (
        <div style={styles.emptyCard}>
          <div style={styles.spinner} aria-hidden="true" />
          <p style={{ color: COLORS.gray500, marginTop: 12 }}>Loading…</p>
        </div>
      ) : pendingFeed.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={{ color: COLORS.teal600, marginBottom: 12 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h3 style={{ margin: '0 0 6px', color: COLORS.gray900 }}>All caught up</h3>
          <p style={{ color: COLORS.gray500, textAlign: 'center', maxWidth: 360 }}>
            No listings are waiting for review right now. Nice work!
          </p>
        </div>
      ) : (
        <div style={styles.feedList}>
          {pendingFeed.map(p => (
            <FeedRow key={p.id} property={p} onClick={() => onSelect(p)} />
          ))}
        </div>
      )}
    </section>
  </>
);

const FeedRow: React.FC<{ property: Property; onClick: () => void }> = ({ property, onClick }) => {
  const landlord = getLandlord(property);
  return (
    <button onClick={onClick} style={styles.feedRow}>
      <div style={styles.feedThumb}>
        {property.images?.[0]
          ? <img src={property.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: COLORS.gray400 }}></span>}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={styles.feedTitle}>{property.title}</div>
        <div style={styles.feedMeta}>
           {property.area} · ₱{Number(property.price).toLocaleString()}/{property.period || 'month'}
          {landlord?.fullName ? ` · by ${landlord.fullName}` : ''}
        </div>
      </div>
      <div style={styles.feedTime}>{timeAgo(property.createdAt)}</div>
      <span style={styles.feedChevron}>›</span>
    </button>
  );
};

// ----- Queue tab -----

const Queue: React.FC<{
  filter: QueueFilter;
  onFilterChange: (f: QueueFilter) => void;
  listings: Property[];
  loading: boolean;
  stats: AdminStats | null;
  selectedId?: string;
  onSelect: (p: Property) => void;
}> = ({ filter, onFilterChange, listings, loading, stats, selectedId, onSelect }) => (
  <>
    <div style={styles.sectionHead}>
      <h2 style={styles.sectionTitle}>Listings Queue</h2>
      <div style={styles.segmented}>
        {([
          { id: 'pending', label: `Pending${stats ? ` (${stats.pending})` : ''}` },
          { id: 'all', label: 'All listings' }
        ] as Array<{ id: QueueFilter; label: string }>).map(s => {
          const active = filter === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onFilterChange(s.id)}
              style={{
                ...styles.segmentedBtn,
                background: active ? '#fff' : 'transparent',
                color: active ? COLORS.gray900 : COLORS.gray500,
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontWeight: active ? 600 : 500
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>

    {loading ? (
      <div style={styles.emptyCard}>
        <div style={styles.spinner} aria-hidden="true" />
        <p style={{ color: COLORS.gray500, marginTop: 12 }}>Loading listings…</p>
      </div>
    ) : listings.length === 0 ? (
      <div style={styles.emptyCard}>
        <div style={{ color: COLORS.gray400, marginBottom: 12 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </div>
        <h3 style={{ margin: '0 0 6px' }}>Nothing here</h3>
        <p style={{ color: COLORS.gray500 }}>
          {filter === 'pending' ? 'No pending listings - you\'re all caught up.' : 'No listings have been submitted yet.'}
        </p>
      </div>
    ) : (
      <div style={styles.queueList}>
        {listings.map(p => (
          <QueueRow
            key={p.id}
            property={p}
            active={p.id === selectedId}
            onClick={() => onSelect(p)}
          />
        ))}
      </div>
    )}
  </>
);

const QueueRow: React.FC<{ property: Property; active: boolean; onClick: () => void }> = ({ property, active, onClick }) => {
  const status = getStatus(property);
  const meta = statusMeta[status];
  const landlord = getLandlord(property);
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.queueRow,
        borderColor: active ? COLORS.teal600 : COLORS.gray200,
        boxShadow: active ? `0 0 0 3px ${COLORS.teal50}` : 'none'
      }}
    >
      <div style={styles.queueThumb}>
        {property.images?.[0]
          ? <img src={property.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ color: COLORS.gray400 }}></span>}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={styles.queueTitleRow}>
          <span style={styles.queueTitle}>{property.title}</span>
          <span style={{ ...styles.pillSmall, background: meta.bg, color: meta.color, borderColor: meta.border }}>
            {meta.label}
          </span>
        </div>
        <div style={styles.queueMeta}> {property.area}</div>
        <div style={styles.queueMeta}>
          ₱{Number(property.price).toLocaleString()}/{property.period || 'month'}
          {landlord?.fullName ? ` · by ${landlord.fullName}` : ''}
          {property.createdAt ? ` · ${timeAgo(property.createdAt)}` : ''}
        </div>
      </div>
      <span style={styles.queueChevron}>›</span>
    </button>
  );
};

// ----- Landlords Queue -----

const LandlordsQueue: React.FC<{
  filter: QueueFilter;
  onFilterChange: (f: QueueFilter) => void;
  landlords: any[];
  loading: boolean;
  selectedId?: string;
  onSelect: (l: any) => void;
}> = ({ filter, onFilterChange, landlords, loading, selectedId, onSelect }) => {
  const pendingCount = landlords.filter(l => l.verificationStatus === 'pending').length;

  return (
  <>
    <div style={styles.sectionHead}>
      <h2 style={styles.sectionTitle}>Landlords Queue</h2>
      <div style={styles.segmented}>
        {([
          { id: 'pending', label: `Pending (${pendingCount})` },
          { id: 'all', label: 'All landlords' }
        ] as Array<{ id: QueueFilter; label: string }>).map(s => {
          const active = filter === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onFilterChange(s.id)}
              style={{
                ...styles.segmentedBtn,
                background: active ? '#fff' : 'transparent',
                color: active ? COLORS.gray900 : COLORS.gray500,
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                fontWeight: active ? 600 : 500
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>

    {loading ? (
      <div style={styles.emptyCard}>
        <div style={styles.spinner} aria-hidden="true" />
        <p style={{ color: COLORS.gray500, marginTop: 12 }}>Loading landlords…</p>
      </div>
    ) : landlords.length === 0 ? (
      <div style={styles.emptyCard}>
        <div style={{ color: COLORS.gray400, marginBottom: 12 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        </div>
        <h3 style={{ margin: '0 0 6px' }}>Nothing here</h3>
        <p style={{ color: COLORS.gray500 }}>
          {filter === 'pending' ? 'No pending landlords - you\'re all caught up.' : 'No landlords registered yet.'}
        </p>
      </div>
    ) : (
      <div style={styles.queueList}>
        {landlords.map(l => (
          <LandlordQueueRow
            key={l._id}
            landlord={l}
            active={l._id === selectedId}
            onClick={() => onSelect(l)}
          />
        ))}
      </div>
    )}
  </>
)};

const LandlordQueueRow: React.FC<{ landlord: any; active: boolean; onClick: () => void }> = ({ landlord, active, onClick }) => {
  const status = landlord.verificationStatus || 'pending';
  const meta = statusMeta[status as NonNullable<Property['verificationStatus']>];
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.queueRow,
        borderColor: active ? COLORS.teal600 : COLORS.gray200,
        boxShadow: active ? `0 0 0 3px ${COLORS.teal50}` : 'none'
      }}
    >
      <div style={{...styles.queueThumb, background: COLORS.indigo50, color: COLORS.indigo600, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700 }}>
        {(landlord.fullName?.[0] || '?').toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={styles.queueTitleRow}>
          <span style={styles.queueTitle}>{landlord.fullName}</span>
          <span style={{ ...styles.pillSmall, background: meta.bg, color: meta.color, borderColor: meta.border }}>
            {meta.label}
          </span>
          {landlord.subscriptionTier === 'premium' && (
            <span style={{ ...styles.pillSmall, background: '#e0e7ff', color: '#4f46e5', borderColor: '#c7d2fe', marginLeft: 8 }}>
              Premium
            </span>
          )}
          {landlord.subscriptionTier === 'regular' && (
            <span style={{ ...styles.pillSmall, background: '#f3f4f6', color: '#4b5563', borderColor: '#e5e7eb', marginLeft: 8 }}>
              Regular
            </span>
          )}
        </div>
        <div style={styles.queueMeta}>{landlord.email} {landlord.phoneNumber ? `· ${landlord.phoneNumber}` : ''}</div>
        <div style={styles.queueMeta}>
          {landlord.createdAt ? `Joined ${timeAgo(landlord.createdAt)}` : ''}
        </div>
      </div>
      <span style={styles.queueChevron}>›</span>
    </button>
  );
};

// ----- Side panel -----

const ListingPanel: React.FC<{
  property: Property;
  busy: boolean;
  showRejectField: boolean;
  rejectionDraft: string;
  onSetRejectionDraft: (s: string) => void;
  onShowReject: () => void;
  onCancelReject: () => void;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
  onViewProfile?: (landlordId: string) => void;
  onMessageLandlord?: (landlordId: string) => void;
}> = ({ property, busy, showRejectField, rejectionDraft, onSetRejectionDraft, onShowReject, onCancelReject, onApprove, onReject, onClose, onViewProfile, onMessageLandlord }) => {
  const status = getStatus(property);
  const meta = statusMeta[status];
  const landlord = getLandlord(property) as any;
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const isDone = status === 'approved' || status === 'rejected';

  return (
    <div style={styles.panelOverlay} onMouseDown={onClose}>
      <aside
        style={styles.panel}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Review ${property.title}`}
      >
        <header style={styles.panelHeader}>
          <button onClick={onClose} aria-label="Close" style={styles.panelClose} disabled={busy}>×</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ ...styles.pillSmall, background: meta.bg, color: meta.color, borderColor: meta.border }}>
              {meta.label}
            </span>
            <h2 style={styles.panelTitle}>{property.title}</h2>
            <div style={styles.panelSub}>
               {property.location || property.area}
            </div>
          </div>
        </header>

        <div style={styles.panelBody}>
          {/* Gallery */}
          <div style={styles.gallery}>
            <div style={styles.galleryHero}>
              {property.images?.[activeImage] ? (
                <img src={property.images[activeImage]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: COLORS.gray400 }}>
                   No photos
                </div>
              )}
            </div>
            {property.images && property.images.length > 1 && (
              <div style={styles.galleryThumbs}>
                {property.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    style={{
                      ...styles.galleryThumb,
                      borderColor: i === activeImage ? COLORS.teal600 : COLORS.gray200
                    }}
                  >
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick facts */}
          <div style={styles.factsGrid}>
            <Fact label="Price">₱{Number(property.price).toLocaleString()}<span style={{ color: COLORS.gray500, fontWeight: 500 }}> /{property.period || 'month'}</span></Fact>
            <Fact label="Category">{property.badges?.[0] || '-'}</Fact>
            <Fact label="Submitted">{timeAgo(property.createdAt) || '-'}</Fact>
            <Fact label="Photos">{property.images?.length ?? 0}</Fact>
          </div>

          {/* Address + landmarks */}
          <Section title="Address">
            <p style={styles.bodyText}>{property.location}</p>
          </Section>
          <Section title="Nearby landmarks">
            <p style={styles.bodyText}>{property.area}</p>
          </Section>

          {/* Description */}
          <Section title="Description">
            <p style={{ ...styles.bodyText, whiteSpace: 'pre-wrap' }}>{property.description}</p>
          </Section>

          {/* Amenities */}
          {!!property.amenities?.length && (
            <Section title="Amenities">
              <div style={styles.amenityChips}>
                {property.amenities.map(a => (
                  <span key={a} style={styles.amenityChip}>{a}</span>
                ))}
              </div>
            </Section>
          )}

          {/* Landlord */}
          {landlord && (
            <Section title="Landlord">
              <div style={styles.landlordCard}>
                <div style={{ ...styles.avatar, width: 36, height: 36, fontSize: 15 }}>
                  {(landlord.fullName?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div 
                    style={{ fontWeight: 600, color: COLORS.teal700, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => onViewProfile && onViewProfile(landlord._id || landlord.id)}
                  >
                    {landlord.fullName || 'Unknown'}
                  </div>
                  <div style={{ color: COLORS.gray500, fontSize: 13 }}>{landlord.email || '—'}</div>
                  {landlord.phoneNumber && (
                    <div style={{ color: COLORS.gray500, fontSize: 13 }}> {landlord.phoneNumber}</div>
                  )}
                  {landlord.verificationStatus && (
                     <div style={{ marginTop: 4 }}>
                       <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: landlord.verificationStatus === 'approved' ? COLORS.green50 : COLORS.amber50, color: landlord.verificationStatus === 'approved' ? COLORS.green700 : COLORS.amber700 }}>
                          {landlord.verificationStatus === 'approved' ? 'Verified Landlord' : 'Pending Verification'}
                       </span>
                     </div>
                  )}
                </div>
                {onMessageLandlord && (
                  <button 
                    onClick={() => onMessageLandlord(landlord._id || landlord.id)}
                    disabled={busy}
                    style={{ padding: '6px 12px', borderRadius: 6, background: COLORS.teal50, color: COLORS.teal700, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                  >
                    Message
                  </button>
                )}
              </div>
            </Section>
          )}

          {/* Previous rejection (if any) */}
          {status === 'rejected' && property.rejectionReason && (
            <Section title="Last rejection reason">
              <div style={styles.rejectionBox}>
                <span style={{ fontSize: 18, marginRight: 8 }}>️</span>
                <span>{property.rejectionReason}</span>
              </div>
            </Section>
          )}

          {/* Reject reason input */}
          {showRejectField && (
            <Section title="Reason for rejection (visible to landlord)">
              <textarea
                value={rejectionDraft}
                onChange={(e) => onSetRejectionDraft(e.target.value)}
                rows={3}
                placeholder="e.g., Photos don't match the listing. Please re-upload clear photos of the actual property."
                style={styles.input}
                maxLength={500}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={onCancelReject} style={styles.ghostBtn} disabled={busy}>Cancel</button>
                <button
                  onClick={onReject}
                  disabled={busy || !rejectionDraft.trim()}
                  style={{ ...styles.dangerBtn, opacity: !rejectionDraft.trim() ? 0.5 : 1 }}
                >
                  {busy ? 'Rejecting…' : 'Confirm rejection'}
                </button>
              </div>
            </Section>
          )}
        </div>

        {/* Sticky actions */}
        {!showRejectField && (
          <footer style={styles.panelFooter}>
            {isDone && status === 'approved' && (
              <div style={styles.doneNote}>
                 Already approved. You can still reject if circumstances change.
              </div>
            )}
            {isDone && status === 'rejected' && (
              <div style={styles.doneNote}>
                 Rejected. The landlord can resubmit after fixing the issue.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                onClick={onShowReject}
                disabled={busy || status === 'rejected'}
                style={{ ...styles.dangerGhostBtn, opacity: status === 'rejected' ? 0.5 : 1 }}
              >
                Reject…
              </button>
              <button
                onClick={onApprove}
                disabled={busy || status === 'approved'}
                className="hub-animated-primary-btn"
                style={{ ...styles.primaryBtn, opacity: status === 'approved' ? 0.5 : 1 }}
              >
                {busy ? 'Saving…' : '✓ Approve listing'}
              </button>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
};

const LandlordPanel: React.FC<{
  landlord: any;
  busy: boolean;
  showRejectField: boolean;
  rejectionDraft: string;
  onSetRejectionDraft: (s: string) => void;
  onShowReject: () => void;
  onCancelReject: () => void;
  onApprove: () => void;
  onReject: () => void;
  onUpdateSubscription?: (tier: 'none' | 'regular' | 'premium') => void;
  onClose: () => void;
  onViewProfile?: () => void;
}> = ({ landlord, busy, showRejectField, rejectionDraft, onSetRejectionDraft, onShowReject, onCancelReject, onApprove, onReject, onUpdateSubscription, onClose, onViewProfile }) => {
  const status = landlord.verificationStatus || 'pending';
  const meta = statusMeta[status as NonNullable<Property['verificationStatus']>];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const isDone = status === 'approved' || status === 'rejected';

  return (
    <div style={styles.panelOverlay} onMouseDown={onClose}>
      <aside
        style={styles.panel}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header style={styles.panelHeader}>
          <button onClick={onClose} aria-label="Close" style={styles.panelClose} disabled={busy}>×</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ ...styles.pillSmall, background: meta.bg, color: meta.color, borderColor: meta.border }}>
              {meta.label}
            </span>
            <h2 
              style={{ ...styles.panelTitle, color: COLORS.teal700, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={onViewProfile}
            >
              {landlord.fullName}
            </h2>
            <div style={styles.panelSub}>
               Landlord Account
            </div>
          </div>
        </header>

        <div style={styles.panelBody}>
          {/* Quick facts */}
          <div style={styles.factsGrid}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Fact label="Email">{landlord.email}</Fact>
            </div>
            <Fact label="Phone">{landlord.phoneNumber || '-'}</Fact>
            <Fact label="Joined">{timeAgo(landlord.createdAt) || '-'}</Fact>
          </div>

          <Section title="Subscription Status">
            <div style={{ padding: 16, background: landlord.subscriptionTier === 'premium' ? '#fdf4ff' : landlord.subscriptionTier === 'regular' ? '#f0fdf4' : COLORS.gray50, border: `1px solid ${landlord.subscriptionTier === 'premium' ? '#f5d0fe' : landlord.subscriptionTier === 'regular' ? '#bbf7d0' : COLORS.gray200}`, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: COLORS.gray900, textTransform: 'capitalize' }}>
                    {landlord.subscriptionTier || 'None'}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.gray500 }}>
                    {landlord.subscriptionExpiry ? `Expires: ${new Date(landlord.subscriptionExpiry).toLocaleDateString()}` : 'No active subscription'}
                  </div>
                </div>
                {landlord.subscriptionTier !== 'none' && onUpdateSubscription && (
                  <button onClick={() => onUpdateSubscription('none')} disabled={busy} style={{ ...styles.dangerGhostBtn, padding: '4px 8px', fontSize: 12 }}>
                    Revoke
                  </button>
                )}
              </div>
              
              {onUpdateSubscription && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onUpdateSubscription('regular')} disabled={busy} style={{ flex: 1, padding: '8px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, fontWeight: 600, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                    +30 Days Regular
                  </button>
                  <button onClick={() => onUpdateSubscription('premium')} disabled={busy} style={{ flex: 1, padding: '8px', background: '#fdf4ff', border: '1px solid #f5d0fe', borderRadius: 6, fontWeight: 600, fontSize: 13, color: '#86198f', cursor: 'pointer' }}>
                    +30 Days Premium
                  </button>
                </div>
              )}
            </div>
          </Section>

          <Section title="Document (Business Permit / ID)">
            {landlord.documentUrl ? (
              <a href={landlord.documentUrl} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{ padding: 16, background: COLORS.gray50, border: `1px solid ${COLORS.gray200}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: COLORS.gray900 }}>View Document</div>
                    <div style={{ fontSize: 13, color: COLORS.gray500 }}>Click to open in new tab</div>
                  </div>
                </div>
              </a>
            ) : (
              <p style={{ color: COLORS.gray500 }}>No document provided.</p>
            )}
          </Section>

          {/* Previous rejection (if any) */}
          {status === 'rejected' && landlord.rejectionReason && (
            <Section title="Last rejection reason">
              <div style={styles.rejectionBox}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>{landlord.rejectionReason}</span>
              </div>
            </Section>
          )}

          {/* Reject reason input */}
          {showRejectField && (
            <Section title="Reason for rejection (visible to landlord)">
              <textarea
                value={rejectionDraft}
                onChange={(e) => onSetRejectionDraft(e.target.value)}
                rows={3}
                placeholder="e.g., The provided ID is blurry or invalid."
                style={styles.input}
                maxLength={500}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={onCancelReject} style={styles.ghostBtn} disabled={busy}>Cancel</button>
                <button
                  onClick={onReject}
                  disabled={busy || !rejectionDraft.trim()}
                  style={{ ...styles.dangerBtn, opacity: !rejectionDraft.trim() ? 0.5 : 1 }}
                >
                  {busy ? 'Rejecting…' : 'Confirm rejection'}
                </button>
              </div>
            </Section>
          )}
        </div>

        {/* Sticky actions */}
        {!showRejectField && (
          <footer style={styles.panelFooter}>
            {isDone && status === 'approved' && (
              <div style={styles.doneNote}>
                 Already approved. You can still reject if circumstances change.
              </div>
            )}
            {isDone && status === 'rejected' && (
              <div style={styles.doneNote}>
                 Rejected. The landlord can re-apply.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                onClick={onShowReject}
                disabled={busy || status === 'rejected'}
                style={{ ...styles.dangerGhostBtn, opacity: status === 'rejected' ? 0.5 : 1 }}
              >
                Reject…
              </button>
              <button
                onClick={onApprove}
                disabled={busy || status === 'approved'}
                className="hub-animated-primary-btn"
                style={{ ...styles.primaryBtn, opacity: status === 'approved' ? 0.5 : 1 }}
              >
                {busy ? 'Saving…' : '✓ Approve landlord'}
              </button>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
};

// ----- Small bits -----

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; tint?: string; accent?: string }> = ({ label, value, icon, tint, accent }) => (
  <div className="admin-stat-card" style={{ ...styles.statCard, background: tint ?? '#fff' }}>
    <div style={{ fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.4)' }}>
      {icon}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ ...styles.statValue, color: accent ?? COLORS.gray900 }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginTop: 18 }}>
    <h4 style={styles.sectionLabel}>{title}</h4>
    {children}
  </div>
);

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={styles.factCard}>
    <div style={styles.factLabel}>{label}</div>
    <div style={styles.factValue}>{children}</div>
  </div>
);

// ----- Styles -----

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: COLORS.gray50,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    color: COLORS.gray900
  },
  topbar: {
    position: 'sticky', top: 0, zIndex: 50,
    background: '#fff', borderBottom: `1px solid ${COLORS.gray200}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  topbarInner: {
    maxWidth: 1280, margin: '0 auto', padding: '14px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 16, flexWrap: 'wrap'
  },
  logoLink: { display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: COLORS.gray900 },
  logoText: { fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' },
  logoBadge: {
    fontSize: 12, fontWeight: 700, padding: '4px 10px',
    background: COLORS.indigo50, color: COLORS.indigo600,
    borderRadius: 999, border: `1px solid #c7d2fe`
  },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  userChip: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '6px 12px 6px 6px', background: COLORS.gray100,
    borderRadius: 999, fontSize: 14, color: COLORS.gray700
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%',
    background: COLORS.indigo600, color: '#fff',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 13
  },

  tabsBar: { background: '#fff', borderBottom: `1px solid ${COLORS.gray200}`, position: 'sticky', top: 64, zIndex: 40 },
  tabsInner: { maxWidth: 1280, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 4 },
  tabBtn: {
    background: 'none', border: 'none',
    padding: '14px 16px', fontSize: 14,
    borderBottom: '3px solid transparent',
    cursor: 'pointer', color: COLORS.gray500,
    display: 'inline-flex', alignItems: 'center', gap: 8
  },
  tabBadge: {
    marginLeft: 8, background: COLORS.amber100, color: COLORS.amber700,
    borderRadius: 999, padding: '2px 8px', fontSize: 12, fontWeight: 700
  },

  main: { maxWidth: 1280, margin: '0 auto', padding: '28px 20px 80px' },

  welcomeRow: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    gap: 24, flexWrap: 'wrap', marginBottom: 24
  },
  eyebrow: { margin: 0, color: COLORS.indigo600, fontSize: 13, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' },
  welcomeTitle: { margin: '4px 0 8px', fontSize: 'clamp(1.7rem, 3.4vw, 2.2rem)', fontWeight: 800 },
  welcomeSub: { margin: 0, color: COLORS.gray500, maxWidth: 640, lineHeight: 1.55 },

  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14, marginBottom: 32
  },
  statCard: {
    border: `1px solid ${COLORS.gray200}`, borderRadius: 14,
    padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
  },
  statValue: { fontSize: 26, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.5px' },
  statLabel: { fontSize: 13, color: COLORS.gray500 },

  sectionHead: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 12, marginBottom: 14, flexWrap: 'wrap'
  },
  sectionTitle: { margin: 0, fontSize: 20, fontWeight: 700 },

  linkBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: COLORS.teal700, fontWeight: 600, fontSize: 14
  },

  segmented: {
    background: COLORS.gray100, borderRadius: 999, padding: 4,
    display: 'inline-flex', gap: 2
  },
  segmentedBtn: {
    border: 'none', borderRadius: 999,
    padding: '8px 14px', fontSize: 13, cursor: 'pointer'
  },

  feedList: { display: 'flex', flexDirection: 'column', gap: 10 },
  feedRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    width: '100%', background: '#fff', border: `1px solid ${COLORS.gray200}`,
    borderRadius: 12, padding: 12, cursor: 'pointer',
    transition: 'box-shadow .15s, border-color .15s, transform .05s'
  },
  feedThumb: {
    width: 56, height: 56, borderRadius: 10, background: COLORS.gray100,
    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0
  },
  feedTitle: { fontWeight: 700, color: COLORS.gray900, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  feedMeta: { color: COLORS.gray500, fontSize: 13, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  feedTime: { color: COLORS.gray400, fontSize: 12, flexShrink: 0 },
  feedChevron: { color: COLORS.gray400, fontSize: 20, flexShrink: 0 },

  queueList: { display: 'flex', flexDirection: 'column', gap: 10 },
  queueRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    width: '100%', background: '#fff', border: `1px solid ${COLORS.gray200}`,
    borderRadius: 12, padding: 12, cursor: 'pointer',
    transition: 'box-shadow .15s, border-color .15s'
  },
  queueThumb: {
    width: 80, height: 64, borderRadius: 10, background: COLORS.gray100,
    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0
  },
  queueTitleRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  queueTitle: { fontWeight: 700, color: COLORS.gray900, fontSize: 15 },
  queueMeta: { color: COLORS.gray500, fontSize: 13, marginTop: 2 },
  queueChevron: { color: COLORS.gray400, fontSize: 22, flexShrink: 0 },

  pillSmall: {
    display: 'inline-flex', alignItems: 'center',
    padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
    border: '1px solid'
  },

  primaryBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '11px 20px', background: COLORS.teal600, color: '#fff',
    border: 'none', borderRadius: 10, cursor: 'pointer',
    fontSize: 14, fontWeight: 600, boxShadow: '0 4px 12px rgba(13,148,136,0.25)'
  },
  ghostBtn: {
    padding: '9px 16px', background: '#fff', color: COLORS.gray700,
    border: `1px solid ${COLORS.gray300}`, borderRadius: 10, cursor: 'pointer',
    fontSize: 13, fontWeight: 500
  },
  dangerBtn: {
    padding: '11px 18px', background: COLORS.red600, color: '#fff',
    border: 'none', borderRadius: 10, cursor: 'pointer',
    fontSize: 14, fontWeight: 600
  },
  dangerGhostBtn: {
    padding: '11px 16px', background: '#fff', color: COLORS.red600,
    border: `1px solid #fecaca`, borderRadius: 10, cursor: 'pointer',
    fontSize: 14, fontWeight: 600
  },

  emptyCard: {
    background: '#fff', border: `1px dashed ${COLORS.gray300}`, borderRadius: 14,
    padding: '48px 24px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center'
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

  // Centered Modal
  panelOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
    backdropFilter: 'blur(4px)', zIndex: 100,
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: '20px' // Mobile safe padding
  },
  panel: {
    width: '100%', maxWidth: 600, maxHeight: '90vh',
    background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column',
    borderRadius: 16, overflow: 'hidden'
  },
  panelHeader: {
    padding: '20px 24px', borderBottom: `1px solid ${COLORS.gray200}`,
    display: 'flex', alignItems: 'flex-start', gap: 14
  },
  panelClose: {
    width: 36, height: 36, borderRadius: 10, border: 'none',
    background: COLORS.gray100, color: COLORS.gray700, cursor: 'pointer',
    fontSize: 22, lineHeight: 1, flexShrink: 0
  },
  panelTitle: { margin: '8px 0 4px', fontSize: 20, fontWeight: 700 },
  panelSub: { color: COLORS.gray500, fontSize: 13 },
  panelBody: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
  panelFooter: {
    padding: '14px 24px', borderTop: `1px solid ${COLORS.gray200}`,
    display: 'flex', alignItems: 'center', gap: 12, background: '#fff'
  },
  doneNote: { color: COLORS.gray500, fontSize: 13 },

  gallery: { display: 'flex', flexDirection: 'column', gap: 8 },
  galleryHero: {
    aspectRatio: '16 / 10', borderRadius: 12, overflow: 'hidden',
    background: COLORS.gray100
  },
  galleryThumbs: { display: 'flex', gap: 8, overflowX: 'auto' },
  galleryThumb: {
    width: 70, height: 56, borderRadius: 8, overflow: 'hidden',
    border: '2px solid', background: COLORS.gray100,
    padding: 0, cursor: 'pointer', flexShrink: 0
  },

  factsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 10, marginTop: 18
  },
  factCard: {
    background: COLORS.gray50, border: `1px solid ${COLORS.gray200}`,
    borderRadius: 10, padding: '10px 12px', minWidth: 0
  },
  factLabel: { fontSize: 11, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 },
  factValue: { fontSize: 16, fontWeight: 700, color: COLORS.gray900, marginTop: 2, overflowWrap: 'break-word' },

  sectionLabel: { margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: COLORS.gray500, textTransform: 'uppercase', letterSpacing: 0.5 },
  bodyText: { margin: 0, color: COLORS.gray700, fontSize: 14.5, lineHeight: 1.6 },

  amenityChips: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  amenityChip: {
    padding: '6px 12px', borderRadius: 999,
    background: COLORS.teal50, color: COLORS.teal700,
    fontSize: 13, fontWeight: 500, border: `1px solid ${COLORS.teal100}`
  },

  landlordCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: 12, background: COLORS.gray50,
    border: `1px solid ${COLORS.gray200}`, borderRadius: 12
  },

  rejectionBox: {
    padding: 14, background: COLORS.red50,
    border: `1px solid #fecaca`, borderRadius: 10,
    color: '#7f1d1d', fontSize: 14, display: 'flex', alignItems: 'flex-start'
  },

  input: {
    width: '100%', boxSizing: 'border-box',
    padding: '11px 14px', borderRadius: 10,
    border: `1px solid ${COLORS.gray300}`, background: '#fff',
    fontSize: 14, color: COLORS.gray900, outline: 'none',
    fontFamily: 'inherit', resize: 'vertical'
  },

  toast: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 200,
    background: '#fff', color: COLORS.gray900,
    border: `1px solid ${COLORS.gray200}`, borderLeft: `4px solid ${COLORS.green600}`,
    borderRadius: 12, padding: '12px 16px',
    display: 'flex', alignItems: 'center', gap: 10,
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)', maxWidth: 360
  },

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
