/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, User as UserIcon, Mail, Lock, Eye, EyeOff, AlertOctagon, Trash2, ShieldAlert, Send } from 'lucide-react';
import { User } from '../types';
import { auth } from '../firebase';
import { updateProfile, sendPasswordResetEmail, deleteUser, signOut, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updated: User) => void;
  onLogout: () => void;
  onToast: (msg: string, type?: 'ok' | 'err') => void;
}

export default function ProfileModal({ user, onClose, onUpdateUser, onLogout, onToast }: ProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const handleUpdateProfile = async () => {
    setErr('');
    if (!name.trim()) {
      setErr('Name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, { displayName: name.trim() });
        const updatedUser: User = {
          ...user,
          name: name.trim(),
        };
        onUpdateUser(updatedUser);
        onToast('Username successfully updated!', 'ok');
      } else {
        setErr('No authenticated session found.');
      }
    } catch (error: any) {
      console.warn('Error updating profile:', error);
      setErr(error?.message || 'Failed to update username.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async () => {
    setErr('');
    setLoading(true);
    try {
      if (user.email) {
        await sendPasswordResetEmail(auth, user.email);
        setResetSent(true);
        onToast('Password reset link sent to your Gmail!', 'ok');
      } else {
        setErr('No email associated with this session.');
      }
    } catch (error: any) {
      console.warn('Error sending password reset email:', error);
      setErr(error?.message || 'Failed to send password reset link. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setErr('');
    if (deleteConfirmText.toLowerCase() !== 'delete my account') {
      setErr('Please type "delete my account" exactly to confirm.');
      return;
    }
    if (!deletePassword) {
      setErr('Please enter your current account password to authorize deletion.');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userEmail = currentUser.email || user.email;

        // Reauthenticate current user prior to high-sensitivity profile deletion
        try {
          const credential = EmailAuthProvider.credential(userEmail, deletePassword);
          await reauthenticateWithCredential(currentUser, credential);
        } catch (reauthErr: any) {
          console.warn('Reauthentication failed:', reauthErr);
          if (reauthErr?.code === 'auth/wrong-password' || reauthErr?.code === 'auth/invalid-credential' || reauthErr?.message?.includes('invalid-credential')) {
            throw new Error('Incorrect password. Please provide your correct password to authorize deletion.');
          } else {
            throw new Error(reauthErr?.message || 'Failed to authenticate your session. Please verify your credentials.');
          }
        }
        
        // 1. Terminate user from Firebase Auth
        await deleteUser(currentUser);

        // 2. Clear user-specific history and acceptances locally
        const historyKey = `docify_history_${userEmail.toLowerCase()}`;
        const tcKey = `docify_tc_accepted_${userEmail.toLowerCase()}`;
        localStorage.removeItem(historyKey);
        localStorage.removeItem(tcKey);

        // 3. Trigger logout in main app
        onToast('Your account and all associated data have been permanently deleted.', 'ok');
        onLogout();
        onClose();
      } else {
        setErr('No authenticated session found.');
      }
    } catch (error: any) {
      console.warn('Error deleting account:', error);
      setErr(error?.message || 'Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="profile-modal-overlay"
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="profile-modal-container"
        className="bg-[var(--surface)] border-t sm:border border-[var(--border)] rounded-t-[28px] sm:rounded-[24px] p-6 pb-10 sm:p-8 w-full max-w-[500px] shadow-[var(--shadow)] animate-slide-up sm:animate-fade-in relative z-[210] max-h-[92vh] overflow-y-auto custom-scroll"
      >
        {/* Mobile Swipe-Up indicator drag handle */}
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mb-4 sm:hidden opacity-60" />
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(124,106,240,0.12)] border border-[rgba(124,106,240,0.25)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <UserIcon size={20} />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[var(--text)] leading-none">Your Profile</h2>
              <p className="text-[10px] text-[var(--muted)] font-bold uppercase mt-1 tracking-wider">Account Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-[var(--surface2)] border-none text-[var(--muted)] hover:text-[var(--text)] rounded-lg w-7 h-7 cursor-pointer flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {err && (
          <div className="bg-[rgba(240,98,146,0.08)] border border-[rgba(240,98,146,0.3)] rounded-xl p-3.5 text-xs text-[var(--accent2)] font-semibold mb-5 leading-normal">
            ⚠️ {err}
          </div>
        )}

        <div className="space-y-6">
          {/* Email section (Read-only) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block flex items-center gap-1">
              <Mail size={12} /> Email Address (Cannot change)
            </label>
            <input
              type="text"
              className="ifield bg-[var(--surface2)] text-[var(--muted)] font-semibold cursor-not-allowed select-all"
              value={user.email}
              disabled
              readOnly
            />
          </div>

          {/* User Name Update Section */}
          <div className="space-y-2 border-t border-[var(--border)] pt-5">
            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block flex items-center gap-1">
              <UserIcon size={12} /> Full Name / Username
            </label>
            <div className="flex gap-2.5">
              <input
                type="text"
                className="ifield flex-1"
                placeholder="Change name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={loading || name.trim() === user.name}
                className="bg-[var(--surface2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] font-bold text-xs rounded-xl px-4 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0"
              >
                Save
              </button>
            </div>
          </div>

          {/* Change Password Section via Email Link */}
          <div className="space-y-3 border-t border-[var(--border)] pt-5">
            <label className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider block flex items-center gap-1">
              <Lock size={12} /> Reset Password
            </label>
            
            <p className="text-[11px] text-[var(--muted)] leading-relaxed font-medium">
              To reset your password, we will send a secure verification link directly to your verified Gmail inbox (<strong className="text-[var(--text)]">{user.email}</strong>). Clicking this link will open a new secure browser window where you can specify and confirm your new password.
            </p>

            {resetSent ? (
              <div className="bg-[rgba(67,233,123,0.06)] border border-[rgba(67,233,123,0.25)] rounded-xl p-3 flex items-start gap-2.5 text-[var(--accent3)] animate-fade-in">
                <Send size={15} className="mt-0.5 shrink-0" />
                <div className="text-[11px] leading-relaxed font-semibold">
                  <span className="font-bold text-[var(--text)]">Verification email sent!</span> Please check your Gmail inbox (including Spam/Promotions folder) to set up your new credentials.
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendResetLink}
                disabled={loading}
                className="w-full glow-btn font-semibold text-xs py-2.5 mt-1 flex items-center justify-center gap-2"
              >
                <Send size={13} /> Send Reset Verification Link
              </button>
            )}
          </div>

          {/* Permanent Deletion section */}
          <div className="border-t border-[var(--border)] pt-5">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-[rgba(240,98,146,0.06)] hover:bg-[rgba(240,98,146,0.12)] text-[var(--accent2)] border border-[rgba(240,98,146,0.25)] rounded-xl py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={13} /> Delete Account & My Data Permanently
              </button>
            ) : (
              <div className="bg-[rgba(240,98,146,0.04)] border border-[rgba(240,98,146,0.25)] rounded-xl p-4 space-y-3.5 animate-fade-in">
                <div className="flex gap-2 text-[var(--accent2)]">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-display font-black text-xs uppercase tracking-wide">Danger Zone: Irreversible Action</h4>
                    <p className="text-[11px] font-semibold text-[var(--muted)] mt-1 leading-snug">
                      This will permanently delete your MYDOCIFY user account and purge all locally processed download history. You can sign up again later with a new clean account.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wide block">
                    Type <strong className="text-[var(--text)] select-all font-mono">delete my account</strong> to proceed:
                  </label>
                  <input
                    type="text"
                    className="ifield"
                    placeholder="delete my account"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wide block">
                    Enter Current Password:
                  </label>
                  <div className="relative">
                    <input
                      type={showDeletePassword ? 'text' : 'password'}
                      className="ifield pr-12"
                      placeholder="Enter account password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                    >
                      {showDeletePassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1 font-semibold text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                      setDeletePassword('');
                    }}
                    className="flex-1 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface2)] text-[var(--text)] rounded-lg py-2 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={loading || deleteConfirmText.toLowerCase() !== 'delete my account' || !deletePassword}
                    className="flex-1 bg-[var(--accent2)] text-white hover:opacity-90 rounded-lg py-2 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Delete Forever'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
