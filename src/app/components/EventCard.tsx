'use client';

import { Calendar, IndianRupee, Users } from 'lucide-react';

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
}

interface EventCardProps {
  event: Event;
  onClick: () => void;
  user?: any;
}

export default function EventCard({ event, onClick, user }: EventCardProps) {
  const formattedDate = new Date(event.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const spotsFilled = event.spotsFilled || 0;
  const isSoldOut = spotsFilled >= event.maxCapacity;
  const isConfirmed = spotsFilled >= event.minCapacity;

  const minProgress = Math.min((spotsFilled / event.minCapacity) * 100, 100);
  const maxProgress = Math.min((spotsFilled / event.maxCapacity) * 100, 100);

  const discount = event.femaleDiscount || 0;
  const genderPricingEnabled = event.genderPricingEnabled !== false;
  const isFemale = user && user.gender === 'FEMALE';
  const showFemaleDiscount = isFemale && discount > 0 && genderPricingEnabled;
  const finalPrice = showFemaleDiscount ? Math.max(0, event.price - discount) : event.price;

  const progressPct = isConfirmed ? maxProgress : minProgress;
  const spotsLeft = event.maxCapacity - spotsFilled;

  return (
    <article
      id={`event-card-${event.id}`}
      className="event-card glass-panel-interactive animate-slide-up"
      onClick={onClick}
    >
      {/* Status badge — top-right absolute */}
      <div className="card-badge-row">
        {isSoldOut ? (
          <span className="badge badge-soldout" id={`badge-soldout-${event.id}`}>Sold Out</span>
        ) : isConfirmed ? (
          <span className="badge badge-confirmed" id={`badge-confirmed-${event.id}`}>✓ Confirmed</span>
        ) : (
          <span className="badge badge-pending" id={`badge-pending-${event.id}`}>Awaiting Threshold</span>
        )}
        {showFemaleDiscount && !isSoldOut && (
          <span className="badge badge-discount-tag">♀ -₹{discount}</span>
        )}
      </div>

      <div className="card-content">
        {/* Title gets clear top breathing room after the badge row */}
        <h3 className="card-title">{event.title}</h3>

        <div className="card-meta">
          <div className="meta-item">
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>
          <div className="meta-item price-tag">
            <IndianRupee size={14} />
            {showFemaleDiscount ? (
              <span>
                <span className="original-price">₹{event.price.toLocaleString('en-IN')}</span>{' '}
                <span className="discounted-price">₹{finalPrice.toLocaleString('en-IN')}</span>
                <span className="per-person"> pp</span>
              </span>
            ) : (
              <span>₹{event.price.toLocaleString('en-IN')}<span className="per-person"> per person</span></span>
            )}
          </div>
        </div>

        <p className="card-description">{event.description.substring(0, 120)}…</p>

        {/* Compact capacity bar */}
        <div className="capacity-section">
          <div className="capacity-labels">
            <span className="cap-text">
              <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
              {spotsFilled}/{event.maxCapacity} spots
            </span>
            <span className="cap-pct">{Math.round(progressPct)}%</span>
          </div>
          <div className="progress-bar-track">
            <div
              className={`progress-bar-fill ${isSoldOut ? 'fill-soldout' : isConfirmed ? 'fill-confirmed' : 'fill-pending'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {!isConfirmed && !isSoldOut && (
            <p className="capacity-tip">🔥 {event.minCapacity - spotsFilled} more needed to confirm</p>
          )}
          {isConfirmed && !isSoldOut && (
            <p className="capacity-tip success">✅ Confirmed! {spotsLeft} spots left</p>
          )}
        </div>

        <button
          id={`view-details-btn-${event.id}`}
          className="btn-secondary card-action"
          type="button"
        >
          {isSoldOut ? 'View Details' : 'Book Now →'}
        </button>
      </div>

      <style jsx>{`
        .event-card {
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        /* Badge row sits INSIDE card flow so title never overlaps it */
        .card-badge-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          padding: 1.25rem 1.5rem 0;
          margin-bottom: 0.5rem;
        }

        .badge {
          padding: 0.22rem 0.6rem;
          border-radius: 9999px;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .badge-soldout {
          background: rgba(244, 63, 94, 0.18);
          border: 1px solid rgba(244, 63, 94, 0.35);
          color: var(--accent-rose);
        }
        .badge-confirmed {
          background: rgba(16, 185, 129, 0.18);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: var(--accent-emerald);
        }
        .badge-pending {
          background: rgba(245, 158, 11, 0.18);
          border: 1px solid rgba(245, 158, 11, 0.35);
          color: var(--accent-amber);
        }
        .badge-discount-tag {
          background: rgba(236, 72, 153, 0.18);
          border: 1px solid rgba(236, 72, 153, 0.35);
          color: #f472b6;
        }

        /* Title has top margin to breathe below badge row */
        .card-content {
          padding: 0.9rem 1.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .card-title {
          font-size: 1.3rem;
          line-height: 1.3;
          margin: 0 0 0.85rem 0;
          color: #fff;
          background: linear-gradient(135deg, #fff 60%, var(--fg-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .card-meta {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1rem;
          font-size: 0.85rem;
          color: var(--fg-secondary);
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .price-tag {
          color: var(--accent-cyan);
          font-weight: 600;
        }
        .per-person {
          font-weight: 400;
          color: var(--fg-secondary);
          font-size: 0.8em;
        }
        .original-price {
          text-decoration: line-through;
          color: var(--fg-tertiary);
          font-size: 0.85em;
        }
        .discounted-price {
          color: var(--accent-emerald);
          font-weight: 700;
        }

        .card-description {
          font-size: 0.88rem;
          line-height: 1.6;
          color: var(--fg-secondary);
          margin-bottom: 1.1rem;
          flex-grow: 1;
        }

        .capacity-section {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid var(--border-color);
          padding: 0.75rem 1rem;
          border-radius: 12px;
          margin-bottom: 1.1rem;
        }
        .capacity-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
          color: var(--fg-secondary);
        }
        .cap-text {
          display: flex;
          align-items: center;
          color: var(--fg-primary);
        }
        .cap-pct {
          color: var(--fg-tertiary);
        }
        .progress-bar-track {
          height: 5px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 0.35rem;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.5s ease-out;
        }
        .fill-pending { background: linear-gradient(90deg, var(--accent-amber), #f5b041); }
        .fill-confirmed { background: linear-gradient(90deg, var(--accent-indigo), var(--accent-purple)); }
        .fill-soldout { background: linear-gradient(90deg, var(--accent-rose), #e74c3c); }

        .capacity-tip {
          font-size: 0.72rem;
          color: var(--accent-amber);
          margin: 0;
        }
        .capacity-tip.success { color: var(--accent-emerald); }

        .card-action {
          width: 100%;
          justify-content: center;
          padding: 0.75rem;
          font-size: 0.9rem;
        }
        .event-card:hover .card-action {
          background: var(--gradient-primary);
          color: #fff;
          border-color: transparent;
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .card-badge-row {
            padding: 1rem 1.1rem 0;
          }
          .card-content {
            padding: 0.7rem 1.1rem 1.1rem;
          }
          .card-title {
            font-size: 1.1rem;
            margin-bottom: 0.65rem;
          }
          .card-description {
            font-size: 0.82rem;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .capacity-section {
            padding: 0.6rem 0.8rem;
          }
          .card-action {
            padding: 0.65rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </article>
  );
}
