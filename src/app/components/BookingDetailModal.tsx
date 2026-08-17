'use client';

import { X, Calendar, MapPin, IndianRupee, Users, CheckCircle, Clock, RotateCcw } from 'lucide-react';

interface BookingDetailModalProps {
  isOpen: boolean;
  booking: any | null;
  onClose: () => void;
}

export default function BookingDetailModal({ isOpen, booking, onClose }: BookingDetailModalProps) {
  if (!isOpen || !booking) return null;

  const event = booking.event;
  const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isConfirmed = booking.status === 'CONFIRMED';
  const isPending = booking.status === 'PENDING';
  const isRefunded = booking.status === 'REFUNDED';

  const maleQuantity = booking.maleQuantity || 0;
  const femaleQuantity = booking.femaleQuantity || 0;
  const totalQuantity = booking.quantity || (maleQuantity + femaleQuantity) || 1;
  const finalAmount = booking.finalAmount ?? event.price;

  return (
    <div id="booking-detail-backdrop" className="detail-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="detail-card glass-panel animate-scale-up" role="dialog" aria-modal="true">
        <button className="close-btn" onClick={onClose} aria-label="Close booking details">
          <X size={20} />
        </button>

        <div className="detail-header">
          <span className={`status-indicator ${isConfirmed ? 'status-confirmed' : isPending ? 'status-pending' : 'status-refunded'}`}>
            {isConfirmed ? <CheckCircle size={14} /> : isPending ? <Clock size={14} /> : <RotateCcw size={14} />}
            <span>{isConfirmed ? 'Confirmed' : isPending ? 'Pending' : 'Refunded'}</span>
          </span>
          <h2>{event.title}</h2>
          {booking.ticketNumber && (
            <span className="ticket-number-badge">{booking.ticketNumber}</span>
          )}
        </div>

        <div className="detail-body">
          <div className="info-row">
            <Calendar size={18} className="info-icon" />
            <div>
              <span className="info-label">Date & Time</span>
              <span className="info-value">{eventDate}</span>
            </div>
          </div>

          {event.venue && (
            <div className="info-row">
              <MapPin size={18} className="info-icon" />
              <div>
                <span className="info-label">Venue</span>
                <span className="info-value">{event.venue}</span>
              </div>
            </div>
          )}

          <div className="info-row">
            <Users size={18} className="info-icon" />
            <div>
              <span className="info-label">Tickets</span>
              <span className="info-value">
                {maleQuantity > 0 && `${maleQuantity} Male`}
                {maleQuantity > 0 && femaleQuantity > 0 && ' + '}
                {femaleQuantity > 0 && `${femaleQuantity} Female`}
                {!maleQuantity && !femaleQuantity && `${totalQuantity} Guest${totalQuantity > 1 ? 's' : ''}`}
                {(maleQuantity > 0 || femaleQuantity > 0) && ` (${totalQuantity} total)`}
              </span>
            </div>
          </div>

          <div className="info-row">
            <IndianRupee size={18} className="info-icon" />
            <div>
              <span className="info-label">Amount Paid</span>
              <span className="info-value">₹{finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="order-meta">
            <span>Order ID: {booking.razorpayOrderId}</span>
            {booking.razorpayPaymentId && <span>Payment ID: {booking.razorpayPaymentId}</span>}
          </div>
        </div>

        <div className="qr-section">
          {isConfirmed && booking.qrCode ? (
            <div className="qr-card">
              <img src={booking.qrCode} alt="Booking QR code" className="qr-image" />
              <p className="qr-caption">Show this QR code at entry for verification</p>
            </div>
          ) : isRefunded ? (
            <p className="qr-status-note refunded">This booking was refunded — the ticket is no longer valid for entry.</p>
          ) : (
            <p className="qr-status-note">Your QR ticket will appear here once payment is confirmed.</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .detail-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(3, 7, 18, 0.92);
          backdrop-filter: blur(14px);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 1200;
          padding: 3vh 1.5rem;
          overflow-y: auto;
        }
        .detail-card {
          width: 100%;
          max-width: 480px;
          margin: auto;
          border-radius: 24px;
          position: relative;
          box-shadow: var(--shadow-lg), 0 0 50px -10px rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 2.25rem;
        }
        .close-btn {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
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
        .detail-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.6rem;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.7rem;
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
        .detail-header h2 {
          font-size: 1.4rem;
          color: #fff;
        }
        .ticket-number-badge {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          border-radius: 9999px;
          padding: 0.3rem 0.7rem;
        }
        .detail-body {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          margin-bottom: 1.5rem;
        }
        .info-row {
          display: flex;
          gap: 0.75rem;
        }
        .info-icon {
          color: var(--accent-indigo);
          flex-shrink: 0;
          margin-top: 0.15rem;
        }
        .info-label {
          display: block;
          font-size: 0.72rem;
          color: var(--fg-tertiary);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
          margin-bottom: 0.15rem;
        }
        .info-value {
          display: block;
          font-size: 0.9rem;
          color: #fff;
          font-weight: 500;
        }
        .order-meta {
          border-top: 1px solid var(--border-color);
          padding-top: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.7rem;
          color: var(--fg-tertiary);
          word-break: break-all;
        }
        .qr-section {
          display: flex;
          justify-content: center;
        }
        .qr-card {
          background: #fff;
          border-radius: 18px;
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .qr-image {
          width: 150px;
          height: 150px;
          display: block;
        }
        .qr-caption {
          font-size: 0.72rem;
          color: #111;
          font-weight: 600;
          text-align: center;
        }
        .qr-status-note {
          font-size: 0.8rem;
          color: var(--fg-secondary);
          text-align: center;
          padding: 1rem;
        }
        .qr-status-note.refunded {
          color: var(--accent-rose);
        }
      `}</style>
    </div>
  );
}
