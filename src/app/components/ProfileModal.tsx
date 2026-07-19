'use client';

import { useState, useEffect } from 'react';
import { X, User, Ticket, LogOut, CheckCircle, Clock, RotateCcw, AlertCircle, IndianRupee, Settings, Save } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
  onUserUpdate?: (updatedUser: any) => void;
  onSuccessMessage?: (msg: string) => void;
}

export default function ProfileModal({ isOpen, onClose, user, onSignOut, onUserUpdate, onSuccessMessage }: ProfileModalProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile'>('bookings');

  // Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [hometown, setHometown] = useState('');
  const [occupation, setOccupation] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [instagram, setInstagram] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Sync state if user prop changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setGender(user.gender || '');
      setCity(user.city || '');
      setHometown(user.hometown || '');
      setOccupation(user.occupation || '');
      setMobile(user.mobile || '');
      setDob(user.dob || '');
      setInstagram(user.instagram || '');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchBookings();
    }
  }, [isOpen, user]);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings/my');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings');
      setBookings(data.bookings || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading bookings.');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = user ? (
    name !== (user.name || '') ||
    gender !== (user.gender || '') ||
    city !== (user.city || '') ||
    hometown !== (user.hometown || '') ||
    occupation !== (user.occupation || '') ||
    mobile !== (user.mobile || '') ||
    dob !== (user.dob || '') ||
    instagram !== (user.instagram || '')
  ) : false;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    setSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, gender, city, hometown, occupation, mobile, dob, instagram }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      onUserUpdate?.(data.user);
      onSuccessMessage?.('Profile changes saved!');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking? You will receive an immediate refund.')) return;
    setCancellingId(bookingId);
    setError('');
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
      alert('Booking cancelled successfully! Refund has been initiated.');
      fetchBookings();
    } catch (err: any) {
      setError(err.message || 'Error cancelling booking.');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div id="profile-modal-backdrop" className="profile-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="profile-card animate-scale-up" role="dialog" aria-modal="true">
        <button id="profile-modal-close" className="close-btn" onClick={onClose} aria-label="Close profile">
          <X size={20} />
        </button>

        <div className="profile-body">
          {/* User Info Header */}
          <div className="user-profile-header">
            <div className="avatar-wrapper">
              {user.image ? (
                <img src={user.image} alt={user.name} className="user-avatar-large" referrerPolicy="no-referrer" />
              ) : (
                <div className="avatar-placeholder">
                  <User size={32} />
                </div>
              )}
            </div>
            <div className="user-details">
              <h2>{user.name || 'SocioPath Member'}</h2>
              <p className="user-email">{user.email}</p>
              <span className="role-badge">{user.role} Account</span>
            </div>
            <button
              id="profile-signout-btn"
              className="btn-secondary signout-action-btn"
              onClick={() => {
                onSignOut();
                onClose();
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <Ticket size={16} />
              <span>Reservations</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <Settings size={16} />
              <span>Edit Profile</span>
            </button>
          </div>

          {error && (
            <div className="profile-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Bookings Section */}
          {activeTab === 'bookings' && (
            <div className="bookings-section">
              {loading ? (
                <div className="bookings-status-box">
                  <p>Loading your reservations...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="bookings-empty-box">
                  <p>No bookings found.</p>
                  <button
                    id="book-first-session-btn"
                    className="btn-primary start-booking-btn"
                    onClick={onClose}
                  >
                    Explore Weekend Sessions
                  </button>
                </div>
              ) : (
                <div className="bookings-list" id="user-bookings-container">
                  {bookings.map((booking) => {
                    const eventDate = new Date(booking.event.date);
                    const formattedDate = eventDate.toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const isConfirmed = booking.status === 'CONFIRMED';
                    const isPending = booking.status === 'PENDING';
                    const isRefunded = booking.status === 'REFUNDED';

                    // Check if cancellation is allowed (at least 3 days prior)
                    const threeDaysPrior = new Date(eventDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                    const now = new Date();
                    const canCancel = isConfirmed && now <= threeDaysPrior;

                    return (
                      <div
                        key={booking.id}
                        className={`booking-item-card ${isConfirmed ? 'border-confirmed' : isRefunded ? 'border-refunded' : 'border-pending'}`}
                      >
                        <div className="booking-info-left">
                          <h4>{booking.event.title}</h4>
                          <p className="booking-event-date">{formattedDate}</p>
                          <div className="booking-payment-details">
                            <span className="price-tag">
                              <IndianRupee size={12} />
                              {booking.event.price.toLocaleString('en-IN')}
                            </span>
                            <span className="order-id">Order ID: {booking.razorpayOrderId.substring(0, 16)}...</span>
                          </div>
                        </div>

                        <div className="booking-info-right">
                          {isConfirmed ? (
                            <div className="status-container">
                              <div className="status-indicator status-confirmed" id={`status-badge-confirmed-${booking.id}`}>
                                <CheckCircle size={14} />
                                <span>Confirmed</span>
                              </div>
                              {canCancel && (
                                <button
                                  className="btn-cancel-booking"
                                  onClick={() => handleCancelBooking(booking.id)}
                                  disabled={cancellingId === booking.id}
                                >
                                  {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                                </button>
                              )}
                            </div>
                          ) : isPending ? (
                            <div className="status-indicator status-pending" id={`status-badge-pending-${booking.id}`}>
                              <Clock size={14} />
                              <span>Pending</span>
                            </div>
                          ) : (
                            <div className="status-indicator status-refunded" id={`status-badge-refunded-${booking.id}`}>
                              <RotateCcw size={14} />
                              <span>Refunded</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Edit Profile Section */}
          {activeTab === 'profile' && (
            <form className="profile-edit-form" onSubmit={handleSaveProfile}>
              {saveSuccess && (
                <div className="profile-success-banner">
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div className="form-row-grid">
                <div className="profile-form-group">
                  <label htmlFor="edit-name">Display Name</label>
                  <input
                    type="text"
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="edit-gender">Gender</label>
                  <select
                    id="edit-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row-grid">
                <div className="profile-form-group">
                  <label htmlFor="edit-mobile">Mobile Number</label>
                  <input
                    type="tel"
                    id="edit-mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit number"
                    pattern="[0-9]{10}"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="edit-dob">Date of Birth</label>
                  <input
                    type="date"
                    id="edit-dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-grid">
                <div className="profile-form-group">
                  <label htmlFor="edit-city">Current City</label>
                  <input
                    type="text"
                    id="edit-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="edit-hometown">Hometown</label>
                  <input
                    type="text"
                    id="edit-hometown"
                    value={hometown}
                    onChange={(e) => setHometown(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-grid">
                <div className="profile-form-group">
                  <label htmlFor="edit-occupation">Occupation</label>
                  <input
                    type="text"
                    id="edit-occupation"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Developer, Designer"
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="edit-instagram">Instagram Handle (Optional)</label>
                  <div className="insta-input-wrapper">
                    <span className="at-prefix">@</span>
                    <input
                      type="text"
                      id="edit-instagram"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="username"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary save-profile-btn"
                disabled={saving || !hasChanges}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .profile-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(3, 7, 18, 0.95);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }
        .profile-card {
          width: 100%;
          max-width: 650px;
          border-radius: 28px;
          position: relative;
          box-shadow: var(--shadow-lg), 0 0 50px -10px rgba(99, 102, 241, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.08);
          max-height: 85vh;
          overflow-y: auto;
          background: #0b0f19;
        }
        .close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          color: var(--fg-tertiary);
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          cursor: pointer;
        }
        .close-btn:hover {
          color: var(--fg-primary);
          background: rgba(255, 255, 255, 0.08);
        }
        .profile-body {
          padding: 3rem;
        }
        .user-profile-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 2rem;
          flex-wrap: wrap;
        }
        .user-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--accent-indigo);
          box-shadow: var(--shadow-glow);
        }
        .avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.02);
          border: 2px dashed var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--fg-secondary);
        }
        .user-details {
          flex-grow: 1;
        }
        .user-details h2 {
          font-size: 1.5rem;
          color: #fff;
          margin-bottom: 0.25rem;
        }
        .user-email {
          font-size: 0.9rem;
          color: var(--fg-secondary);
          margin-bottom: 0.5rem;
        }
        .role-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.1);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .signout-action-btn {
          padding: 0.6rem 1.2rem;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .signout-action-btn:hover {
          background: rgba(244, 63, 94, 0.1) !important;
          color: var(--accent-rose) !important;
          border-color: rgba(244, 63, 94, 0.3) !important;
        }
        .profile-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1rem;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--fg-secondary);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.02);
        }
        .tab-btn.active {
          color: var(--accent-indigo);
          background: rgba(99, 102, 241, 0.08);
        }
        .profile-error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(244, 63, 94, 0.1);
          color: var(--accent-rose);
          border: 1px solid rgba(244, 63, 94, 0.2);
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
        }
        .profile-success-banner {
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent-emerald);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
        }
        .bookings-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .bookings-status-box, .bookings-empty-box {
          text-align: center;
          padding: 2.5rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px dashed var(--border-color);
          border-radius: 16px;
          color: var(--fg-secondary);
        }
        .start-booking-btn {
          margin-top: 1rem;
          font-size: 0.85rem;
        }
        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 380px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        .booking-item-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          transition: all 0.2s;
        }
        .booking-item-card:hover {
          background: rgba(255, 255, 255, 0.04);
          transform: translateX(2px);
        }
        .border-confirmed {
          border-left: 3px solid var(--accent-emerald);
        }
        .border-pending {
          border-left: 3px solid var(--accent-amber);
        }
        .border-refunded {
          border-left: 3px solid var(--fg-tertiary);
          opacity: 0.7;
        }
        .booking-info-left h4 {
          color: #fff;
          font-size: 1rem;
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }
        .booking-event-date {
          font-size: 0.8rem;
          color: var(--fg-secondary);
          margin-bottom: 0.5rem;
        }
        .booking-payment-details {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--fg-tertiary);
        }
        .price-tag {
          color: var(--accent-cyan);
          font-weight: 600;
          display: flex;
          align-items: center;
        }
        .status-container {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .status-confirmed {
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent-emerald);
        }
        .status-pending {
          background: rgba(245, 158, 11, 0.1);
          color: var(--accent-amber);
        }
        .status-refunded {
          background: rgba(255, 255, 255, 0.05);
          color: var(--fg-secondary);
        }
        .btn-cancel-booking {
          background: rgba(244, 63, 94, 0.08);
          color: var(--accent-rose);
          border: 1px solid rgba(244, 63, 94, 0.2);
          border-radius: 6px;
          padding: 0.3rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-cancel-booking:hover {
          background: var(--accent-rose);
          color: #fff;
          border-color: var(--accent-rose);
        }
        
        /* Edit Profile Form Styles */
        .profile-edit-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-row-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .profile-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .profile-form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--fg-secondary);
        }
        .profile-form-group input, .profile-form-group select {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.6rem 0.85rem;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
          font-family: inherit;
        }
        .profile-form-group input:focus, .profile-form-group select:focus {
          border-color: var(--accent-indigo);
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.15);
        }
        .profile-form-group select option {
          background: #0f1423;
          color: #fff;
        }
        .insta-input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }
        .insta-input-wrapper input {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          padding-left: 0.25rem;
          flex-grow: 1;
        }
        .at-prefix {
          padding-left: 0.85rem;
          color: var(--fg-tertiary);
          font-size: 0.9rem;
          font-weight: 600;
        }
        .save-profile-btn {
          align-self: flex-end;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
          margin-top: 1rem;
        }
        .save-profile-btn:disabled {
          background: var(--bg-tertiary) !important;
          color: var(--fg-tertiary) !important;
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none !important;
          border-color: transparent !important;
          transform: none !important;
        }

        @media (max-width: 576px) {
          .profile-backdrop {
            padding: 0.75rem;
          }
          .profile-card {
            max-height: 92vh;
          }
          .profile-body {
            padding: 2rem 1.25rem;
          }
          .form-row-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .user-profile-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1rem;
          }
          .user-details {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .signout-action-btn {
            width: 100%;
            justify-content: center;
          }
          .profile-tabs {
            gap: 0.5rem;
          }
          .tab-btn {
            flex: 1;
            padding: 0.5rem 0.25rem;
            font-size: 0.8rem;
            justify-content: center;
          }
          .save-profile-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
