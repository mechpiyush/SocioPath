'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, PlusCircle, AlertCircle, Sparkles } from 'lucide-react';

interface ReviewsSectionProps {
  user: any;
}

export default function ReviewsSection({ user }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch reviews');
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a vibe rating (click on stars).');
      return;
    }
    if (!comment.trim()) return;

    setSubmitting(true);
    setError('');
    setSubmitSuccess(false);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setReviews((prev) => [data.review, ...prev]);
      setComment('');
      setRating(0);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error submitting review.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const sortedReviews = [...reviews].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const displayedReviews = showAllReviews ? sortedReviews : sortedReviews.slice(0, 2);

  return (
    <section className="reviews-section-container" id="reviews-block">
      <div className="section-header">
        <div className="title-wrapper">
          <MessageSquare className="section-icon" />
          <h2>Community Reviews & Vibes</h2>
        </div>
        <p className="subtitle">Real testimonials from Mumbaikars who experienced the magic.</p>
      </div>

      <div className="reviews-grid-layout">
        {/* Left Side: Stats and Write Review Form */}
        <div className="reviews-left-col">
          <div className="stats-card glass-panel">
            <div className="rating-massive">
              <span className="rating-number">{averageRating}</span>
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    size={20} 
                    fill={s <= Math.round(parseFloat(averageRating)) ? 'var(--accent-amber)' : 'none'} 
                    color="var(--accent-amber)" 
                  />
                ))}
              </div>
              <p className="total-reviews-count">Based on {reviews.length} reviews</p>
            </div>
            <div className="experience-metric">
              <Sparkles size={16} className="sparkle-icon" />
              <span>100% Verified Guest Retrospective</span>
            </div>
          </div>

          {/* Form */}
          {user ? (
            <form className="write-review-form glass-panel" onSubmit={handleSubmit}>
              <h4>Share Your Experience</h4>
              
              {error && (
                <div className="form-error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="form-success">
                  <span>Review published successfully! Thank you.</span>
                </div>
              )}

              <div className="form-group">
                <label>Vibe Rating</label>
                <div className="stars-input-row">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="star-btn"
                      onClick={() => setRating(val)}
                    >
                      <Star
                        size={24}
                        fill={val <= rating ? 'var(--accent-amber)' : 'none'}
                        color="var(--accent-amber)"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="comment-textarea">Your Review</label>
                <textarea
                  id="comment-textarea"
                  rows={4}
                  placeholder="How was the music, crowd, and games? Share the vibes..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={500}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary submit-review-btn"
                disabled={submitting || !comment.trim()}
              >
                <PlusCircle size={16} />
                <span>{submitting ? 'Submitting...' : 'Post Review'}</span>
              </button>
            </form>
          ) : (
            <div className="signin-prompt-card glass-panel">
              <p>Experienced a SocioPath retreat?</p>
              <p className="dimmed">Sign in with Google to post your retrospective review.</p>
            </div>
          )}
        </div>

        {/* Right Side: Reviews Scroll List */}
        <div className="reviews-right-col">
          {loading ? (
            <div className="reviews-loading-box">
              <p>Loading testimonials...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="reviews-empty-box">
              <p>No reviews posted yet. Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="reviews-scroll-container">
              {displayedReviews.map((review) => {
                const reviewDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div key={review.id} className="review-card glass-panel">
                    <div className="review-card-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {review.user?.image ? (
                            <img src={review.user.image} alt={review.user.name} referrerPolicy="no-referrer" />
                          ) : (
                            <div className="avatar-placeholder">{review.user?.name?.charAt(0) || 'S'}</div>
                          )}
                        </div>
                        <div>
                          <h5>{review.user?.name || 'SocioPath Member'}</h5>
                          <span className="reviewer-meta">
                            {review.user?.occupation || 'Member'} • {reviewDate}
                          </span>
                        </div>
                      </div>

                      <div className="review-rating">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            size={14} 
                            fill={s <= review.rating ? 'var(--accent-amber)' : 'none'} 
                            color="var(--accent-amber)" 
                          />
                        ))}
                      </div>
                    </div>
                    
                    <p className="review-comment">"{review.comment}"</p>
                  </div>
                );
              })}
              {reviews.length > 2 && (
                <button 
                  className="view-all-reviews-btn"
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .reviews-section-container {
          max-width: 1200px;
          margin: 6rem auto;
          padding: 0 2rem;
        }
        .section-header {
          margin-bottom: 3rem;
        }
        .title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .section-icon {
          color: var(--accent-cyan);
          width: 28px;
          height: 28px;
        }
        .section-header h2 {
          font-size: 2rem;
          color: #fff;
          font-family: var(--font-display);
        }
        .subtitle {
          color: var(--fg-secondary);
          font-size: 1rem;
        }
        .reviews-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 3rem;
          align-items: start;
        }
        .reviews-left-col {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .stats-card {
          padding: 2.5rem;
          text-align: center;
          border-radius: 20px;
        }
        .rating-massive {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .rating-number {
          font-size: 3.5rem;
          font-weight: 800;
          color: #fff;
          line-height: 1;
        }
        .stars-row {
          display: flex;
          gap: 0.25rem;
        }
        .total-reviews-count {
          font-size: 0.85rem;
          color: var(--fg-tertiary);
          margin-top: 0.5rem;
        }
        .experience-metric {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(6, 182, 212, 0.08);
          color: var(--accent-cyan);
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          margin-top: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .sparkle-icon {
          animation: pulse 2s infinite;
        }
        .write-review-form {
          padding: 2rem;
          border-radius: 20px;
        }
        .write-review-form h4 {
          font-size: 1.2rem;
          color: #fff;
          margin-bottom: 1.5rem;
        }
        .form-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(244, 63, 94, 0.1);
          color: var(--accent-rose);
          border: 1px solid rgba(244, 63, 94, 0.2);
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          font-size: 0.85rem;
        }
        .form-success {
          background: rgba(16, 185, 129, 0.1);
          color: var(--accent-emerald);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          font-size: 0.85rem;
        }
        .form-group {
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--fg-primary);
        }
        .stars-input-row {
          display: flex;
          gap: 0.5rem;
        }
        .star-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .star-btn:hover {
          transform: scale(1.15);
        }
        .form-group textarea {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: #fff;
          font-size: 0.9rem;
          font-family: inherit;
          resize: vertical;
        }
        .form-group textarea:focus {
          outline: none;
          border-color: var(--accent-indigo);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.15);
        }
        .submit-review-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          padding: 0.75rem;
        }
        .signin-prompt-card {
          padding: 2.5rem 2rem;
          border-radius: 20px;
          text-align: center;
          border: 1px dashed var(--border-color);
        }
        .signin-prompt-card p {
          font-weight: 600;
          color: #fff;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }
        .signin-prompt-card .dimmed {
          font-size: 0.85rem;
          color: var(--fg-secondary);
        }
        .reviews-loading-box, .reviews-empty-box {
          padding: 4rem;
          text-align: center;
          border: 1px dashed var(--border-color);
          border-radius: 20px;
          color: var(--fg-secondary);
        }
        .reviews-scroll-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-height: 600px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        .review-card {
          padding: 1.75rem;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: all 0.2s;
        }
        .review-card:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }
        .reviewer-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .reviewer-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          flex-shrink: 0;
        }
        .reviewer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .reviewer-avatar .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-cyan);
          font-weight: 700;
          font-size: 1.1rem;
        }
        .reviewer-info h5 {
          color: #fff;
          font-size: 0.95rem;
          margin-bottom: 0.15rem;
        }
        .reviewer-meta {
          font-size: 0.75rem;
          color: var(--fg-tertiary);
          display: block;
        }
        .review-rating {
          display: flex;
          gap: 0.1rem;
        }
        .review-comment {
          font-size: 0.95rem;
          color: var(--fg-secondary);
          line-height: 1.5;
          font-style: italic;
          margin: 0;
        }
        
        .view-all-reviews-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: var(--fg-primary);
          padding: 0.75rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
        }
        .view-all-reviews-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @media (max-width: 900px) {
          .reviews-grid-layout {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
        }
        
        @media (max-width: 576px) {
          .review-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
        }
      `}</style>
    </section>
  );
}
