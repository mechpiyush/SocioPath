'use client';

import { useState, useEffect } from 'react';
import { X, User, Ticket, LogOut, CheckCircle, Clock, RotateCcw, AlertCircle, IndianRupee } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
}

export default function ProfileModal({ isOpen, onClose, user, onSignOut }: ProfileModalProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  if (!isOpen || !user) return null;

  return (
    <div id="profile-modal-backdrop" className="profile-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="profile-card glass-panel animate-scale-up" role="dialog" aria-modal="true">
        <button id="profile-modal-close" className="close-btn" onClick={onClose} aria-label="Close profile">
          <X size={20} />
        </button>

        <div className="profile-body">
          {/* User Info Header */}
          <div className="user-profile-header">
            <div className="avatar-wrapper">
              {user.image ? (
                <img src={user.image} alt={user.name} className="user-avatar-large" />
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

          {/* Bookings Section */}
          <div className="bookings-section">
            <h3 className="section-title">
              <Ticket size={18} />
              <span>Your Booking History</span>
            </h3>

            {loading ? (
              <div className="bookings-status-box">
                <p>Loading your reservations...</p>
              </div>
            ) : error ? (
              <div className="bookings-error-box">
                <AlertCircle size={16} />
                <span>{error}</span>
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
                  const eventDate = new Date(booking.event.date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  
                  const isConfirmed = booking.status === 'CONFIRMED';
                  const isPending = booking.status === 'PENDING';
                  const isRefunded = booking.status === 'REFUNDED';

                  return (
                    <div 
                      key={booking.id} 
                      className={`booking-item-card ${isConfirmed ? 'border-confirmed' : isRefunded ? 'border-refunded' : 'border-pending'}`}
                    >
                      <div className="booking-info-left">
                        <h4>{booking.event.title}</h4>
                        <p className="booking-event-date">{eventDate}</p>
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
                          <div className="status-indicator status-confirmed" id={`status-badge-confirmed-${booking.id}`}>
                            <CheckCircle size={14} />
                            <span>Confirmed</span>
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
          margin-bottom: 2.5rem;
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
        }
        .signout-action-btn:hover {
          background: rgba(244, 63, 94, 0.1) !important;
          color: var(--accent-rose) !important;
          border-color: rgba(244, 63, 94, 0.3) !important;
        }
        .bookings-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          color: #fff;
        }
        .bookings-status-box, .bookings-error-box, .bookings-empty-box {
          text-align: center;
          padding: 2.5rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px dashed var(--border-color);
          border-radius: 16px;
          color: var(--fg-secondary);
        }
        .bookings-error-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: var(--accent-rose);
          background: rgba(244, 63, 94, 0.05);
          border-color: rgba(244, 63, 94, 0.1);
        }
        .start-booking-btn {
          margin-top: 1rem;
          font-size: 0.85rem;
        }
        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 350px;
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
      `}</style>
    </div>
  );
}
