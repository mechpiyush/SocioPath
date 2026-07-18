'use client';

import { Mail, GraduationCap, Heart } from 'lucide-react';

interface FooterProps {
  onOpenInfo?: (type: 'about' | 'privacy' | 'terms') => void;
}

export default function Footer({ onOpenInfo }: FooterProps) {
  return (
    <footer className="site-footer glass-panel animate-fade-in" id="main-footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-column footer-about">
          <h3>SocioPath</h3>
          <p>
            An elite weekend retreat social experience platform matching late-night jamming, karaoke, and interactive games with stranger networking.
          </p>
        </div>

        {/* Links Section */}
        <div className="footer-column">
          <h4>Legal & Info</h4>
          <ul className="footer-links">
            <li><a href="#" id="footer-link-about" onClick={(e) => { e.preventDefault(); onOpenInfo?.('about'); }}>About Us</a></li>
            <li><a href="#" id="footer-link-privacy" onClick={(e) => { e.preventDefault(); onOpenInfo?.('privacy'); }}>Privacy Policy</a></li>
            <li><a href="#" id="footer-link-terms" onClick={(e) => { e.preventDefault(); onOpenInfo?.('terms'); }}>Terms of Service</a></li>
          </ul>
        </div>

        {/* Help Support Section */}
        <div className="footer-column footer-support">
          <h4>Help & Support</h4>
          <p>Have questions? Reach out to us directly via email at:</p>
          <a href="mailto:iiit.piyush@gmail.com" className="email-link" id="support-email-link">
            <Mail size={16} />
            <span>iiit.piyush@gmail.com</span>
          </a>
        </div>

        {/* Founder Section */}
        <div className="footer-column footer-founder" id="founder-profile">
          <h4>Founders & Team</h4>
          <div className="founder-card">
            <div className="founder-info">
              <span className="founder-title">Founder & Owner</span>
              <h5>Piyush Sharma</h5>
              <div className="founder-credentials">
                <GraduationCap size={14} className="icon-edu" />
                <span>B.Tech CSE, IIT Mandi</span>
              </div>
              <p>Structuring premium social retreats and building operational trust for Mumbaikars.</p>
            </div>
            <a
              id="founder-linkedin-link"
              href="https://in.linkedin.com/in/piyush-sharma21"
              target="_blank"
              rel="noopener noreferrer"
              className="linkedin-link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
              <span>Connect on LinkedIn</span>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="copyright-text">&copy; {new Date().getFullYear()} SocioPath. All rights reserved.</p>
          <p className="credit-text">
            Made with <Heart size={12} className="heart-icon" /> in Mumbai
          </p>
        </div>
      </div>

      <style jsx>{`
        .site-footer {
          margin-top: auto;
          border-top: 1px solid var(--border-color);
          background: rgba(7, 10, 19, 0.95);
        }
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 4rem 2rem 3rem;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr 1fr 1.3fr;
          gap: 3rem;
        }
        .footer-column h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #fff;
          font-family: var(--font-display);
        }
        .footer-column h4 {
          font-size: 1rem;
          margin-bottom: 1.25rem;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .footer-column p {
          font-size: 0.9rem;
          line-height: 1.6;
          color: var(--fg-secondary);
        }
        .footer-about p {
          max-width: 280px;
        }
        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .footer-links a {
          font-size: 0.9rem;
          color: var(--fg-secondary);
        }
        .footer-links a:hover {
          color: var(--accent-cyan);
        }
        .footer-support p {
          margin-bottom: 0.75rem;
        }
        .email-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--accent-cyan);
          font-weight: 600;
          font-size: 0.9rem;
        }
        .email-link:hover {
          text-decoration: underline;
        }
        .founder-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .founder-title {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-indigo);
          font-weight: 700;
          display: block;
          margin-bottom: 0.25rem;
        }
        .founder-info h5 {
          font-size: 1.1rem;
          color: #fff;
          margin-bottom: 0.35rem;
        }
        .founder-credentials {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: var(--fg-primary);
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .icon-edu {
          color: var(--accent-cyan);
        }
        .founder-info p {
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .linkedin-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          padding: 0.5rem 0.85rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .linkedin-link:hover {
          background: #0077b5;
          border-color: #0077b5;
          color: #fff;
        }
        .footer-bottom {
          border-top: 1px solid var(--border-color);
          padding: 1.5rem 2rem;
          background: rgba(3, 7, 18, 0.98);
        }
        .footer-bottom-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: var(--fg-tertiary);
          flex-wrap: wrap;
          gap: 1rem;
        }
        .heart-icon {
          color: var(--accent-rose);
          display: inline-block;
        }
        
        @media (max-width: 992px) {
          .footer-container {
            grid-template-columns: 1.5fr 1fr;
            gap: 2rem;
          }
        }
        @media (max-width: 576px) {
          .footer-container {
            grid-template-columns: 1fr;
          }
          .footer-about p {
            max-width: 100%;
          }
        }
      `}</style>
    </footer>
  );
}
