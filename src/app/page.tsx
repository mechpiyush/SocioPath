'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import EventCard from '@/app/components/EventCard';
import EventModal from '@/app/components/EventModal';
import AuthModal from '@/app/components/AuthModal';
import ProfileModal from '@/app/components/ProfileModal';
import BookingSuccess from '@/app/components/BookingSuccess';
import { ShieldCheck, Music, Sparkles } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  price: number;
  minCapacity: number;
  maxCapacity: number;
  status: string;
  spotsFilled: number;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeModal, setActiveModal] = useState<'details' | 'auth' | 'profile' | 'success' | null>(null);
  
  const [eventsLoading, setEventsLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [lastBooking, setLastBooking] = useState<any>(null);

  // Site Loading screen states
  const [siteLoading, setSiteLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Read developer configuration
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Promise.all([
          // 1. Fetch user session
          fetch('/api/auth/session')
            .then((res) => res.json())
            .then((data) => {
              if (data.authenticated) {
                setUser(data.user);
              }
            })
            .catch((err) => console.error('Failed to load session:', err)),

          // 2. Fetch events
          fetchEvents()
        ]);
      } catch (err) {
        console.error('Failed to initialize app state:', err);
      } finally {
        // Smooth delay to avoid instant splash flash
        setTimeout(() => {
          setSiteLoading(false);
        }, 800);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (!siteLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 500); // 500ms fade transition
      return () => clearTimeout(timer);
    }
  }, [siteLoading]);

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        setActiveModal(null);
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleAuthSuccess = (authenticatedUser: any) => {
    setUser(authenticatedUser);
  };

  const handleInitializeBooking = async (eventId: string) => {
    setBookingLoading(true);
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize booking');
      }

      if (data.isMock) {
        // Run simulated checkout for Mock Mode
        handleMockCheckout(data);
      } else {
        // Open Razorpay Checkout Dialog
        handleRazorpayCheckout(data);
      }
    } catch (err: any) {
      alert(err.message || 'Payment initialization failed.');
      setBookingLoading(false);
    }
  };

  const handleMockCheckout = async (orderData: any) => {
    // Simulate a brief delay to represent payment processing
    setTimeout(async () => {
      try {
        const res = await fetch('/api/bookings/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpayOrderId: orderData.razorpayOrderId,
            razorpayPaymentId: `mock_pay_${Math.random().toString(36).substring(2, 11)}`,
            razorpaySignature: 'mock_signature_verified',
          }),
        });

        const verification = await res.json();
        if (!res.ok) {
          throw new Error(verification.error || 'Mock verification failed');
        }

        // Show success screen
        setLastBooking({
          eventTitle: orderData.eventTitle,
          amount: orderData.amount,
          orderId: orderData.razorpayOrderId,
          date: events.find((e) => e.title === orderData.eventTitle)?.date || new Date().toISOString(),
        });
        
        setActiveModal('success');
        fetchEvents(); // reload list / cache clear
      } catch (err: any) {
        alert(err.message || 'Mock payment confirmation failed.');
      } finally {
        setBookingLoading(false);
      }
    }, 1200);
  };

  const handleRazorpayCheckout = (orderData: any) => {
    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      alert('Razorpay Checkout SDK failed to load. Please reload the page.');
      setBookingLoading(false);
      return;
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: 'INR',
      name: 'SocioPath',
      description: orderData.eventTitle,
      order_id: orderData.razorpayOrderId,
      prefill: {
        name: orderData.userName || '',
        email: orderData.userEmail || '',
      },
      theme: {
        color: '#6366f1',
      },
      handler: async function (response: any) {
        try {
          const res = await fetch('/api/bookings/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          const verification = await res.json();
          if (!res.ok) {
            throw new Error(verification.error || 'Signature verification failed');
          }

          setLastBooking({
            eventTitle: orderData.eventTitle,
            amount: orderData.amount,
            orderId: response.razorpay_order_id,
            date: events.find((e) => e.title === orderData.eventTitle)?.date || new Date().toISOString(),
          });

          setActiveModal('success');
          fetchEvents(); // Refresh data/cache
        } catch (err: any) {
          alert(err.message || 'Payment capture failed.');
        } finally {
          setBookingLoading(false);
        }
      },
      modal: {
        ondismiss: function () {
          setBookingLoading(false);
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <div className="site-wrapper" id="home-view-root">
      {showSplash && (
        <div className={`site-loading-screen ${!siteLoading ? 'fade-out' : ''}`} id="site-loading-overlay">
          <div className="loading-screen-content">
            <span className="logo-icon-glow-large"></span>
            <h1 className="loading-logo-text">SocioPath</h1>
            <p className="loading-subtitle">Mumbai's Premium Late-Night Social Experience</p>
            <div className="loading-bar-container">
              <div className="loading-bar-progress"></div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        user={user}
        onOpenAuth={() => setActiveModal('auth')}
        onOpenProfile={() => setActiveModal('profile')}
        onSignOut={handleSignOut}
      />

      {/* Hero & Graphics Hook */}
      <section className="hero-section" id="hero-banner">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-tag">
              <Sparkles size={14} className="icon-sparkle" />
              <span>Weekend Social Retreats</span>
            </div>
            <h1>The Late-Night Social Experience</h1>
            <p>
              Step into Mumbai's secluded, premium villa retreats. Break the ice with strangers, enjoy karaoke acoustic jams, and experience overnight stays that feel like home.
            </p>
            <div className="hero-cta">
              <a href="#sessions-section" className="btn-primary" id="hero-cta-btn">
                <span>View Weekend Calendar</span>
              </a>
              <div className="value-proposition">
                <ShieldCheck size={18} className="icon-secure" />
                <span>Threshold Guaranteed / BYOD supported</span>
              </div>
            </div>
          </div>

          <div className="hero-graphic-wrapper" id="hero-ambient-graphic">
            {/* Premium ambient glow vector graphic */}
            <svg viewBox="0 0 500 500" className="ambient-svg" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="glow-violet" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="glow-indigo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--accent-indigo)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="glow-campfire" cx="50%" cy="50%" r="40%">
                  <stop offset="0%" stopColor="var(--accent-amber)" stopOpacity="0.5" />
                  <stop offset="30%" stopColor="var(--accent-rose)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>
              
              {/* Back ambient glows */}
              <circle cx="150" cy="180" r="180" fill="url(#glow-indigo)" />
              <circle cx="350" cy="300" r="200" fill="url(#glow-violet)" />
              
              {/* Core gathering design */}
              <g className="floating-group">
                {/* Fire pit glow */}
                <circle cx="250" cy="280" r="120" fill="url(#glow-campfire)" className="pulse-slow" />
                
                {/* Geometrical connection vectors representing strangers networking */}
                <line x1="130" y1="230" x2="250" y2="150" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                <line x1="250" y1="150" x2="370" y2="230" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                <line x1="370" y1="230" x2="310" y2="380" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                <line x1="310" y1="380" x2="190" y2="380" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                <line x1="190" y1="380" x2="130" y2="230" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                
                {/* Star constellation lines */}
                <line x1="250" y1="150" x2="190" y2="380" stroke="rgba(99,102,241,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="130" y1="230" x2="310" y2="380" stroke="rgba(99,102,241,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Nodes representing attendees */}
                <circle cx="250" cy="150" r="6" fill="#fff" />
                <circle cx="130" cy="230" r="6" fill="var(--accent-cyan)" />
                <circle cx="370" cy="230" r="6" fill="var(--accent-purple)" />
                <circle cx="310" cy="380" r="6" fill="var(--accent-indigo)" />
                <circle cx="190" cy="380" r="6" fill="var(--accent-rose)" />

                {/* Floating ambient fire sparks / stars */}
                <circle cx="210" cy="220" r="2" fill="var(--accent-amber)" className="float-particle-1" />
                <circle cx="280" cy="190" r="3" fill="var(--accent-amber)" className="float-particle-2" />
                <circle cx="230" cy="260" r="2.5" fill="var(--accent-rose)" className="float-particle-3" />
                <circle cx="260" cy="240" r="2" fill="#fff" className="float-particle-4" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* Grid Container */}
      <section className="sessions-section" id="sessions-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Upcoming Weekend Retreats</h2>
            <p>Select a session to unlock overnight villa details and secure your ticket.</p>
          </div>

          {eventsLoading ? (
            <div className="status-box">
              <p>Gathering fresh availability status...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="status-box">
              <p>No retreats listed this weekend. Check back soon!</p>
            </div>
          ) : (
            <div className="sessions-grid" id="events-grid-container">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => {
                    setSelectedEvent(event);
                    setActiveModal('details');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Booking Simulator Overlay */}
      {bookingLoading && (
        <div className="loading-overlay" id="checkout-spinner-overlay">
          <div className="loading-spinner-box glass-panel animate-scale-up">
            <span className="spinner-loader"></span>
            <h3>Initializing Secure Payment</h3>
            <p>Please do not close or refresh this tab...</p>
          </div>
        </div>
      )}

      {/* Modal Layers */}
      <EventModal
        isOpen={activeModal === 'details'}
        event={selectedEvent}
        onClose={() => {
          setSelectedEvent(null);
          setActiveModal(null);
        }}
        isAuthenticated={!!user}
        onOpenAuth={() => setActiveModal('auth')}
        onInitializeBooking={handleInitializeBooking}
        bookingLoading={bookingLoading}
      />

      <AuthModal
        isOpen={activeModal === 'auth'}
        onClose={() => setActiveModal(null)}
        onSuccess={handleAuthSuccess}
        googleClientId={googleClientId}
      />

      <ProfileModal
        isOpen={activeModal === 'profile'}
        onClose={() => setActiveModal(null)}
        user={user}
        onSignOut={handleSignOut}
      />

      {activeModal === 'success' && (
        <BookingSuccess
          onClose={() => {
            setLastBooking(null);
            setActiveModal(null);
          }}
          bookingDetails={lastBooking}
        />
      )}

      {/* Main Footer */}
      <Footer />

      <style jsx global>{`
        .site-wrapper {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        
        /* Hero Styling */
        .hero-section {
          padding: 5rem 2rem;
          position: relative;
          overflow: hidden;
        }
        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 4rem;
        }
        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .hero-tag {
          align-self: flex-start;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.25);
          color: var(--accent-indigo);
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .hero-content h1 {
          font-size: 3.5rem;
          line-height: 1.1;
          color: #fff;
          background: linear-gradient(135deg, #fff 40%, var(--accent-purple) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-content p {
          font-size: 1.15rem;
          line-height: 1.6;
          color: var(--fg-secondary);
        }
        .hero-cta {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }
        .hero-cta .btn-primary {
          align-self: flex-start;
          padding: 1rem 2rem;
          font-size: 1.05rem;
        }
        .value-proposition {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--fg-tertiary);
        }
        .icon-secure {
          color: var(--accent-emerald);
        }
        .hero-graphic-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ambient-svg {
          width: 100%;
          max-width: 450px;
          height: auto;
          overflow: visible;
        }
        
        /* Sessions section styling */
        .sessions-section {
          padding: 4rem 2rem 6rem;
          background: rgba(15, 20, 35, 0.2);
          border-top: 1px solid var(--border-color);
        }
        .section-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .section-header {
          text-align: center;
          margin-bottom: 3.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .section-header h2 {
          font-size: 2.25rem;
          color: #fff;
        }
        .section-header p {
          color: var(--fg-secondary);
          font-size: 1rem;
        }
        .sessions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 2.5rem;
        }
        .status-box {
          text-align: center;
          padding: 4rem;
          background: rgba(255, 255, 255, 0.01);
          border: 1px dashed var(--border-color);
          border-radius: 20px;
          color: var(--fg-secondary);
        }

        /* Loading Spinner Overlay */
        .loading-overlay {
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
          z-index: 2000;
          padding: 1.5rem;
        }
        .loading-spinner-box {
          padding: 3rem;
          border-radius: 24px;
          text-align: center;
          max-width: 380px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: var(--shadow-lg);
        }
        .loading-spinner-box h3 {
          color: #fff;
          font-size: 1.25rem;
          margin: 1.5rem 0 0.5rem;
        }
        .loading-spinner-box p {
          color: var(--fg-secondary);
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .spinner-loader {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99, 102, 241, 0.1);
          border-radius: 50%;
          display: inline-block;
          border-top-color: var(--accent-indigo);
          animation: spin 1s linear infinite;
        }
        
        /* Keyframes */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes float-p1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.8; }
          50% { transform: translate(10px, -15px); opacity: 0.4; }
        }
        @keyframes float-p2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          50% { transform: translate(-15px, -25px); opacity: 0.9; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }

        .pulse-slow {
          animation: pulse 4s ease-in-out infinite;
          transform-origin: 250px 280px;
        }
        .float-particle-1 { animation: float-p1 3s ease-in-out infinite; }
        .float-particle-2 { animation: float-p2 4s ease-in-out infinite; }
        .float-particle-3 { animation: float-p1 4.5s ease-in-out infinite; }
        .float-particle-4 { animation: float-p2 3.5s ease-in-out infinite; }

        @media (max-width: 992px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
          }
          .hero-content h1 {
            font-size: 2.75rem;
          }
          .hero-cta .btn-primary {
            align-self: center;
          }
          .value-proposition {
            justify-content: center;
          }
          .hero-graphic-wrapper {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}
