'use client';

import { Calendar, Users, IndianRupee } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  price: number;
  femaleDiscount?: number;
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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const spotsFilled = event.spotsFilled || 0;
  const isSoldOut = spotsFilled >= event.maxCapacity;
  const isConfirmed = spotsFilled >= event.minCapacity;

  // Calculate percentage for progress bars
  const minProgress = Math.min((spotsFilled / event.minCapacity) * 100, 100);
  const maxProgress = Math.min((spotsFilled / event.maxCapacity) * 100, 100);

  const discount = event.femaleDiscount || 0;
  const isFemale = user && user.gender === 'FEMALE';
  const showFemaleDiscount = isFemale && discount > 0;
  const finalPrice = showFemaleDiscount ? Math.max(0, event.price - discount) : event.price;

  return (
    <article
      id={`event-card-${event.id}`}
      className="event-card glass-panel-interactive animate-slide-up"
      onClick={onClick}
    >
      <div className="card-badge-container">
        {discount > 0 && !isSoldOut && (
          <span className="badge badge-discount-tag">♀ Save ₹{discount.toLocaleString('en-IN')}!</span>
        )}
        {isSoldOut ? (
          <span className="badge badge-soldout" id={`badge-soldout-${event.id}`}>Sold Out</span>
        ) : isConfirmed ? (
          <span className="badge badge-confirmed" id={`badge-confirmed-${event.id}`}>Session Confirmed</span>
        ) : (
          <span className="badge badge-pending" id={`badge-pending-${event.id}`}>Awaiting Threshold</span>
        )}
      </div>

      <div className="card-content">
        <h3 className="card-title">{event.title}</h3>
        
        <div className="card-meta">
          <div className="meta-item">
            <Calendar size={16} />
            <span>{formattedDate}</span>
          </div>
          <div className="meta-item price-tag">
            <IndianRupee size={16} />
            {showFemaleDiscount ? (
              <span className="price-text">
                <span className="original-price">₹{event.price.toLocaleString('en-IN')}</span>{' '}
                <span className="discounted-price">₹{finalPrice.toLocaleString('en-IN')}</span> per person
              </span>
            ) : (
              <span>{event.price.toLocaleString('en-IN')} per person</span>
            )}
          </div>
        </div>

        <p className="card-description">{event.description.substring(0, 140)}...</p>

        <div className="capacity-section">
          <div className="capacity-labels">
            <span className="capacity-status-text">
              {isSoldOut 
                ? `${spotsFilled}/${event.maxCapacity} spots filled`
                : !isConfirmed 
                  ? `${spotsFilled} spots filled (10 min needed)`
                  : `${spotsFilled}/${event.maxCapacity} spots filled`
              }
            </span>
            <span className="capacity-percentage">
              {Math.round(isConfirmed ? maxProgress : minProgress)}%
            </span>
          </div>

          <div className="progress-bar-track">
            <div 
              className={`progress-bar-fill ${isSoldOut ? 'fill-soldout' : isConfirmed ? 'fill-confirmed' : 'fill-pending'}`}
              style={{ width: `${isConfirmed ? maxProgress : minProgress}%` }}
            ></div>
          </div>

          {!isConfirmed && !isSoldOut && (
            <p className="capacity-tip">
              🔥 {event.minCapacity - spotsFilled} more spots needed to confirm this session!
            </p>
          )}
          {isConfirmed && !isSoldOut && (
            <p className="capacity-tip success">
              ✅ This weekend session is confirmed to run! {event.maxCapacity - spotsFilled} spots left.
            </p>
          )}
        </div>
        
        <button 
          id={`view-details-btn-${event.id}`}
          className="btn-secondary card-action"
          type="button"
        >
          {isSoldOut ? 'View Event Details' : 'Book Now & View Details'}
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
        .card-badge-container {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 10;
        }
        .badge {
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .badge-soldout {
          background: rgba(244, 63, 94, 0.2);
          border: 1px solid rgba(244, 63, 94, 0.4);
          color: var(--accent-rose);
        }
        .badge-confirmed {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: var(--accent-emerald);
        }
        .badge-pending {
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: var(--accent-amber);
        }
        .card-content {
          padding: 2.25rem 2rem 2rem;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .card-title {
          font-size: 1.4rem;
          line-height: 1.3;
          margin-bottom: 1rem;
          margin-top: 0.5rem;
          color: #fff;
          background: linear-gradient(135deg, #fff 60%, var(--fg-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .card-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          font-size: 0.9rem;
          color: var(--fg-secondary);
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .price-tag {
          color: var(--accent-cyan);
          font-weight: 600;
        }
        .card-description {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--fg-secondary);
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }
        .capacity-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          padding: 1rem 1.25rem;
          border-radius: 14px;
          margin-bottom: 1.5rem;
        }
        .capacity-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--fg-secondary);
        }
        .capacity-status-text {
          color: var(--fg-primary);
        }
        .progress-bar-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.5s ease-out;
        }
        .fill-pending {
          background: linear-gradient(90deg, var(--accent-amber) 0%, #f5b041 100%);
        }
        .fill-confirmed {
          background: linear-gradient(90deg, var(--accent-indigo) 0%, var(--accent-purple) 100%);
        }
        .fill-soldout {
          background: linear-gradient(90deg, var(--accent-rose) 0%, #e74c3c 100%);
        }
        .capacity-tip {
          font-size: 0.75rem;
          color: var(--accent-amber);
          margin-top: 0.25rem;
        }
        .capacity-tip.success {
          color: var(--accent-emerald);
        }
        .card-action {
          width: 100%;
          justify-content: center;
          padding: 0.85rem;
        }
        .event-card:hover .card-action {
          background: var(--gradient-primary);
          color: #fff;
          border-color: transparent;
        }
        .badge-discount-tag {
          background: rgba(236, 72, 153, 0.2);
          border: 1px solid rgba(236, 72, 153, 0.4);
          color: var(--accent-rose);
          margin-right: 0.5rem;
        }
        .original-price {
          text-decoration: line-through;
          color: var(--fg-tertiary);
          font-size: 0.85rem;
        }
        .discounted-price {
          color: var(--accent-emerald);
          font-weight: 700;
        }
      `}</style>
    </article>
  );
}
