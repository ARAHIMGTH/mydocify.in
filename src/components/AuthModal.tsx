/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import Logo from './Logo';
import { User } from '../types';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendEmailVerification, 
  signOut, 
  sendPasswordResetEmail
} from 'firebase/auth';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (user: User) => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
}

export default function AuthModal({ onClose, onLogin, onToast }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyScreen, setShowVerifyScreen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const switchTab = (newTab: 'login' | 'signup' | 'forgot') => {
    setTab(newTab);
    setAcceptedTerms(false);
    setErr('');
  };

  const submit = async () => {
    setErr('');
    if (tab === 'forgot') {
      if (!email.trim()) {
        setErr('Please enter your email address.');
        return;
      }
    } else {
      if (!email.trim() || !pass) {
        setErr('Please fill in all required fields.');
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'forgot') {
        await sendPasswordResetEmail(auth, email.trim());
        onToast('Password reset link sent to your email!');
        setTab('login');
        setErr('');
      } else if (tab === 'signup') {
        if (!name.trim()) {
          setErr('Name is required.');
          setLoading(false);
          return;
        }
        if (pass.length < 6) {
          setErr('Password must be 6+ characters.');
          setLoading(false);
          return;
        }
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
        // Set display name
        await updateProfile(userCredential.user, { displayName: name.trim() });
        // Send email verification
        await sendEmailVerification(userCredential.user);
        // Force log out so they aren't registered as logged-in of App.tsx
        await signOut(auth);
        
        // Switch to check email verify state
        setShowVerifyScreen(true);
        onToast('Verification email successfully sent!');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
        
        // Check if user's email is verified
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          setErr('Access denied. Please verify your email first.');
          setShowVerifyScreen(true);
          return;
        }

        const loggedUser: User = {
          name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
          email: userCredential.user.email || email.trim()
        };
        onLogin(loggedUser);
        onToast(`Welcome back, ${loggedUser.name}!`);
        onClose();
      }
    } catch (error: any) {
      console.warn('Firebase auth error:', error);
      let errorMsg = 'An authentication error occurred.';
      if (error?.code === 'auth/network-request-failed' || error?.message?.includes('network-request-failed')) {
        errorMsg = 'network-request-failed';
      } else if (error?.code === 'auth/email-already-in-use') {
        errorMsg = 'User already exists. Please sign in';
      } else if (error?.code === 'auth/user-not-found') {
        errorMsg = 'User does not exist with this email.';
      } else if (error?.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (
        error?.code === 'auth/wrong-password' || 
        error?.code === 'auth/invalid-credential' || 
        error?.message?.includes('invalid-credential') || 
        error?.message?.includes('auth/invalid-credential') ||
        error?.code?.includes('invalid-credential')
      ) {
        errorMsg = 'Email or password is incorrect';
      } else if (error?.message) {
        errorMsg = error.message;
      }
      setErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--surface)] border-t sm:border border-[var(--border)] rounded-t-[28px] sm:rounded-[24px] p-6 pb-10 sm:p-8 w-full max-w-[420px] shadow-[var(--shadow)] animate-slide-up sm:animate-fade-in relative z-[210] max-h-[92vh] overflow-y-auto custom-scroll">
        
        {/* Mobile Swipe-Up indicator drag handle */}
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mb-4 sm:hidden opacity-60" />
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Logo size={32} />
          <button
            onClick={onClose}
            className="bg-[var(--surface2)] border-none text-[var(--muted)] rounded-lg w-7 h-7 cursor-pointer flex items-center justify-center hover:text-[var(--text)]"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab Buttons & Form Body / Verification Screen */}
        {showVerifyScreen ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[rgba(124,106,240,0.12)] border border-[rgba(124,106,240,0.25)] flex items-center justify-center text-[var(--accent)] mb-4">
              <Mail size={32} />
            </div>
            <h3 className="font-display font-black text-xl text-[var(--text)] mb-2">Verify email</h3>
            <p className="text-xs text-[var(--muted)] px-3 mb-6 font-semibold leading-relaxed">
              Kindly verify your account from the mail received. If not, kindly check your spam folder.
            </p>
            {err && (
              err === 'network-request-failed' ? (
                <div className="bg-[rgba(240,98,146,0.06)] border border-[rgba(240,98,146,0.22)] rounded-xl p-3.5 text-xs text-left text-[var(--accent2)] flex flex-col gap-2 mb-4 antialiased">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-[var(--accent2)]">
                    <span>⚠️</span> Network Request Failed
                  </div>
                  <p className="font-semibold text-[var(--text)] leading-snug">Firebase Authentication is being blocked by your browser environment. To fix this:</p>
                  <ul className="list-disc pl-4 space-y-1.5 text-[var(--muted)] font-medium leading-relaxed">
                    <li>
                      <strong className="text-[var(--text)]">Disable Ad-Blockers / Brave Shields:</strong> Extensions like uBlock Origin or Brave Shields block standard Firebase APIs. Please pause them for this site.
                    </li>
                    <li>
                      <strong className="text-[var(--text)]">Authorize Domain:</strong> Ensure that <code className="bg-[var(--surface2)] text-[var(--accent)] px-1 py-0.5 rounded text-[11px] font-mono select-all font-bold">{window.location.host}</code> is added under <strong className="text-[var(--text)]">Authentication &gt; Settings &gt; Authorized Domains</strong> in your Firebase Console.
                    </li>
                  </ul>
                </div>
              ) : (
                <p className="text-[var(--accent2)] text-xs font-bold mb-4">{err}</p>
              )
            )}
            
            <button
              type="button"
              className="glow-btn w-full py-3.5 font-bold flex items-center justify-center gap-2 cursor-pointer"
              onClick={() => {
                setShowVerifyScreen(false);
                switchTab('login');
              }}
            >
              Login
            </button>
          </div>
        ) : (
          <>
            {/* Tab Buttons */}
            {tab !== 'forgot' && (
              <div className="flex gap-1 bg-[var(--surface2)] rounded-xl p-1 mb-6">
                <button
                  type="button"
                  className={`flex-1 py-2 font-sans font-semibold text-xs rounded-lg transition-all cursor-pointer ${
                    tab === 'login' ? 'bg-[var(--accent)] text-white font-bold' : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                  onClick={() => switchTab('login')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 font-sans font-semibold text-xs rounded-lg transition-all cursor-pointer ${
                    tab === 'signup' ? 'bg-[var(--accent)] text-white font-bold' : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                  onClick={() => switchTab('signup')}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Form Body */}
            <div className="flex flex-col gap-4">
              {tab === 'forgot' && (
                <div className="text-center px-2 py-1 mb-2">
                  <h3 className="font-display font-black text-lg text-[var(--text)] mb-1">Reset Password</h3>
                  <p className="text-xs text-[var(--muted)] font-semibold leading-relaxed">
                    Enter your email address below, and we'll send you a link to reset your password.
                  </p>
                </div>
              )}

              {/* EMAIL / PW FLOW FIELDS */}
              {tab === 'signup' && (
                <div>
                  <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5 flex items-center gap-1.5">
                    <UserIcon size={12} /> Full Name
                  </label>
                  <input
                    className="ifield"
                    placeholder="John Smith"
                    value={name}
                    autoComplete="name"
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[var(--muted)] block mb-1.5 flex items-center gap-1.5">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  className="ifield"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {tab !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5">
                      <Lock size={12} /> Password
                    </label>
                    {tab === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchTab('forgot')}
                        className="text-[11px] text-[var(--accent)] font-bold hover:underline bg-none border-none cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      className="ifield pr-11"
                      type={showP ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={pass}
                      autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                      onChange={(e) => setPass(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowP(!showP)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 text-[var(--muted)] transition-opacity"
                    >
                      {showP ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Terms of Service & Privacy Policy Checkbox - Mandatory for login/signup tab */}
              {tab !== 'forgot' && (
                <div
                  className="flex items-start gap-2.5 mt-1.5 p-1 select-none cursor-pointer group"
                  onClick={() => setAcceptedTerms(!acceptedTerms)}
                >
                  <div
                    className={`w-[18px] h-[18px] rounded border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                      acceptedTerms 
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white' 
                        : 'border-[var(--border)] bg-[var(--surface2)] group-hover:border-[var(--muted)]'
                    }`}
                  >
                    {acceptedTerms && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--muted)] font-semibold leading-snug group-hover:text-[var(--text)] transition-colors">
                    I agree to the <span className="text-[var(--accent)] font-bold underline">Terms of Service</span> and <span className="text-[var(--accent)] font-bold underline">Privacy Policy</span>
                  </span>
                </div>
              )}

              {err && (
                err === 'network-request-failed' ? (
                  <div className="bg-[rgba(240,98,146,0.06)] border border-[rgba(240,98,146,0.22)] rounded-xl p-3.5 text-xs text-left text-[var(--accent2)] flex flex-col gap-2 mt-1 antialiased">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-[var(--accent2)]">
                      <span>⚠️</span> Network Request Failed
                    </div>
                    <p className="font-semibold text-[var(--text)] leading-snug">Firebase Authentication is being blocked by your browser environment. To fix this:</p>
                    <ul className="list-disc pl-4 space-y-1.5 text-[var(--muted)] font-medium leading-relaxed">
                      <li>
                        <strong className="text-[var(--text)]">Disable Ad-Blockers / Brave Shields:</strong> Extensions like uBlock Origin or Brave Shields block standard Firebase APIs. Please pause them for this site.
                      </li>
                      <li>
                        <strong className="text-[var(--text)]">Authorize Domain:</strong> Ensure that <code className="bg-[var(--surface2)] text-[var(--accent)] px-1 py-0.5 rounded text-[11px] font-mono select-all font-bold">{window.location.host}</code> is added under <strong className="text-[var(--text)]">Authentication &gt; Settings &gt; Authorized Domains</strong> in your Firebase Console.
                      </li>
                    </ul>
                  </div>
                ) : (
                  <p className="text-[var(--accent2)] text-xs font-bold mt-1">{err}</p>
                )
              )}

              <button
                type="button"
                className="glow-btn w-full mt-3 flex items-center justify-center gap-2 cursor-pointer"
                onClick={submit}
                disabled={loading || (tab !== 'forgot' && !acceptedTerms)}
              >
                {loading ? 'Processing...' : (tab === 'forgot' ? 'Send Reset Link' : tab === 'login' ? 'Sign In' : 'Get Started')}
              </button>
            </div>

            {/* Footer Alternative */}
            <div className="text-center mt-5 text-xs text-[var(--muted)]">
              {tab === 'forgot' ? (
                <p>
                  Remembered your password?{' '}
                  <button
                    onClick={() => switchTab('login')}
                    type="button"
                    className="text-[var(--accent)] font-semibold hover:underline bg-none border-none cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              ) : tab === 'login' ? (
                <p>
                  New here?{' '}
                  <button
                    onClick={() => switchTab('signup')}
                    type="button"
                    className="text-[var(--accent)] font-semibold hover:underline bg-none border-none cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => switchTab('login')}
                    type="button"
                    className="text-[var(--accent)] font-semibold hover:underline bg-none border-none cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
