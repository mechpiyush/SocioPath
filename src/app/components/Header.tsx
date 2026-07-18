'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Shield, ChevronDown, Ticket, LogOut } from 'lucide-react';

interface HeaderProps {
  user: any;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
}

export default function Header({ user, onOpenAuth, onOpenProfile, onSignOut }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="site-header glass-panel animate-fade-in" id="main-header">
      <div className="header-container">
        {/* Brand Logo */}
        <div className="brand-logo-wrapper" id="brand-logo">
          <a href="#" className="brand-logo-link">
            <span className="logo-icon-glow"></span>
            <span className="brand-text">SocioPath</span>
          </a>
        </div>

        {/* Navigation Action */}
        <div className="nav-actions">
          {user ? (
            <div className="user-dropdown-wrapper" ref={dropdownRef}>
              <button
                id="header-user-avatar-btn"
                className="avatar-trigger-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <div className="avatar-image-container">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="avatar-img" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <ChevronDown size={14} className={`arrow-icon ${dropdownOpen ? 'rotate' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu glass-panel animate-scale-up" id="header-avatar-dropdown">
                  <div className="dropdown-user-info">
                    <p className="dropdown-user-name">{user.name || 'SocioPath Member'}</p>
                    <p className="dropdown-user-email">{user.email}</p>
                  </div>
                  
                  <hr className="dropdown-divider" />

                  <button
                    id="dropdown-view-profile-btn"
                    className="dropdown-item"
                    onClick={() => {
                      onOpenProfile();
                      setDropdownOpen(false);
                    }}
                  >
                    <User size={16} />
                    <span>View Profile</span>
                  </button>

                  <button
                    id="dropdown-my-bookings-btn"
                    className="dropdown-item"
                    onClick={() => {
                      onOpenProfile(); // ProfileModal handles booking list
                      setDropdownOpen(false);
                    }}
                  >
                    <Ticket size={16} />
                    <span>My Bookings</span>
                  </button>

                  <hr className="dropdown-divider" />

                  <button
                    id="dropdown-signout-btn"
                    className="dropdown-item dropdown-signout"
                    onClick={() => {
                      onSignOut();
                      setDropdownOpen(false);
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="header-signin-btn"
              className="btn-secondary signin-trigger-btn"
              onClick={onOpenAuth}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .site-header {
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid var(--border-color);
        }
        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.85rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand-logo-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.03em;
          color: #fff;
          position: relative;
        }
        .logo-icon-glow {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-cyan);
          box-shadow: 0 0 12px 2px var(--accent-cyan);
          display: inline-block;
        }
        .brand-text {
          background: linear-gradient(135deg, #fff 50%, var(--accent-indigo) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .avatar-trigger-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 9999px;
        }
        .avatar-trigger-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--border-hover);
        }
        .avatar-image-container {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .arrow-icon {
          color: var(--fg-secondary);
          transition: transform var(--transition-fast);
        }
        .arrow-icon.rotate {
          transform: rotate(180deg);
        }
        .user-dropdown-wrapper {
          position: relative;
        }
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 260px;
          border-radius: 18px;
          padding: 0.75rem;
          box-shadow: var(--shadow-lg), 0 0 30px -5px rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 200;
          background: rgba(11, 15, 25, 0.98) !important;
        }
        .dropdown-user-info {
          padding: 0.5rem 0.75rem;
        }
        .dropdown-user-name {
          font-weight: 700;
          color: #fff;
          font-size: 0.95rem;
          margin-bottom: 0.15rem;
        }
        .dropdown-user-email {
          font-size: 0.8rem;
          color: var(--fg-tertiary);
        }
        .dropdown-divider {
          border: 0;
          height: 1px;
          background: var(--border-color);
          margin: 0.5rem 0;
        }
        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--fg-secondary);
          text-align: left;
        }
        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
        }
        .dropdown-signout:hover {
          background: rgba(244, 63, 94, 0.08);
          color: var(--accent-rose);
        }
        .signin-trigger-btn {
          padding: 0.5rem 1.25rem;
          font-size: 0.85rem;
        }
      `}</style>
    </header>
  );
}
