'use client';

import { useState } from 'react';
import { ChevronRight, UserCheck } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  user: any;
  onComplete: (updatedUser: any) => void;
}

const GENDER_OPTIONS = [
  { value: 'MALE', label: '♂ Male', emoji: '🙋‍♂️' },
  { value: 'FEMALE', label: '♀ Female', emoji: '🙋‍♀️' },
  { value: 'OTHER', label: '⚧ Other / Prefer not to say', emoji: '🫧' },
];

const AGE_OPTIONS = [
  { value: '18-22', label: '18 – 22' },
  { value: '23-27', label: '23 – 27' },
  { value: '28-33', label: '28 – 33' },
  { value: '34-40', label: '34 – 40' },
  { value: '41+', label: '41 and above' },
];

export default function OnboardingModal({ isOpen, user, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<'gender' | 'age'>('gender');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !user) return null;

  // If user already has gender set, skip onboarding
  if (user.gender) return null;

  const handleSave = async () => {
    if (!selectedGender || !selectedAge) return;
    setSaving(true);
    setError('');

    // Calculate approximate DOB year from age bracket
    const now = new Date();
    const ageMap: Record<string, number> = {
      '18-22': 20,
      '23-27': 25,
      '28-33': 30,
      '34-40': 37,
      '41+': 45,
    };
    const approxAge = ageMap[selectedAge] || 25;
    const approxDobYear = now.getFullYear() - approxAge;
    const dob = `${approxDobYear}-01-01`; // approximate

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: selectedGender, dob }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');
      onComplete(data.user);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. You can update this in your profile later.');
      setSaving(false);
      // Still call onComplete with existing user data so they can continue
      setTimeout(() => onComplete(user), 2000);
    }
  };

  return (
    <div className="onboarding-backdrop" id="onboarding-modal">
      <div className="onboarding-card glass-panel animate-scale-up" role="dialog" aria-modal="true">
        
        {/* Header */}
        <div className="onboarding-header">
          <div className="welcome-avatar">
            {user.image ? (
              <img src={user.image} alt={user.name} referrerPolicy="no-referrer" />
            ) : (
              <UserCheck size={28} />
            )}
          </div>
          <h2>Welcome, {user.name?.split(' ')[0] || 'friend'}! 👋</h2>
          <p>Just two quick questions to personalize your SocioPath experience.</p>
        </div>

        {/* Step Indicators */}
        <div className="step-dots">
          <span className={`dot ${step === 'gender' ? 'active' : step === 'age' ? 'done' : ''}`} />
          <span className={`dot ${step === 'age' ? 'active' : ''}`} />
        </div>

        {/* Step: Gender */}
        {step === 'gender' && (
          <div className="onboarding-step animate-fade-in">
            <h3>What's your gender?</h3>
            <p className="step-hint">This helps us match the right vibe and pricing for each social.</p>
            <div className="option-grid" id="gender-option-grid">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  id={`gender-option-${opt.value.toLowerCase()}`}
                  className={`option-card ${selectedGender === opt.value ? 'selected' : ''}`}
                  onClick={() => setSelectedGender(opt.value)}
                  type="button"
                >
                  <span className="option-emoji">{opt.emoji}</span>
                  <span className="option-label">{opt.label}</span>
                </button>
              ))}
            </div>
            <button
              className="btn-primary next-btn"
              disabled={!selectedGender}
              onClick={() => setStep('age')}
              id="gender-next-btn"
            >
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step: Age Bracket */}
        {step === 'age' && (
          <div className="onboarding-step animate-fade-in">
            <h3>What's your age range?</h3>
            <p className="step-hint">Helps us curate the right social crowd and energy level for each retreat.</p>
            <div className="option-grid age-grid" id="age-option-grid">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  id={`age-option-${opt.value}`}
                  className={`option-card ${selectedAge === opt.value ? 'selected' : ''}`}
                  onClick={() => setSelectedAge(opt.value)}
                  type="button"
                >
                  <span className="option-label">{opt.label}</span>
                </button>
              ))}
            </div>
            {error && <p className="onboarding-error">{error}</p>}
            <div className="onboarding-actions">
              <button
                type="button"
                className="btn-secondary back-btn"
                onClick={() => setStep('gender')}
                id="age-back-btn"
                disabled={saving}
              >
                Back
              </button>
              <button
                className="btn-primary next-btn"
                disabled={!selectedAge || saving}
                onClick={handleSave}
                id="age-save-btn"
              >
                {saving ? 'Saving...' : 'Finish Setup ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Saving overlay */}
        {saving && (
          <div className="saving-overlay animate-fade-in">
            <span className="saving-spinner" />
            <p>Saving your preferences...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .onboarding-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(3, 7, 18, 0.92);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 1.5rem;
        }
        .onboarding-card {
          width: 100%;
          max-width: 480px;
          border-radius: 28px;
          padding: 2.5rem 2rem;
          box-shadow: var(--shadow-lg), 0 0 60px -15px rgba(99, 102, 241, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: #0b0f19;
          position: relative;
        }
        .onboarding-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .welcome-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          overflow: hidden;
          background: rgba(99,102,241,0.15);
          border: 2px solid var(--accent-indigo);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-indigo);
        }
        .welcome-avatar img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .onboarding-header h2 {
          font-size: 1.5rem;
          color: #fff;
          margin-bottom: 0.4rem;
        }
        .onboarding-header p {
          font-size: 0.9rem;
          color: var(--fg-secondary);
          line-height: 1.5;
        }
        .step-dots {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.75rem;
        }
        .dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          transition: all 0.3s;
        }
        .dot.active {
          background: var(--accent-indigo);
          width: 24px;
          border-radius: 9999px;
        }
        .dot.done {
          background: var(--accent-emerald);
        }
        .onboarding-step h3 {
          font-size: 1.2rem;
          color: #fff;
          margin-bottom: 0.35rem;
          text-align: center;
        }
        .step-hint {
          font-size: 0.85rem;
          color: var(--fg-secondary);
          text-align: center;
          margin-bottom: 1.5rem;
          line-height: 1.4;
        }
        .option-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .age-grid {
          grid-template-columns: 1fr 1fr;
        }
        .option-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 0.75rem;
          border-radius: 14px;
          background: rgba(255,255,255,0.02);
          border: 1.5px solid rgba(255,255,255,0.08);
          cursor: pointer;
          transition: all 0.2s;
          color: var(--fg-secondary);
        }
        .option-card:hover {
          border-color: var(--accent-indigo);
          background: rgba(99,102,241,0.06);
          color: #fff;
        }
        .option-card.selected {
          border-color: var(--accent-indigo);
          background: rgba(99,102,241,0.12);
          color: #fff;
          box-shadow: 0 0 12px rgba(99,102,241,0.2);
        }
        .option-emoji {
          font-size: 1.75rem;
          line-height: 1;
        }
        .option-label {
          font-size: 0.8rem;
          font-weight: 600;
          text-align: center;
          line-height: 1.3;
        }
        .next-btn {
          width: 100%;
          justify-content: center;
          padding: 0.85rem;
          font-size: 0.95rem;
        }
        .onboarding-actions {
          display: flex;
          gap: 1rem;
        }
        .back-btn {
          padding: 0.85rem 1.25rem;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .next-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }
        .onboarding-error {
          font-size: 0.8rem;
          color: var(--accent-rose);
          margin-bottom: 1rem;
          text-align: center;
        }
        .saving-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem 0;
          color: var(--fg-secondary);
        }
        .saving-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(99,102,241,0.15);
          border-top-color: var(--accent-indigo);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .saving-overlay {
          position: absolute;
          inset: 0;
          border-radius: 28px;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(4px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: var(--fg-secondary);
          z-index: 10;
        }
        @media (max-width: 480px) {
          .option-grid { grid-template-columns: 1fr 1fr; }
          .onboarding-card { padding: 2rem 1.25rem; }
        }
      `}</style>
    </div>
  );
}
