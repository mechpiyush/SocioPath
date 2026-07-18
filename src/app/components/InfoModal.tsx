'use client';

import { X, Shield, ScrollText, Heart, GraduationCap } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'about' | 'privacy' | 'terms' | '';
}

export default function InfoModal({ isOpen, onClose, type }: InfoModalProps) {
  if (!isOpen || !type) return null;

  const getContent = () => {
    switch (type) {
      case 'about':
        return {
          title: 'About SocioPath',
          icon: <Heart className="modal-icon text-rose" />,
          body: (
            <div className="modal-content-rich">
              <p className="lead-text">
                SocioPath is Mumbai's premier weekend retreat platform, curating elite late-night social gatherings that bridge stranger networking with interactive experiences.
              </p>
              
              <h4>Our Vision</h4>
              <p>
                We believe modern city life has made authentic human connection rare. SocioPath was born to break the ice. We curate high-end, closed-door socials containing safe spaces for like-minded people to meet, participate in jamming sessions, perform karaoke, and play interactive stranger-icebreaker games.
              </p>

              <h4>The Operations</h4>
              <p>
                Our events are strictly capped to ensure safety, comfort, and equal participation. We maintain a strict 60% maximum cap on male bookings to create a balanced, premium social experience. Each gathering is hosted at curated private venues across South Mumbai and Bandra.
              </p>

              <div className="founder-highlight glass-panel">
                <div className="founder-header">
                  <GraduationCap className="icon-edu" />
                  <div>
                    <h5>Piyush Sharma</h5>
                    <span className="subtitle">Founder & Owner • B.Tech CSE, IIT Mandi</span>
                  </div>
                </div>
                <p className="founder-quote">
                  "SocioPath is designed for those who appreciate premium operations, curated crowds, and genuine conversations. We combine technology, trust, and strict hosting standards to deliver unmatched Mumbai socials."
                </p>
              </div>
            </div>
          ),
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          icon: <Shield className="modal-icon text-cyan" />,
          body: (
            <div className="modal-content-rich">
              <p className="last-updated">Last Updated: July 2026</p>
              
              <p>
                At SocioPath, we take your privacy and database security extremely seriously. This policy outlines how we collect, store, and process your details.
              </p>

              <h4>1. Information We Collect</h4>
              <ul>
                <li><strong>Profile Info:</strong> Name, Google Avatar, Gender, Mobile Number, City, Hometown, Date of Birth, Occupation, and Instagram Username.</li>
                <li><strong>Authentication:</strong> We use secure Google OAuth. We only request basic user identity metadata (email, public name, picture). We never store your Google password.</li>
                <li><strong>Payment Data:</strong> All payments are processed through Razorpay. We do not store credit card numbers or banking secrets on our SQLite servers.</li>
              </ul>

              <h4>2. How We Use Information</h4>
              <p>
                We use your details to verify invitee capacity rules (such as enforcing the 60% male invitation cap), personalize discount offers, issue immediate transaction refunds when events are rescheduled or cancelled, and print security lists for our host venues.
              </p>

              <h4>3. Data Sharing</h4>
              <p>
                We do not sell, rent, or trade user profile details with third-party marketers. Your social tags (like Instagram handles) are optionally displayed only to other validated guests booking the same weekend session to facilitate healthy community building.
              </p>
            </div>
          ),
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          icon: <ScrollText className="modal-icon text-indigo" />,
          body: (
            <div className="modal-content-rich">
              <p className="last-updated">Last Updated: July 2026</p>

              <h4>1. Age & Legal Compliance (Maharashtra State)</h4>
              <p>
                SocioPath experiences are strictly Bring Your Own Drinks (BYOD) compliant. By booking a ticket, you affirm that you are of legal drinking age in the State of Maharashtra (21 years for beer and mild wines, 25 years for hard spirits and liquors). Host venues reserve the right to inspect Government IDs at the door.
              </p>

              <h4>2. Booking Cancellations & Refunds</h4>
              <ul>
                <li><strong>User-Initiated:</strong> You can cancel your booking up to <strong>3 days (72 hours) prior</strong> to the event date. Cancellations initiated before this window receive an **immediate automatic refund** to the original payment source. No refunds will be issued for cancellations requested within 72 hours of the social.</li>
                <li><strong>Administrator-Initiated:</strong> If an event is cancelled by the admin (e.g. under-capacity thresholds or scheduling conflicts), **immediate, full refunds** are processed automatically for all confirmed ticket holders.</li>
              </ul>

              <h4>3. Gender Capping Regulation</h4>
              <p>
                To maintain a safe and balanced social environment, male invitations are strictly capped at **60% of total event capacity**. If a male booking is attempted after this cap is reached, the transaction will be blocked. Falsifying gender profile settings to bypass this cap will result in immediate ban and booking forfeiture without refund.
              </p>

              <h4>4. Code of Conduct</h4>
              <p>
                We operate under zero-tolerance safety policies. Harassment, verbal abuse, or non-consensual behavior at our socials will result in immediate expulsion by venue security and permanent blacklist from SocioPath.
              </p>
            </div>
          ),
        };
      default:
        return { title: '', icon: null, body: null };
    }
  };

  const { title, icon, body } = getContent();

  return (
    <div className="info-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="info-card glass-panel animate-scale-up" role="dialog" aria-modal="true">
        <button className="info-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="info-header">
          {icon}
          <h2>{title}</h2>
        </div>

        <div className="info-body">
          {body}
        </div>
      </div>

      <style jsx>{`
        .info-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(3, 7, 18, 0.96);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 2rem;
        }
        .info-card {
          width: 100%;
          max-width: 600px;
          border-radius: 24px;
          position: relative;
          box-shadow: var(--shadow-lg), 0 0 50px -15px rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.08);
          max-height: 80vh;
          overflow-y: auto;
          background: rgba(11, 15, 25, 0.95);
        }
        .info-close-btn {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          color: var(--fg-tertiary);
          padding: 0.4rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          cursor: pointer;
        }
        .info-close-btn:hover {
          color: var(--fg-primary);
          background: rgba(255, 255, 255, 0.08);
        }
        .info-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 2.5rem 2.5rem 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        .info-header h2 {
          font-size: 1.5rem;
          color: #fff;
          font-family: var(--font-display);
        }
        :global(.modal-icon) {
          width: 24px;
          height: 24px;
        }
        :global(.text-rose) {
          color: var(--accent-rose);
        }
        :global(.text-cyan) {
          color: var(--accent-cyan);
        }
        :global(.text-indigo) {
          color: var(--accent-indigo);
        }
        .info-body {
          padding: 2rem 2.5rem 2.5rem;
        }
        :global(.modal-content-rich) {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          color: var(--fg-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }
        :global(.lead-text) {
          font-size: 1.05rem;
          color: #fff;
          font-weight: 500;
        }
        :global(.last-updated) {
          font-size: 0.75rem;
          color: var(--fg-tertiary);
          margin-bottom: 0.5rem;
        }
        :global(.modal-content-rich h4) {
          font-size: 1.1rem;
          color: #fff;
          margin-top: 0.75rem;
          font-weight: 600;
        }
        :global(.modal-content-rich ul) {
          padding-left: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        :global(.founder-highlight) {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.25rem;
          margin-top: 1rem;
        }
        :global(.founder-header) {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        :global(.icon-edu) {
          color: var(--accent-cyan);
          width: 20px;
          height: 20px;
        }
        :global(.founder-header h5) {
          font-size: 0.95rem;
          color: #fff;
          margin: 0;
        }
        :global(.founder-header .subtitle) {
          font-size: 0.75rem;
          color: var(--fg-tertiary);
          display: block;
        }
        :global(.founder-quote) {
          font-style: italic;
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--fg-primary);
          margin: 0;
          position: relative;
        }
      `}</style>
    </div>
  );
}
