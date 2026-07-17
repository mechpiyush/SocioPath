'use client';

import { useState, useEffect, useRef } from 'react';
import { X, LogIn, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  googleClientId: string;
}

export default function AuthModal({ isOpen, onClose, onSuccess, googleClientId }: AuthModalProps) {
  const [isMockMode, setIsMockMode] = useState(!googleClientId);
  const [mockEmail, setMockEmail] = useState('');
  const [mockName, setMockName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset states on open
    if (isOpen) {
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isMockMode || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      if ((window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (res: any) => {
              handleAuthResponse({ credential: res.credential });
            },
          });

          const btnDiv = document.getElementById('google-signin-btn-container');
          if (btnDiv) {
            (window as any).google.accounts.id.renderButton(btnDiv, {
              theme: 'filled_dark',
              size: 'large',
              width: 320,
              text: 'signin_with',
              shape: 'pill',
            });
          }
        } catch (err) {
          console.error('Failed to initialize Google GSI:', err);
          setError('Google Sign-In failed to initialize. Using Mock Mode instead.');
          setIsMockMode(true);
        }
      } else {
        // Retry in case script is still loading
        setError('Google Client SDK not loaded. Try switching to Developer Mock Mode.');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, isMockMode, googleClientId]);

  const handleAuthResponse = async (payload: { credential?: string; isMock?: boolean; mockData?: any }) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockEmail) {
      setError('Email is required for mock login.');
      return;
    }
    handleAuthResponse({
      isMock: true,
      mockData: {
        email: mockEmail.trim(),
        name: mockName.trim() || 'Mumbai Insider',
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div id="auth-modal-backdrop" className="auth-backdrop" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="auth-card glass-panel animate-scale-up" role="dialog" aria-modal="true">
        <button id="auth-modal-close" className="close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="auth-header">
          <h2 id="auth-modal-title">Access SocioPath</h2>
          <p>Join Mumbai's premium late-night social experience</p>
        </div>

        {error && (
          <div className="auth-error animate-fade-in" id="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="mode-toggle">
          <button
            id="toggle-oauth-btn"
            type="button"
            className={!isMockMode ? 'active' : ''}
            onClick={() => {
              if (!googleClientId) {
                setError('Google Client ID is missing in configuration. Mock Mode is mandatory.');
                return;
              }
              setIsMockMode(false);
            }}
          >
            Google Sign-In
          </button>
          <button
            id="toggle-mock-btn"
            type="button"
            className={isMockMode ? 'active' : ''}
            onClick={() => setIsMockMode(true)}
          >
            Developer Mock
          </button>
        </div>

        <div className="auth-content">
          {!isMockMode ? (
            <div className="google-auth-wrapper">
              <div id="google-signin-btn-container" ref={googleBtnRef}></div>
              <p className="auth-disclaimer">
                We'll securely sign you in or automatically create an account if you don't have one yet.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMockSubmit} className="mock-form" id="mock-auth-form">
              <div className="form-group">
                <label htmlFor="mock-email-input">Email Address</label>
                <input
                  id="mock-email-input"
                  type="email"
                  placeholder="name@example.com"
                  value={mockEmail}
                  onChange={(e) => setMockEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mock-name-input">Full Name (Optional)</label>
                <input
                  id="mock-name-input"
                  type="text"
                  placeholder="Piyush Sharma"
                  value={mockName}
                  onChange={(e) => setMockName(e.target.value)}
                />
              </div>

              <button
                id="mock-submit-btn"
                type="submit"
                className="btn-primary mock-submit"
                disabled={loading}
              >
                <LogIn size={16} />
                {loading ? 'Signing in...' : 'Sign In (Mock)'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .auth-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(3, 7, 18, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 2.5rem 2rem;
          border-radius: 24px;
          position: relative;
          box-shadow: var(--shadow-lg), 0 0 40px -10px rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.08);
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
        }
        .close-btn:hover {
          color: var(--fg-primary);
          background: rgba(255, 255, 255, 0.05);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .auth-header h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #fff 0%, var(--fg-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .auth-header p {
          font-size: 0.9rem;
          color: var(--fg-secondary);
        }
        .auth-error {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(244, 63, 94, 0.1);
          border: 1px solid rgba(244, 63, 94, 0.2);
          color: var(--accent-rose);
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
          line-height: 1.4;
        }
        .mode-toggle {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 0.25rem;
          border-radius: 9999px;
          margin-bottom: 2rem;
        }
        .mode-toggle button {
          flex: 1;
          padding: 0.6rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--fg-secondary);
        }
        .mode-toggle button.active {
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.25);
          color: #fff;
        }
        .google-auth-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 0;
        }
        .auth-disclaimer {
          font-size: 0.75rem;
          color: var(--fg-tertiary);
          text-align: center;
          line-height: 1.5;
        }
        .mock-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--fg-secondary);
        }
        .form-group input {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #fff;
          font-family: inherit;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          outline: none;
          border-color: var(--accent-indigo);
          background: rgba(255, 255, 255, 0.05);
        }
        .mock-submit {
          justify-content: center;
          margin-top: 0.5rem;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
