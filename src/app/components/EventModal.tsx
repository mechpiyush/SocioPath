'use client';

import { X, Calendar, IndianRupee, MapPin, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  price: number;
  femaleDiscount?: number;
  genderPricingEnabled?: boolean;
  minCapacity: number;
  maxCapacity: number;
  status: string;
  spotsFilled: number;
  venue?: string;
  venueMapEmbedUrl?: string;
}

interface EventModalProps {
  isOpen: boolean;
  event: Event | null;
  onClose: () => void;
  onProceedToBooking: (eventId: string) => void;
}

export default function EventModal({
  isOpen,
  event,
  onClose,
  onProceedToBooking,
}: EventModalProps) {
  if (!isOpen || !event) return null;

  const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const spotsFilled = event.spotsFilled || 0;
  const isSoldOut = spotsFilled >= event.maxCapacity;
  const isConfirmed = spotsFilled >= event.minCapacity;
  const isCancelled = event.status === 'CANCELLED';

  const progressPercentage = Math.min((spotsFilled / event.maxCapacity) * 100, 100);
  const discountEnabled = event.genderPricingEnabled !== false && (event.femaleDiscount || 0) > 0;

  // Inclusions checklist based on event title
  const isFriday = event.title.toLowerCase().includes('friday');
  const inclusions = isFriday
    ? [
        'Overnight premium villa stay in Mumbai sub-district',
        'Late-night open mic & acoustic jamming session',
        'Collaborative group karaoke session with pro audio gear',
        'Premium appetizers & starters served hot throughout the night',
        'Designated buffet dinner food menu',
        'BYOD (Bring Your Own Drinks) fully supported',
      ]
    : [
        'Overnight premium villa stay in Mumbai sub-district',
        'Interactive 2-hour music & social ice-breaker program',
        'Curated board & strategic card games to network with strangers',
        'Premium appetizers & starters served hot throughout the night',
        'Designated buffet dinner food menu',
        'BYOD (Bring Your Own Drinks) fully supported',
      ];

  return (
    <div id="event-modal-backdrop" className="modal-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-card glass-panel animate-scale-up" role="dialog" aria-modal="true">
        <button id="event-modal-close" className="close-btn" onClick={onClose} aria-label="Close details">
          <X size={20} />
        </button>

        <div className="modal-body">
          {/* Header */}
          <div className="modal-header">
            <span className={`modal-status-badge ${isSoldOut ? 'soldout' : isConfirmed ? 'confirmed' : 'pending'}`}>
              {isSoldOut ? 'Sold Out' : isConfirmed ? 'Confirmed Session' : 'Pending Capacity'}
            </span>
            <h2 id="event-modal-title">{event.title}</h2>

            <div className="modal-meta-row">
              <div className="meta-block">
                <Calendar size={18} />
                <span>{formattedDate}</span>
              </div>
              <div className="meta-block">
                <MapPin size={18} />
                <span>{event.venue || 'Premium Secluded Villa, Mumbai'}</span>
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="modal-grid">
            <div className="grid-left">
              <section className="section-desc">
                <h3>Experience Overview</h3>
                <p>{event.description}</p>
              </section>

              <section className="section-inclusions">
                <h3>What's Included (₹1,500 All-Inclusive)</h3>
                <ul className="inclusions-list">
                  {inclusions.map((item, idx) => (
                    <li key={idx} className="inclusion-item">
                      <CheckCircle size={18} className="icon-check" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="grid-right">
              {/* Pricing & Capacity Box */}
              <div className="booking-card">
                <div className="pricing-box">
                  <span className="price-label">Ticket Entry Fee</span>
                  <div className="price-value">
                    <IndianRupee size={24} />
                    <span>{event.price.toLocaleString('en-IN')}</span>
                    <span className="price-suffix">/guest</span>
                  </div>
                  {discountEnabled && (
                    <div className="discount-highlight-banner">
                      <Sparkles size={16} />
                      <span>
                        Women save ₹{(event.femaleDiscount || 0).toLocaleString('en-IN')} — pay just ₹
                        {Math.max(0, event.price - (event.femaleDiscount || 0)).toLocaleString('en-IN')}/guest
                      </span>
                    </div>
                  )}
                </div>

                <div className="availability-box">
                  <div className="availability-header">
                    <span>Availability Progress</span>
                    <span className="spots-count">{spotsFilled} / {event.maxCapacity} Booked</span>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  {isSoldOut ? (
                    <p className="availability-desc soldout">This session is completely booked!</p>
                  ) : !isConfirmed ? (
                    <p className="availability-desc warning">
                      ⏳ Needs {event.minCapacity - spotsFilled} more guests to run. 100% refund processed if threshold isn't met 24 hours prior.
                    </p>
                  ) : (
                    <p className="availability-desc success">
                      🎉 Session is confirmed to run! Only {event.maxCapacity - spotsFilled} spots left.
                    </p>
                  )}
                </div>

                {isCancelled && (
                  <div className="cancelled-banner">
                    <AlertTriangle size={18} />
                    <span>This event has been cancelled and refunded.</span>
                  </div>
                )}

                {!isCancelled && (
                  <button
                    id="modal-proceed-btn"
                    className="btn-primary checkout-btn"
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => onProceedToBooking(event.id)}
                  >
                    {isSoldOut ? 'Sold Out' : 'Proceed to Booking'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(3, 7, 18, 0.9);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 2rem;
          overflow-y: auto;
        }
        .modal-card {
          width: 100%;
          max-width: 900px;
          border-radius: 28px;
          position: relative;
          box-shadow: var(--shadow-lg), 0 0 50px -10px rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.08);
          max-height: 90vh;
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
          z-index: 20;
        }
        .close-btn:hover {
          color: var(--fg-primary);
          background: rgba(255, 255, 255, 0.08);
        }
        .modal-body {
          padding: 3rem;
        }
        .modal-header {
          margin-bottom: 2.5rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.5rem;
        }
        .modal-status-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          margin-bottom: 0.75rem;
        }
        .modal-status-badge.soldout {
          background: rgba(244, 63, 94, 0.15);
          color: var(--accent-rose);
          border: 1px solid rgba(244, 63, 94, 0.3);
        }
        .modal-status-badge.confirmed {
          background: rgba(16, 185, 129, 0.15);
          color: var(--accent-emerald);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .modal-status-badge.pending {
          background: rgba(245, 158, 11, 0.15);
          color: var(--accent-amber);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .modal-header h2 {
          font-size: 2.25rem;
          color: #fff;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #fff 40%, var(--fg-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .modal-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          font-size: 0.95rem;
          color: var(--fg-secondary);
        }
        .meta-block {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .modal-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 3rem;
        }
        .grid-left {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }
        .section-desc h3, .section-inclusions h3 {
          font-size: 1.2rem;
          color: #fff;
          margin-bottom: 0.75rem;
        }
        .section-desc p {
          color: var(--fg-secondary);
          line-height: 1.6;
          font-size: 1rem;
        }
        .inclusions-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .inclusion-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          color: var(--fg-secondary);
          font-size: 0.95rem;
          line-height: 1.4;
        }
        .icon-check {
          color: var(--accent-emerald);
          flex-shrink: 0;
          margin-top: 0.1rem;
        }
        .booking-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
          position: sticky;
          top: 2rem;
        }
        .pricing-box {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.25rem;
        }
        .price-label {
          font-size: 0.85rem;
          color: var(--fg-tertiary);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        .price-value {
          display: flex;
          align-items: center;
          color: var(--accent-cyan);
          font-weight: 800;
          font-size: 2.25rem;
          font-family: var(--font-display);
        }
        .discount-highlight-banner {
          margin-top: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.25);
          color: var(--accent-rose);
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.6rem 0.85rem;
          border-radius: 12px;
        }
        .price-suffix {
          font-size: 1rem;
          color: var(--fg-secondary);
          font-weight: 500;
          margin-left: 0.25rem;
        }
        .availability-box {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .availability-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--fg-secondary);
        }
        .spots-count {
          color: #fff;
        }
        .progress-bar-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 9999px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: 9999px;
        }
        .availability-desc {
          font-size: 0.75rem;
          line-height: 1.4;
        }
        .availability-desc.warning {
          color: var(--accent-amber);
        }
        .availability-desc.success {
          color: var(--accent-emerald);
        }
        .availability-desc.soldout {
          color: var(--accent-rose);
        }
        .cancelled-banner {
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.2);
          color: var(--accent-rose);
          border-radius: 12px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
        }
        .checkout-btn {
          width: 100%;
          justify-content: center;
          padding: 1rem;
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .modal-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .modal-body {
            padding: 2rem;
          }
          .close-btn {
            top: 1rem;
            right: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
