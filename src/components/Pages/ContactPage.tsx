/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Send, CheckCircle2, Mail, MessageSquare, User } from 'lucide-react';
import { SimulatedDB } from '../../types';

interface ContactPageProps {
  onToast: (msg: string, type?: 'ok' | 'err') => void;
}

export default function ContactPage({ onToast }: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const getGmailUrl = () => {
    const subject = `MYDOCIFY - Inquiry from ${name.trim()}`;
    const body = `Hello,\n\nName: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${msg.trim()}\n\n---\nSent via MYDOCIFY Contact Form`;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=ardeveloper001@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !msg.trim()) {
      onToast('Please fill in all required fields.', 'err');
      return;
    }

    SimulatedDB.contacts.push({
      name,
      email,
      msg,
      time: new Date().toLocaleString(),
    });

    // Automatically trigger web Gmail compose in a new tab
    try {
      window.open(getGmailUrl(), '_blank');
    } catch (err) {
      console.error('Gmail redirect error:', err);
    }

    setSent(true);
    onToast("Opening Gmail...", "ok");
  };

  const handleReset = () => {
    setSent(false);
    setName('');
    setEmail('');
    setMsg('');
  };

  return (
    <div className="max-w-[580px] mx-auto animate-fade-in">
      <h1 className="text-3xl font-display font-black text-[var(--text)] mb-2">Get in Touch</h1>
      <p className="text-sm text-[var(--muted)] mb-8">
        Have questions, custom requested items, or feedback about local PDF suite operations? Let us know.
      </p>

      {sent ? (
        <div className="bg-[rgba(67,233,123,0.08)] border border-[rgba(67,233,123,0.25)] rounded-2xl p-8 text-center flex flex-col items-center gap-4">
          <CheckCircle2 size={40} className="text-[var(--accent3)]" />
          <h3 className="font-display font-bold text-xl text-[var(--text)]">Check Your Gmail Tab!</h3>
          <p className="text-sm text-[var(--muted)] max-w-sm leading-relaxed">
            We have opened Gmail with your message loaded. If it did not open automatically, please click <strong className="text-[var(--text)]">"Send via Gmail"</strong> below. Sending that mail will deliver it directly to <strong className="text-[var(--text)]">ardeveloper001@gmail.com</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full justify-center">
            <a
              href={getGmailUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="glow-btn flex items-center justify-center gap-2 px-5 py-3 text-xs"
            >
              <Send size={14} /> Send via Gmail
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--border)] font-semibold rounded-xl px-5 py-3 text-xs transition-all cursor-pointer"
            >
              Send Another Inquiry
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5 flex items-center gap-1.5">
              <User size={12} /> Full Name
            </label>
            <input
              className="ifield"
              placeholder="John Smith"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5 flex items-center gap-1.5">
              <Mail size={12} /> Email Address
            </label>
            <input
              className="ifield"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5 flex items-center gap-1.5">
              <MessageSquare size={12} /> Message Content
            </label>
            <textarea
              className="ifield resize-y font-sans leading-relaxed"
              rows={5}
              placeholder="What's on your mind?..."
              required
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="glow-btn self-start flex items-center gap-2 px-5 py-3"
          >
            <Send size={14} /> Send Message
          </button>
        </form>
      )}

      <div className="mt-10 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
        <p className="font-display font-bold text-sm text-[var(--text)] mb-1.5">Alternative Contact Channels</p>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          📧 Support Email:{' '}
          <a href="mailto:ardeveloper001@gmail.com" className="text-[var(--accent)] font-bold hover:underline">
            ardeveloper001@gmail.com
          </a>
          <br />
          ⏱️ Standard Reply Window: Under 24 Business Hours
          <br />
          🌍 Sandbox Client-Side Operations Framework Only
        </p>
      </div>
    </div>
  );
}
