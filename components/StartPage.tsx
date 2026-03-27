import React, { useState } from 'react';
import { submitLead, LeadPayload } from '../services/leadsService';

const genders = [
  { label: 'Male', value: 'male' as const },
  { label: 'Female', value: 'female' as const },
  { label: 'Other', value: 'other' as const },
];

interface StartPageProps {
  onNext: () => void;
}

const StartPage: React.FC<StartPageProps> = ({ onNext }) => {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male',
    phone: '',
    email: '',
  });
  const [isSubmitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Clear custom validity on input so browser shows fresh state
  const clearValidity = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.setCustomValidity('');
  };
  // For Age: live custom validation (remove default browser message prefix)
  const handleAgeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    input.setCustomValidity('');
    const v = input.value.trim();
    const n = Number(v);
    const valid = v !== '' && !Number.isNaN(n) && n >= 5 && n <= 100;
    if (!valid) input.setCustomValidity('Please enter a valid age');
  };
  // Custom short messages for invalid inputs
  const invalidAge = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.currentTarget.setCustomValidity('Please enter a valid age');
  };
  const invalidPhone = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.currentTarget.setCustomValidity('Please enter a valid mobile number');
  };
  const invalidEmail = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.currentTarget.setCustomValidity('Please enter a valid email');
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'age') {
      // Keep only digits and cap to 3 chars
      nextValue = value.replace(/\D/g, '').slice(0, 3);
    }
    if (name === 'phone') {
      // Allow only digits and a single leading +
      nextValue = value
        .replace(/[^\d+]/g, '')  // remove non-digits except +
        .replace(/(?!^)\+/g, ''); // remove any + that is not at the start
    }
    setForm(prev => ({ ...prev, [name]: nextValue }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Please enter your name';
    const ageNum = Number(form.age);
    if (!form.age || Number.isNaN(ageNum) || ageNum < 5 || ageNum > 100) return 'Please enter a valid age';
    if (!/^(male|female|other)$/.test(form.gender)) return 'Please select a valid gender';
    // Indian mobile: optional +91 or 0, then 10 digits starting with 6-9
    if (!/^(?:\+91|0)?[6-9]\d{9}$/.test(form.phone)) return 'Please enter a valid mobile number';
    // Stricter email: length + no consecutive dots + must have TLD 2+ letters
    if (!/^(?=.{6,254}$)(?!.*\.\.)[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(form.email)) return 'Please enter a valid email address';
    return null;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const formEl = e.currentTarget;
    if (!formEl.checkValidity()) {
      // Show native popups on the offending inputs
      formEl.reportValidity();
      return;
    }

    setSubmitting(true);
    try {
      const payload: LeadPayload = {
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender as 'male' | 'female' | 'other',
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
      };
      await submitLead(payload);
      setMessage('Submitted successfully.');
      setForm({ name: '', age: '', gender: 'male', phone: '', email: '' });
      // Proceed to next step after successful submit
      onNext();
    } catch (error: any) {
      setMessage(error?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-brand-bg">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4 -mt-10 text-sm"
      >
        <h1 className="text-xl font-bold text-brand-primary">Start</h1>

        {message && (
          <div className="text-sm p-2 rounded border border-brand-primary/40 text-brand-text-main" aria-live="polite">{message}</div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
            placeholder="Enter your name"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Age</label>
          <input
            name="age"
            value={form.age}
            onChange={onChange}
            onInput={handleAgeInput}
            onInvalid={invalidAge}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
            placeholder="e.g. 28"
            inputMode="numeric"
            type="text"
            minLength={1}
            maxLength={3}
            title="Please enter a valid age"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={onChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
          >
            {genders.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            onInput={clearValidity}
            onInvalid={invalidPhone}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
            placeholder="e.g. +919876543210"
            inputMode="tel"
            type="tel"
            minLength={10}
            maxLength={13}
            pattern="^(?:\+91|0)?[6-9]\d{9}$"
            title="Please enter a valid mobile number"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Email</label>
          <input
            name="email"
            value={form.email}
            onChange={onChange}
            onInput={clearValidity}
            onInvalid={invalidEmail}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary"
            placeholder="you@example.com"
            type="email"
            minLength={6}
            maxLength={254}
            title="Please enter a valid email"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white rounded py-2 disabled:opacity-60 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartPage;