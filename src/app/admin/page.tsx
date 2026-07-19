'use client';

import { useState, useEffect } from 'react';
import { IndianRupee, Users, Calendar, AlertTriangle, Plus, Edit2, Trash2, ShieldCheck, LogIn, ClipboardList, Settings, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'bookings'>('list');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Create / Edit Event Form State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [price, setPrice] = useState('1500');
  const [femaleDiscount, setFemaleDiscount] = useState('300');
  const [genderPricingEnabled, setGenderPricingEnabled] = useState(true);
  const [minCapacity, setMinCapacity] = useState('10');
  const [maxCapacity, setMaxCapacity] = useState('20');
  const [formSuccess, setFormSuccess] = useState('');

  // Passcode verification
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin passcode: SocioAdmin2026
    if (passcode === 'SocioAdmin2026') {
      setAuthorized(true);
      setAuthError('');
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      setAuthError('Invalid passcode. Access Denied.');
    }
  };

  useEffect(() => {
    const isAuthed = sessionStorage.getItem('admin_auth') === 'true';
    if (isAuthed) {
      setAuthorized(true);
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      fetchAdminData();
    }
  }, [authorized]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch admin data.');
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormSuccess('');
    setError('');

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          date,
          price: parseFloat(price),
          femaleDiscount: parseFloat(femaleDiscount),
          genderPricingEnabled,
          minCapacity: parseInt(minCapacity),
          maxCapacity: parseInt(maxCapacity),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');

      setFormSuccess('Event created successfully!');
      fetchAdminData();
      
      // Reset form
      setTitle('');
      setDescription('');
      setDate('');
      setPrice('1500');
      setFemaleDiscount('300');
      setGenderPricingEnabled(true);
      setMinCapacity('10');
      setMaxCapacity('20');
      
      setTimeout(() => {
        setFormSuccess('');
        setActiveTab('list');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEventId(event.id);
    setTitle(event.title);
    setDescription(event.description);
    // Format date string for datetime-local input
    const d = new Date(event.date);
    const tzoffset = d.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, -1).substring(0, 16);
    setDate(localISOTime);
    setPrice(event.price.toString());
    setFemaleDiscount(event.femaleDiscount.toString());
    setGenderPricingEnabled(event.genderPricingEnabled !== false);
    setMinCapacity(event.minCapacity.toString());
    setMaxCapacity(event.maxCapacity.toString());
    setActiveTab('create');
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEventId) return;

    setLoading(true);
    setFormSuccess('');
    setError('');

    try {
      const res = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEventId,
          title,
          description,
          date,
          price: parseFloat(price),
          femaleDiscount: parseFloat(femaleDiscount),
          genderPricingEnabled,
          minCapacity: parseInt(minCapacity),
          maxCapacity: parseInt(maxCapacity),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update event');

      setFormSuccess('Event updated successfully!');
      fetchAdminData();
      
      // Reset form
      setEditingEventId(null);
      setTitle('');
      setDescription('');
      setDate('');
      setPrice('1500');
      setFemaleDiscount('300');
      setGenderPricingEnabled(true);
      setMinCapacity('10');
      setMaxCapacity('20');
      
      setTimeout(() => {
        setFormSuccess('');
        setActiveTab('list');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEvent = async (eventId: string, eventTitle: string) => {
    const confirmMsg = `WARNING: Are you sure you want to CANCEL "${eventTitle}"?\n\nThis will immediately process Razorpay refunds for all confirmed guests! This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/events?id=${eventId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel event');
      
      alert(`Event cancelled successfully!\n\nRefund log:\n${data.refundLogs?.join('\n') || 'No refunds to process.'}`);
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel event.');
    } finally {
      setLoading(false);
    }
  };

  // Compile guest logs from all events
  const guestLogs: any[] = [];
  events.forEach((event) => {
    event.bookings.forEach((booking: any) => {
      guestLogs.push({
        bookingId: booking.id,
        eventTitle: event.title,
        eventDate: new Date(event.date),
        userName: booking.user?.name || 'SocioPath Member',
        userEmail: booking.user?.email || 'N/A',
        userGender: booking.user?.gender || 'N/A',
        userMobile: booking.user?.mobile || 'N/A',
        bookingStatus: booking.status,
        paymentId: booking.razorpayPaymentId || 'N/A',
        createdAt: new Date(booking.createdAt),
      });
    });
  });

  // Sort logs by date descending
  guestLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (!authorized) {
    return (
      <main className="admin-login-wrapper">
        <div className="login-card glass-panel animate-scale-up">
          <div className="login-header">
            <ShieldCheck size={40} className="icon-shield" />
            <h2>SocioPath Administrator</h2>
            <p>Access is restricted to authorized operations only.</p>
          </div>

          <form onSubmit={handleVerifyPasscode}>
            {authError && <p className="error-banner">{authError}</p>}
            
            <div className="input-group">
              <label htmlFor="passcode-field">Admin Passcode</label>
              <input
                id="passcode-field"
                type="password"
                placeholder="••••••••••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary login-btn">
              <LogIn size={16} />
              <span>Verify & Enter</span>
            </button>
          </form>

          <Link href="/" className="back-link">
            ← Return to Landing Page
          </Link>
        </div>

        <style jsx global>{`
          body {
            background: #030712;
            color: #f9fafb;
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
          }
          .admin-login-wrapper {
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: radial-gradient(circle at center, #0e1224 0%, #030712 100%);
          }
          .login-card {
            width: 100%;
            max-width: 400px;
            padding: 3rem 2.5rem;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          .login-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          .icon-shield {
            color: var(--accent-indigo);
            margin-bottom: 0.75rem;
          }
          .login-header h2 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: #fff;
          }
          .login-header p {
            font-size: 0.85rem;
            color: var(--fg-secondary);
            line-height: 1.4;
          }
          .input-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
          }
          .input-group label {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--fg-secondary);
          }
          .input-group input {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 0.75rem;
            color: #fff;
            font-size: 0.95rem;
            outline: none;
          }
          .input-group input:focus {
            border-color: var(--accent-indigo);
          }
          .login-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem;
          }
          .error-banner {
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid var(--accent-rose);
            color: var(--accent-rose);
            padding: 0.75rem;
            border-radius: 8px;
            font-size: 0.85rem;
            text-align: center;
            margin-bottom: 1.25rem;
          }
          .back-link {
            display: block;
            text-align: center;
            font-size: 0.85rem;
            color: var(--fg-tertiary);
            margin-top: 1.5rem;
            text-decoration: none;
          }
          .back-link:hover {
            color: #fff;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-container">
      {/* Top Banner */}
      <header className="dashboard-header glass-panel">
        <div className="header-left">
          <ShieldCheck size={28} className="icon-shield" />
          <div>
            <h1>SocioPath Operations Panel</h1>
            <p>Authorized weekend socials planner, invitation controls, and refund processing.</p>
          </div>
        </div>
        <div className="header-right">
          <Link href="/" className="btn-secondary back-home-btn">
            ← Home Page
          </Link>
          <button 
            className="btn-secondary logout-btn"
            onClick={() => {
              sessionStorage.removeItem('admin_auth');
              setAuthorized(false);
            }}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Tabs Row */}
      <nav className="dashboard-tabs">
        <button 
          className={`dash-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('list');
            setEditingEventId(null);
          }}
        >
          <Settings size={16} />
          <span>Manage Weekend Cards</span>
        </button>
        <button 
          className={`dash-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <Plus size={16} />
          <span>{editingEventId ? 'Edit Event Details' : 'Add New Event'}</span>
        </button>
        <button 
          className={`dash-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <ClipboardList size={16} />
          <span>Attendee Booking Logs ({guestLogs.length})</span>
        </button>
      </nav>

      {error && <div className="error-banner dashboard-error">{error}</div>}

      {/* Tab 1: Manage Events */}
      {activeTab === 'list' && (
        <section className="events-management-table glass-panel">
          <h3>Active Weekend Schedules</h3>
          
          {loading ? (
            <p className="loading-text">Synchronizing schedules...</p>
          ) : events.length === 0 ? (
            <p className="empty-text">No weekend cards currently initialized. Use 'Add New Event' to get started!</p>
          ) : (
            <div className="events-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Event Details</th>
                    <th>Date & Time</th>
                    <th>Price</th>
                    <th>Female Disc.</th>
                    <th>Spots Filled</th>
                    <th>Status</th>
                    <th className="actions-header">Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    const spotsFilled = event.bookings.filter((b: any) => b.status === 'CONFIRMED').length;
                    const eventDateStr = new Date(event.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={event.id}>
                        <td>
                          <div className="event-title-cell">
                            <strong>{event.title}</strong>
                            <span className="event-uuid">{event.id.substring(0, 8)}...</span>
                          </div>
                        </td>
                        <td>{eventDateStr}</td>
                        <td>₹{event.price}</td>
                        <td>₹{event.femaleDiscount}</td>
                        <td>
                          <strong>{spotsFilled}</strong> / {event.maxCapacity}
                        </td>
                        <td>
                          <span className={`status-badge-inline ${event.status.toLowerCase()}`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="op-btn edit" 
                            title="Edit Event Parameters"
                            onClick={() => handleEditEvent(event)}
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>
                          {event.status !== 'CANCELLED' && (
                            <button 
                              className="op-btn cancel" 
                              title="Cancel and Refund All"
                              onClick={() => handleCancelEvent(event.id, event.title)}
                            >
                              <Trash2 size={14} />
                              <span>Cancel Event</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Create / Edit Event */}
      {activeTab === 'create' && (
        <section className="create-event-section glass-panel">
          <h3>{editingEventId ? 'Reschedule & Edit Event Card' : 'Setup New Retreat Social Card'}</h3>
          
          {formSuccess && <div className="success-banner">{formSuccess}</div>}

          <form className="admin-form" onSubmit={editingEventId ? handleUpdateEvent : handleCreateEvent}>
            <div className="form-group-full">
              <label htmlFor="evt-title">Event Title</label>
              <input
                id="evt-title"
                type="text"
                placeholder="e.g. Bandra Acoustic Jamming Night (Friday Social)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group-full">
              <label htmlFor="evt-desc">Event Description</label>
              <textarea
                id="evt-desc"
                rows={4}
                placeholder="Provide a premium description. Mention villa details, games, catering, BYOD rules..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="evt-date">Date & Time</label>
                <input
                  id="evt-date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="evt-price">Price per Person (₹)</label>
                <input
                  id="evt-price"
                  type="number"
                  placeholder="1500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="evt-female-disc">Female Discount Amount (₹)</label>
                <input
                  id="evt-female-disc"
                  type="number"
                  placeholder="300"
                  value={femaleDiscount}
                  onChange={(e) => setFemaleDiscount(e.target.value)}
                  disabled={!genderPricingEnabled}
                  required
                />
              </div>

              <div className="form-field toggle-field">
                <label>Gender-Based Pricing</label>
                <button
                  type="button"
                  className={`toggle-btn ${genderPricingEnabled ? 'active' : ''}`}
                  onClick={() => setGenderPricingEnabled(!genderPricingEnabled)}
                  id="toggle-gender-pricing"
                >
                  <span className="toggle-knob" />
                </button>
                <span className="toggle-label-hint">
                  {genderPricingEnabled ? '✓ Female discount enabled' : '✗ Same price for all genders'}
                </span>
              </div>

              <div className="form-field">
                <label htmlFor="evt-min-cap">Min Capacity threshold</label>
                <input
                  id="evt-min-cap"
                  type="number"
                  placeholder="10"
                  value={minCapacity}
                  onChange={(e) => setMinCapacity(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="evt-max-cap">Max Capacity limit</label>
                <input
                  id="evt-max-cap"
                  type="number"
                  placeholder="20"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              {editingEventId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingEventId(null);
                    setTitle('');
                    setDescription('');
                    setDate('');
                    setActiveTab('list');
                  }}
                >
                  Cancel Edit
                </button>
              )}
              <button 
                type="submit" 
                className="btn-primary save-btn"
                disabled={loading}
              >
                <span>{editingEventId ? 'Save Updates' : 'Publish Weekend Card'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tab 3: Guest Bookings Log */}
      {activeTab === 'bookings' && (
        <section className="bookings-log-section glass-panel">
          <h3>Guest Retrospective Attendee logs</h3>
          
          {guestLogs.length === 0 ? (
            <p className="empty-text">No bookings recorded yet.</p>
          ) : (
            <div className="bookings-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Guest Details</th>
                    <th>Contact</th>
                    <th>Gender</th>
                    <th>Vibe Social Card</th>
                    <th>Booking Time</th>
                    <th>Status</th>
                    <th>Razorpay Payment ID</th>
                  </tr>
                </thead>
                <tbody>
                  {guestLogs.map((log) => {
                    const bookingDateStr = log.createdAt.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={log.bookingId}>
                        <td>
                          <div className="guest-info-cell">
                            <strong>{log.userName}</strong>
                            <span className="guest-email">{log.userEmail}</span>
                          </div>
                        </td>
                        <td>{log.userMobile || 'N/A'}</td>
                        <td>
                          <span className={`gender-tag ${log.userGender.toLowerCase()}`}>
                            {log.userGender}
                          </span>
                        </td>
                        <td>
                          <div className="guest-social-cell">
                            <strong>{log.eventTitle}</strong>
                          </div>
                        </td>
                        <td>{bookingDateStr}</td>
                        <td>
                          <span className={`status-badge-inline ${log.bookingStatus.toLowerCase()}`}>
                            {log.bookingStatus}
                          </span>
                        </td>
                        <td>
                          <code className="payment-code">{log.paymentId}</code>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <style jsx global>{`
        .admin-dashboard-container {
          max-width: 1200px;
          margin: 4rem auto;
          padding: 0 2rem;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }
        .dashboard-header {
          padding: 2rem;
          border-radius: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .header-left h1 {
          font-size: 1.6rem;
          margin: 0;
          color: #fff;
          font-family: var(--font-display);
        }
        .header-left p {
          margin: 0.25rem 0 0;
          font-size: 0.9rem;
          color: var(--fg-secondary);
        }
        .header-right {
          display: flex;
          gap: 1rem;
        }
        .back-home-btn {
          font-size: 0.85rem;
          text-decoration: none;
        }
        .logout-btn {
          font-size: 0.85rem;
        }
        .logout-btn:hover {
          background: rgba(244, 63, 94, 0.1);
          color: var(--accent-rose);
          border-color: rgba(244, 63, 94, 0.2);
        }
        .dashboard-tabs {
          display: flex;
          gap: 1rem;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.5rem;
          overflow-x: auto;
        }
        .dash-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--fg-secondary);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .dash-tab-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.02);
        }
        .dash-tab-btn.active {
          color: var(--accent-indigo);
          background: rgba(99, 102, 241, 0.08);
        }
        .events-management-table, .create-event-section, .bookings-log-section {
          padding: 2.5rem;
          border-radius: 20px;
        }
        .events-management-table h3, .create-event-section h3, .bookings-log-section h3 {
          font-size: 1.25rem;
          color: #fff;
          margin-bottom: 1.5rem;
          font-family: var(--font-display);
        }
        .loading-text, .empty-text {
          color: var(--fg-secondary);
          font-size: 0.95rem;
          text-align: center;
          padding: 3rem;
        }
        .events-table-wrapper, .bookings-table-wrapper {
          overflow-x: auto;
          margin: 0 -2.5rem;
          padding: 0 2.5rem;
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }
        .admin-table th {
          border-bottom: 1px solid var(--border-color);
          padding: 1rem 0.75rem;
          color: #fff;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }
        .admin-table td {
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          padding: 1.25rem 0.75rem;
          color: var(--fg-secondary);
        }
        .event-title-cell, .guest-info-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .event-title-cell strong, .guest-info-cell strong {
          color: #fff;
          font-size: 0.95rem;
        }
        .event-uuid, .guest-email {
          font-size: 0.75rem;
          color: var(--fg-tertiary);
        }
        .status-badge-inline {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          display: inline-block;
        }
        .status-badge-inline.confirmed {
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent-emerald);
        }
        .status-badge-inline.pending {
          background: rgba(245, 158, 11, 0.1);
          color: var(--accent-amber);
        }
        .status-badge-inline.cancelled, .status-badge-inline.refunded {
          background: rgba(244, 63, 94, 0.1);
          color: var(--accent-rose);
        }
        .gender-tag {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          text-transform: capitalize;
        }
        .gender-tag.male {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        .gender-tag.female {
          background: rgba(236, 72, 153, 0.1);
          color: #ec4899;
        }
        .gender-tag.other {
          background: rgba(255, 255, 255, 0.05);
          color: var(--fg-secondary);
        }
        .payment-code {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.8rem;
          color: var(--fg-primary);
        }
        .actions-header {
          text-align: right;
        }
        .actions-cell {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .op-btn {
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
          color: var(--fg-primary);
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.2s;
        }
        .op-btn.edit:hover {
          background: rgba(99, 102, 241, 0.08);
          color: var(--accent-indigo);
          border-color: rgba(99, 102, 241, 0.2);
        }
        .op-btn.cancel:hover {
          background: rgba(244, 63, 94, 0.08);
          color: var(--accent-rose);
          border-color: rgba(244, 63, 94, 0.2);
        }
        
        /* Admin Form CSS */
        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-group-full {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .admin-form label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--fg-primary);
        }
        .admin-form input, .admin-form textarea {
          background: #0f1423;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0.75rem;
          color: #fff;
          font-size: 0.95rem;
          outline: none;
          font-family: inherit;
          color-scheme: dark;
        }
        .admin-form input:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .admin-form input:focus, .admin-form textarea:focus {
          border-color: var(--accent-indigo);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.15);
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
        }
        .save-btn {
          padding: 0.75rem 2rem;
          font-size: 0.95rem;
        }
        .success-banner {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--accent-emerald);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          text-align: center;
          font-weight: 600;
        }
        .dashboard-error {
          margin-top: 0;
          text-align: left;
        }
        .toggle-field {
          flex-direction: row !important;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .toggle-btn {
          width: 52px;
          height: 28px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--border-color);
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
          transition: background 0.2s;
        }
        .toggle-btn.active {
          background: var(--accent-indigo);
          border-color: var(--accent-indigo);
        }
        .toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s;
        }
        .toggle-btn.active .toggle-knob {
          transform: translateX(24px);
        }
        .toggle-label-hint {
          font-size: 0.8rem;
          color: var(--fg-secondary);
        }
        @media (max-width: 768px) {
          .admin-dashboard-container {
            padding: 0 1rem;
            margin: 2rem auto;
          }
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-right {
            width: 100%;
            justify-content: space-between;
          }
          .dash-tab-btn {
            font-size: 0.85rem;
            padding: 0.5rem 0.75rem;
          }
          .events-management-table, .create-event-section, .bookings-log-section {
            padding: 1.5rem;
          }
          .form-row {
            grid-template-columns: 1fr;
          }
          .events-table-wrapper, .bookings-table-wrapper {
            margin: 0 -1.5rem;
            padding: 0 1.5rem;
          }
        }
      `}</style>
    </main>
  );
}
