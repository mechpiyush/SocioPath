'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, IndianRupee, ShieldAlert, Users, ExternalLink } from 'lucide-react';

interface Event {
  id: string;
  title: string;
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

interface BookingCheckoutModalProps {
  isOpen: boolean;
  event: Event | null;
  onClose: () => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
  onInitializeBooking: (eventId: string, maleQuantity: number, femaleQuantity: number) => void;
  bookingLoading: boolean;
  user?: any;
}

const MAX_TICKETS_PER_BOOKING = 5;

function GenderTicketCard({
  label,
  unitPrice,
  originalPrice,
  qty,
  onChange,
  remaining,
  trackMax,
  accentClass,
}: {
  label: string;
  unitPrice: number;
  originalPrice?: number;
  qty: number;
  onChange: (n: number) => void;
  remaining: number;
  trackMax: number;
  accentClass: string;
}) {
  const hasDiscount = originalPrice !== undefined && originalPrice > unitPrice;
  const canIncrease = qty < remaining;

  return (
    <div className={`gender-card ${accentClass}`}>
      <div className="gender-card-header">
        <span className="gender-card-label">{label}</span>
        <span className="gender-card-available">{remaining} available</span>
      </div>

      <div className="gender-card-price">
        {hasDiscount && <span className="original-price">₹{originalPrice!.toLocaleString('en-IN')}</span>}
        <span className="unit-price">
          <IndianRupee size={15} />
          {unitPrice.toLocaleString('en-IN')}
        </span>
        <span className="price-per">/ticket</span>
      </div>

      <div className="qty-stepper">
        <button
          type="button"
          className="qty-btn"
          onClick={() => onChange(Math.max(0, qty - 1))}
          disabled={qty <= 0}
          aria-label={`Decrease ${label} tickets`}
        >
          −
        </button>
        <span className="qty-value">{qty}</span>
        <button
          type="button"
          className="qty-btn"
          onClick={() => onChange(Math.min(remaining, qty + 1))}
          disabled={!canIncrease}
          aria-label={`Increase ${label} tickets`}
        >
          +
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={trackMax}
        value={qty}
        onChange={(e) => onChange(Math.min(remaining, Number(e.target.value)))}
        className="qty-slider"
        aria-label={`${label} ticket quantity`}
      />
    </div>
  );
}

export default function BookingCheckoutModal({
  isOpen,
  event,
  onClose,
  isAuthenticated,
  onOpenAuth,
  onInitializeBooking,
  bookingLoading,
  user,
}: BookingCheckoutModalProps) {
  const [maleQty, setMaleQty] = useState(0);
  const [femaleQty, setFemaleQty] = useState(0);
  const [waiverChecked, setWaiverChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMaleQty(0);
      setFemaleQty(0);
      setWaiverChecked(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  const spotsRemaining = event ? Math.max(0, event.maxCapacity - (event.spotsFilled || 0)) : 0;
  // Fixed track scale shared by both sliders — capacity is enforced via clamping the
  // committed value, not by shrinking the slider's max, so the thumb never jumps.
  const overallCap = Math.min(MAX_TICKETS_PER_BOOKING, spotsRemaining);

  const maleRemaining = Math.max(0, Math.min(overallCap - femaleQty, overallCap));
  const femaleRemaining = Math.max(0, Math.min(overallCap - maleQty, overallCap));

  const handleMaleChange = (n: number) => setMaleQty(Math.max(0, Math.min(n, overallCap - femaleQty)));
  const handleFemaleChange = (n: number) => setFemaleQty(Math.max(0, Math.min(n, overallCap - maleQty)));

  const discountEnabled = !!event && event.genderPricingEnabled !== false && (event.femaleDiscount || 0) > 0;
  const maleUnitPrice = event?.price || 0;
  const femaleUnitPrice = event
    ? (discountEnabled ? Math.max(0, event.price - (event.femaleDiscount || 0)) : event.price)
    : 0;

  const receipt = useMemo(() => {
    const maleSubtotal = maleQty * maleUnitPrice;
    const femaleSubtotal = femaleQty * femaleUnitPrice;
    const subtotal = maleSubtotal + femaleSubtotal;
    const discountAmount = discountEnabled ? femaleQty * ((event?.price || 0) - femaleUnitPrice) : 0;
    const taxes = Math.round(subtotal * 0.18 * 100) / 100;
    const total = subtotal + taxes;
    return { maleSubtotal, femaleSubtotal, subtotal, discountAmount, taxes, total };
  }, [maleQty, femaleQty, maleUnitPrice, femaleUnitPrice, discountEnabled, event]);

  const totalQty = maleQty + femaleQty;

  if (!isOpen || !event) return null;

  const mapsSearchLink = event.venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`
    : undefined;

  const handleSubmit = () => {
    if (totalQty < 1) {
      setErrorMessage('Select at least one ticket to continue.');
      return;
    }

    if (!waiverChecked) {
      setErrorMessage('You must read and agree to the Maharashtra legal drinking age compliance waiver.');
      return;
    }

    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }

    if (!user || !user.gender) {
      setErrorMessage('Please set your gender in your Profile settings before booking.');
      return;
    }

    onInitializeBooking(event.id, maleQty, femaleQty);
  };

  return (
    <div id="checkout-modal-backdrop" className="checkout-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="checkout-card glass-panel animate-scale-up" role="dialog" aria-modal="true">
        <button className="close-btn" onClick={onClose} aria-label="Close checkout">
          <X size={20} />
        </button>

        <div className="checkout-header">
          <h2>{event.title}</h2>
          <span className="checkout-subtitle">Choose your tickets</span>
        </div>

        <div className="checkout-grid">
          {/* Left column: 65% */}
          <div className="checkout-left">
            <div className="ticket-cards-row">
              <GenderTicketCard
                label="Male"
                unitPrice={maleUnitPrice}
                qty={maleQty}
                onChange={handleMaleChange}
                remaining={maleRemaining}
                trackMax={overallCap}
                accentClass="accent-male"
              />
              <GenderTicketCard
                label="Female"
                unitPrice={femaleUnitPrice}
                originalPrice={discountEnabled ? event.price : undefined}
                qty={femaleQty}
                onChange={handleFemaleChange}
                remaining={femaleRemaining}
                trackMax={overallCap}
                accentClass="accent-female"
              />
            </div>

            {overallCap === 0 && (
              <p className="capacity-note">No spots remaining for this session.</p>
            )}

            {event.venueMapEmbedUrl && (
              <div className="map-card">
                {mapsSearchLink && (
                  <a
                    href={mapsSearchLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-open-btn"
                  >
                    <ExternalLink size={13} />
                    <span>Open in Maps</span>
                  </a>
                )}
                <iframe
                  src={event.venueMapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Venue location"
                  className="map-iframe"
                />
              </div>
            )}

            <div className="legal-waiver-wrapper">
              <label className="checkbox-container" htmlFor="checkout-waiver-checkbox">
                <input
                  id="checkout-waiver-checkbox"
                  type="checkbox"
                  checked={waiverChecked}
                  onChange={(e) => {
                    setWaiverChecked(e.target.checked);
                    if (e.target.checked) setErrorMessage('');
                  }}
                />
                <span className="checkmark"></span>
                <span className="waiver-text">
                  <span className="waiver-highlight">BYOD Compliance Waiver:</span> I confirm all attendees meet Maharashtra's legal drinking age (21+ beer/wine, 25+ spirits).
                </span>
              </label>
            </div>
          </div>

          {/* Right column: 35%, sticky receipt */}
          <div className="checkout-right">
            <div className="receipt-card">
              <div className="receipt-header">
                <Users size={16} />
                <span>Order Summary</span>
              </div>

              <div className="receipt-items">
                {maleQty > 0 && (
                  <div className="receipt-row">
                    <span>Male × {maleQty}</span>
                    <span className="receipt-figure">₹{receipt.maleSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {femaleQty > 0 && (
                  <div className="receipt-row">
                    <span>Female × {femaleQty}</span>
                    <span className="receipt-figure">₹{receipt.femaleSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {totalQty === 0 && (
                  <p className="receipt-empty">No tickets selected yet.</p>
                )}
              </div>

              {totalQty > 0 && (
                <>
                  <div className="receipt-divider" />
                  <div className="receipt-row subtle">
                    <span>Subtotal</span>
                    <span className="receipt-figure">₹{receipt.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {receipt.discountAmount > 0 && (
                    <div className="receipt-row subtle discount">
                      <span>Women's Discount</span>
                      <span className="receipt-figure">−₹{receipt.discountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="receipt-row subtle">
                    <span>Taxes & Fees (18%)</span>
                    <span className="receipt-figure">₹{receipt.taxes.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="receipt-divider" />
                  <div className="receipt-row grand-total">
                    <span>Grand Total</span>
                    <span className="receipt-figure">₹{receipt.total.toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}

              {errorMessage && (
                <p className="modal-error-msg" id="checkout-error-alert">
                  <ShieldAlert size={14} />
                  {errorMessage}
                </p>
              )}

              <button
                id="checkout-submit-btn"
                className="btn-primary receipt-checkout-btn"
                type="button"
                disabled={bookingLoading || totalQty < 1}
                onClick={handleSubmit}
              >
                {bookingLoading
                  ? 'Initializing...'
                  : isAuthenticated
                    ? `Proceed to Pay ₹${receipt.total.toLocaleString('en-IN')}`
                    : 'Sign In & Proceed to Pay'
                }
              </button>
              <p className="secure-badge">🔒 Secure Payment via Razorpay</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-backdrop {
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
        .checkout-card {
          width: 100%;
          max-width: 1100px;
          border-radius: 28px;
          position: relative;
          box-shadow: var(--shadow-lg), 0 0 50px -10px rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.08);
          max-height: 92vh;
          overflow-y: auto;
          padding: 2.5rem;
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
        .checkout-header {
          margin-bottom: 1.75rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1.25rem;
        }
        .checkout-header h2 {
          font-size: 1.75rem;
          color: #fff;
          margin-bottom: 0.35rem;
        }
        .checkout-subtitle {
          font-size: 0.9rem;
          color: var(--fg-secondary);
        }
        .checkout-grid {
          display: grid;
          grid-template-columns: 65fr 35fr;
          gap: 2rem;
        }
        .checkout-left {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* ── Ticket cards: two columns ───────────────────────────────── */
        /* :global() is required here — GenderTicketCard is a separate child
           component, so styled-jsx's per-component scoping would otherwise
           silently drop every rule below since they'd never match its JSX. */
        .ticket-cards-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        :global(.gender-card) {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
          min-width: 0;
        }
        :global(.gender-card.accent-male) {
          border-top: 3px solid var(--accent-cyan);
        }
        :global(.gender-card.accent-female) {
          border-top: 3px solid var(--accent-rose);
        }
        :global(.gender-card-header) {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }
        :global(.gender-card-label) {
          font-size: 1.05rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.01em;
        }
        :global(.gender-card-available) {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--accent-emerald);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 9999px;
          padding: 0.2rem 0.55rem;
          white-space: nowrap;
          flex-shrink: 0;
        }
        :global(.gender-card-price) {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        :global(.original-price) {
          text-decoration: line-through;
          color: var(--fg-tertiary);
          font-size: 0.8rem;
          font-weight: 500;
        }
        :global(.unit-price) {
          display: inline-flex;
          align-items: center;
          color: var(--accent-cyan);
          font-weight: 800;
          font-size: 1.4rem;
          font-family: var(--font-display);
        }
        :global(.price-per) {
          font-size: 0.72rem;
          color: var(--fg-tertiary);
          font-weight: 500;
        }

        /* ── Stepper + slider, stacked cleanly within each card ──────── */
        :global(.qty-stepper) {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.45rem;
        }
        :global(.qty-btn) {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          font-size: 1.15rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        :global(.qty-btn:disabled) {
          opacity: 0.3;
          cursor: not-allowed;
        }
        :global(.qty-btn:not(:disabled):hover) {
          background: rgba(255, 255, 255, 0.14);
        }
        :global(.qty-value) {
          min-width: 22px;
          text-align: center;
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
        }
        :global(.qty-slider) {
          width: 100%;
          accent-color: var(--accent-indigo);
        }
        .capacity-note {
          font-size: 0.8rem;
          color: var(--accent-rose);
        }

        /* ── Google Maps module ──────────────────────────────────────── */
        .map-card {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          aspect-ratio: 16 / 6;
          max-height: 170px;
        }
        .map-iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
        }
        .map-open-btn {
          position: absolute;
          top: 0.6rem;
          left: 0.6rem;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(10, 12, 20, 0.85);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.4rem 0.65rem;
          border-radius: 8px;
          text-decoration: none;
          box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.4);
          transition: background 0.15s;
        }
        .map-open-btn:hover {
          background: rgba(10, 12, 20, 0.98);
        }

        /* ── Compliance waiver — compact, sits below the map ─────────── */
        .legal-waiver-wrapper {
          background: rgba(245, 158, 11, 0.04);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 12px;
          padding: 0.75rem 1rem;
        }
        .checkbox-container {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          cursor: pointer;
          font-size: 0.75rem;
          color: var(--fg-secondary);
          line-height: 1.45;
          position: relative;
          user-select: none;
        }
        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        .checkmark {
          width: 16px;
          height: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          flex-shrink: 0;
          margin-top: 0.1rem;
          position: relative;
          transition: all 0.2s;
        }
        .checkbox-container:hover input ~ .checkmark {
          border-color: var(--fg-secondary);
        }
        .checkbox-container input:checked ~ .checkmark {
          background-color: var(--accent-indigo);
          border-color: var(--accent-indigo);
        }
        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
          left: 4px;
          top: 1px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .checkbox-container input:checked ~ .checkmark:after {
          display: block;
        }
        .waiver-highlight {
          color: #fff;
          font-weight: 600;
        }

        /* ── Order summary panel ─────────────────────────────────────── */
        .checkout-right {
          position: relative;
        }
        .receipt-card {
          position: sticky;
          top: 0;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .receipt-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--fg-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--border-color);
        }
        .receipt-items {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 0.9rem;
          color: #fff;
          font-weight: 600;
        }
        .receipt-figure {
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }
        .receipt-row.subtle {
          color: var(--fg-secondary);
          font-weight: 500;
          font-size: 0.85rem;
        }
        .receipt-row.discount {
          color: var(--accent-emerald);
        }
        .receipt-row.grand-total {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--accent-cyan);
          padding-top: 0.15rem;
        }
        .receipt-empty {
          font-size: 0.8rem;
          color: var(--fg-tertiary);
          text-align: center;
          padding: 0.5rem 0;
        }
        .receipt-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.15rem 0;
        }
        .modal-error-msg {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--accent-rose);
          font-size: 0.75rem;
          line-height: 1.4;
          background: rgba(244, 63, 94, 0.05);
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(244, 63, 94, 0.1);
        }
        .receipt-checkout-btn {
          width: 100%;
          justify-content: center;
          padding: 1rem;
          font-size: 0.95rem;
          margin-top: 0.25rem;
          transition: box-shadow 0.25s, transform 0.15s;
        }
        .receipt-checkout-btn:not(:disabled):hover {
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.4), 0 0 24px 4px rgba(99, 102, 241, 0.45);
          transform: translateY(-1px);
        }
        .secure-badge {
          font-size: 0.7rem;
          color: var(--fg-tertiary);
          text-align: center;
        }

        @media (max-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
          .receipt-card {
            position: static;
          }
          .checkout-card {
            padding: 1.5rem;
          }
        }
        @media (max-width: 560px) {
          .ticket-cards-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
