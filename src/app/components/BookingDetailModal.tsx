'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle, Clock, RotateCcw, Star, Plane } from 'lucide-react';

interface BookingDetailModalProps {
  isOpen: boolean;
  booking: any | null;
  userName?: string;
  onClose: () => void;
}

export default function BookingDetailModal({ isOpen, booking, userName, onClose }: BookingDetailModalProps) {
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReviewRating(0);
      setReviewComment('');
      setReviewSubmitted(false);
      setReviewError('');
    }
  }, [isOpen, booking?.id]);

  if (!isOpen || !booking) return null;

  const event = booking.event;
  const eventDateShort = new Date(event.date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const eventTime = new Date(event.date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const bookedOnDate = new Date(booking.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const isConfirmed = booking.status === 'CONFIRMED';
  const isPending = booking.status === 'PENDING';
  const isRefunded = booking.status === 'REFUNDED';

  const maleQuantity = booking.maleQuantity || 0;
  const femaleQuantity = booking.femaleQuantity || 0;
  const totalQuantity = booking.quantity || (maleQuantity + femaleQuantity) || 1;
  const finalAmount = booking.finalAmount ?? event.price;
  const hasReview = !!booking.EventReview;

  const membersLabel = maleQuantity > 0 || femaleQuantity > 0
    ? [maleQuantity > 0 ? `${maleQuantity}M` : null, femaleQuantity > 0 ? `${femaleQuantity}F` : null].filter(Boolean).join(' + ')
    : `${totalQuantity} Guest${totalQuantity > 1 ? 's' : ''}`;

  const handleSubmitReview = async () => {
    if (reviewRating < 1) {
      setReviewError('Please select a star rating.');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError('Please write a short comment.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await fetch('/api/reviews/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, rating: reviewRating, comment: reviewComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      setReviewSubmitted(true);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div id="booking-detail-backdrop" className="detail-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="detail-wrapper animate-scale-up">
        <button className="close-btn" onClick={onClose} aria-label="Close booking details">
          <X size={20} />
        </button>

        {/* Boarding-pass style ticket */}
        <div className="pass-card">
          <div className="pass-main">
            <div className="pass-header">
              <div className="pass-brand">
                <Plane size={16} />
                <span>SOCIOPATH PASS</span>
              </div>
              <span className={`status-indicator ${isConfirmed ? 'status-confirmed' : isPending ? 'status-pending' : 'status-refunded'}`}>
                {isConfirmed ? <CheckCircle size={13} /> : isPending ? <Clock size={13} /> : <RotateCcw size={13} />}
                <span>{isConfirmed ? 'Confirmed' : isPending ? 'Pending' : 'Refunded'}</span>
              </span>
            </div>

            <h2 className="pass-event-title">{event.title}</h2>
            {event.venue && (
              <div className="pass-venue">
                <MapPin size={14} />
                <span>{event.venue}</span>
              </div>
            )}

            <div className="pass-fields-grid">
              <div className="pass-field">
                <span className="pass-field-label">Passenger</span>
                <span className="pass-field-value">{userName || 'Guest'}</span>
              </div>
              <div className="pass-field">
                <span className="pass-field-label">Event Date</span>
                <span className="pass-field-value">{eventDateShort}</span>
              </div>
              <div className="pass-field">
                <span className="pass-field-label">Time</span>
                <span className="pass-field-value">{eventTime}</span>
              </div>
              <div className="pass-field">
                <span className="pass-field-label">Seats</span>
                <span className="pass-field-value">{membersLabel}</span>
              </div>
              <div className="pass-field">
                <span className="pass-field-label">Booked On</span>
                <span className="pass-field-value">{bookedOnDate}</span>
              </div>
              <div className="pass-field">
                <span className="pass-field-label">Amount Paid</span>
                <span className="pass-field-value">₹{finalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Perforated divider with notches */}
          <div className="pass-divider">
            <span className="notch notch-left"></span>
            <span className="dashed-line"></span>
            <span className="notch notch-right"></span>
          </div>

          <div className="pass-stub">
            <div className="stub-ticket-number">
              <span className="pass-field-label">Ticket No.</span>
              <span className="stub-code">{booking.ticketNumber || '—'}</span>
            </div>

            <div className="stub-qr">
              {isConfirmed && booking.qrCode ? (
                <img src={booking.qrCode} alt="Booking QR code" className="qr-image" />
              ) : isRefunded ? (
                <p className="qr-status-note refunded">Refunded — not valid for entry</p>
              ) : (
                <p className="qr-status-note">QR appears once confirmed</p>
              )}
            </div>
          </div>
        </div>

        <div className="order-meta">
          <span>Order ID: {booking.razorpayOrderId}</span>
          {booking.razorpayPaymentId && <span>Payment ID: {booking.razorpayPaymentId}</span>}
        </div>

        {isConfirmed && (
          <div className="review-section">
            {hasReview ? (
              <p className="review-thanks">✅ You already reviewed this event. Thanks for the feedback!</p>
            ) : reviewSubmitted ? (
              <p className="review-thanks">🎉 Review submitted — thanks for sharing your experience!</p>
            ) : (
              <div className="review-form">
                <span className="review-form-label">Leave a review for this event</span>
                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="star-btn"
                      onClick={() => setReviewRating(n)}
                      aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                    >
                      <Star size={22} fill={n <= reviewRating ? 'currentColor' : 'none'} className={n <= reviewRating ? 'star-filled' : 'star-empty'} />
                    </button>
                  ))}
                </div>
                <textarea
                  className="review-textarea"
                  rows={2}
                  placeholder="How was your experience?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
                {reviewError && <p className="review-error">{reviewError}</p>}
                <button
                  type="button"
                  className="btn-primary review-submit-btn"
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            )}
          </div>
        )}
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
        .detail-wrapper {
          width: 100%;
          max-width: 440px;
          margin: auto;
          position: relative;
        }
        .close-btn {
          position: absolute;
          top: -0.75rem;
          right: -0.75rem;
          z-index: 10;
          color: var(--fg-tertiary);
          padding: 0.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0b0f19;
          border: 1px solid var(--border-color);
        }
        .close-btn:hover {
          color: var(--fg-primary);
          background: rgba(255, 255, 255, 0.08);
        }

        /* ── Boarding pass card ───────────────────────────────────────── */
        .pass-card {
          background: #0b0f19;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 22px;
          overflow: hidden;
          box-shadow: var(--shadow-lg), 0 0 60px -15px rgba(99, 102, 241, 0.25);
        }
        .pass-main {
          background: var(--gradient-primary), rgba(255, 255, 255, 0.02);
          background-blend-mode: overlay;
          padding: 1.75rem 1.75rem 1.5rem;
        }
        .pass-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .pass-brand {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.08em;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.25rem 0.55rem;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }
        .status-indicator.status-confirmed {
          background: rgba(16, 185, 129, 0.25);
        }
        .status-indicator.status-pending {
          background: rgba(245, 158, 11, 0.25);
        }
        .status-indicator.status-refunded {
          background: rgba(255, 255, 255, 0.1);
        }
        .pass-event-title {
          font-size: 1.3rem;
          color: #fff;
          font-family: var(--font-display);
          margin-bottom: 0.5rem;
          line-height: 1.25;
        }
        .pass-venue {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: rgba(255, 255, 255, 0.75);
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
        }
        .pass-fields-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem 0.75rem;
        }
        .pass-field {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .pass-field-label {
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 700;
        }
        .pass-field-value {
          font-size: 0.85rem;
          color: #fff;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Perforated divider with notches cut into the card edges */
        .pass-divider {
          position: relative;
          height: 0;
          display: flex;
          align-items: center;
        }
        .notch {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(3, 7, 18, 0.98);
          top: -12px;
        }
        .notch-left {
          left: -12px;
        }
        .notch-right {
          right: -12px;
        }
        .dashed-line {
          width: 100%;
          border-top: 2px dashed rgba(255, 255, 255, 0.15);
        }

        .pass-stub {
          padding: 1.25rem 1.75rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        .stub-ticket-number {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .stub-code {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          color: var(--accent-cyan);
        }
        .stub-qr {
          background: #fff;
          border-radius: 12px;
          padding: 0.5rem;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 84px;
          min-height: 84px;
        }
        .qr-image {
          width: 76px;
          height: 76px;
          display: block;
        }
        .qr-status-note {
          font-size: 0.62rem;
          color: #333;
          text-align: center;
          font-weight: 600;
          max-width: 76px;
        }
        .qr-status-note.refunded {
          color: var(--accent-rose);
        }

        .order-meta {
          margin-top: 1rem;
          padding: 0.85rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.68rem;
          color: var(--fg-tertiary);
          word-break: break-all;
        }

        .review-section {
          margin-top: 1.5rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 16px;
        }
        .review-thanks {
          font-size: 0.85rem;
          color: var(--accent-emerald);
          text-align: center;
        }
        .review-form {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .review-form-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--fg-secondary);
        }
        .star-picker {
          display: flex;
          gap: 0.35rem;
        }
        .star-btn {
          padding: 0.15rem;
          color: var(--fg-tertiary);
        }
        .star-filled {
          color: var(--accent-amber);
        }
        .star-empty {
          color: var(--fg-tertiary);
        }
        .review-textarea {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0.65rem 0.85rem;
          color: #fff;
          font-size: 0.85rem;
          font-family: inherit;
          resize: vertical;
        }
        .review-error {
          font-size: 0.75rem;
          color: var(--accent-rose);
        }
        .review-submit-btn {
          align-self: flex-end;
          padding: 0.55rem 1.1rem;
          font-size: 0.85rem;
        }

        @media (max-width: 420px) {
          .pass-fields-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
