'use client';

import { useEffect } from 'react';
import { CheckCircle, Calendar, ArrowRight, IndianRupee, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingSuccessProps {
  onClose: () => void;
  bookingDetails: {
    eventTitle: string;
    amount: number;
    orderId: string;
    date: string;
  } | null;
}

export default function BookingSuccess({ onClose, bookingDetails }: BookingSuccessProps) {
  useEffect(() => {
    // Trigger celebratory confetti on mount
    try {
      const duration = 2 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#8b5cf6', '#06b6d4']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6366f1', '#8b5cf6', '#06b6d4']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    } catch (err) {
      console.error('Confetti animation failed:', err);
    }
  }, []);

  if (!bookingDetails) return null;

  const eventDate = new Date(bookingDetails.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div id="booking-success-view" className="success-overlay animate-fade-in">
      <div className="success-container glass-panel animate-scale-up">
        <div className="success-header">
          <div className="success-icon-wrapper">
            <CheckCircle size={48} className="icon-success" />
          </div>
          <h2 id="success-view-title">Booking Confirmed!</h2>
          <p>You're all set for Mumbai's premium late-night retreat.</p>
        </div>

        <div className="ticket-card">
          <div className="ticket-section-header">
            <h3>{bookingDetails.eventTitle}</h3>
          </div>
          <div className="ticket-body">
            <div className="ticket-info-row">
              <Calendar size={18} className="ticket-icon" />
              <div>
                <span className="info-label">Date & Time</span>
                <span className="info-value">{eventDate}</span>
              </div>
            </div>

            <div className="ticket-info-row">
              <IndianRupee size={18} className="ticket-icon" />
              <div>
                <span className="info-label">Total Amount Paid</span>
                <span className="info-value">₹{(bookingDetails.amount / 100).toLocaleString('en-IN')} INR</span>
              </div>
            </div>

            <div className="ticket-footer-row">
              <span className="order-tag">Order ID: {bookingDetails.orderId}</span>
            </div>
          </div>
        </div>

        <div className="refund-guarantee-banner">
          <ShieldCheck size={20} className="icon-shield" />
          <div className="guarantee-text">
            <h4>SocioPath Threshold Guarantee</h4>
            <p>
              This weekend session requires a minimum of 10 attendees. If the threshold is not reached 24 hours prior, an automatic 100% refund is issued straight to your payment method.
            </p>
          </div>
        </div>

        <button
          id="success-done-btn"
          className="btn-primary success-action-btn"
          onClick={onClose}
        >
          Go to Dashboard
          <ArrowRight size={16} />
        </button>
      </div>

      <style jsx>{`
        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(3, 7, 18, 0.95);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 1.5rem;
        }
        .success-container {
          width: 100%;
          max-width: 520px;
          border-radius: 28px;
          padding: 3rem 2.5rem;
          text-align: center;
          box-shadow: var(--shadow-lg), 0 0 60px -10px rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.15);
        }
        .success-icon-wrapper {
          width: 80px;
          height: 80px;
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .icon-success {
          color: var(--accent-emerald);
        }
        .success-header h2 {
          font-size: 1.85rem;
          color: #fff;
          margin-bottom: 0.5rem;
        }
        .success-header p {
          color: var(--fg-secondary);
          font-size: 0.95rem;
          margin-bottom: 2rem;
        }
        .ticket-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          text-align: left;
          margin-bottom: 2rem;
          overflow: hidden;
        }
        .ticket-section-header {
          background: rgba(255, 255, 255, 0.01);
          border-bottom: 1px dashed var(--border-color);
          padding: 1.25rem 1.5rem;
        }
        .ticket-section-header h3 {
          font-size: 1.1rem;
          color: #fff;
        }
        .ticket-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .ticket-info-row {
          display: flex;
          gap: 0.75rem;
        }
        .ticket-icon {
          color: var(--accent-indigo);
          flex-shrink: 0;
          margin-top: 0.15rem;
        }
        .info-label {
          display: block;
          font-size: 0.75rem;
          color: var(--fg-tertiary);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
          margin-bottom: 0.15rem;
        }
        .info-value {
          display: block;
          font-size: 0.95rem;
          color: #fff;
          font-weight: 500;
        }
        .ticket-footer-row {
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--fg-tertiary);
        }
        .refund-guarantee-banner {
          display: flex;
          gap: 0.75rem;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 16px;
          padding: 1rem 1.25rem;
          text-align: left;
          margin-bottom: 2.25rem;
        }
        .icon-shield {
          color: var(--accent-indigo);
          flex-shrink: 0;
          margin-top: 0.1rem;
        }
        .guarantee-text h4 {
          font-size: 0.85rem;
          color: #fff;
          margin-bottom: 0.25rem;
        }
        .guarantee-text p {
          font-size: 0.75rem;
          color: var(--fg-secondary);
          line-height: 1.4;
        }
        .success-action-btn {
          width: 100%;
          justify-content: center;
          padding: 0.9rem;
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}
