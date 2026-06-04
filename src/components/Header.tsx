/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowLeft, LogOut, LogIn, UserPlus, Menu } from 'lucide-react';
import { Tool, User } from '../types';

interface HeaderProps {
  view: string;
  onGoHome: () => void;
  activeTool: Tool | null;
  theme: string;
  onToggleTheme: () => void;
  user: User | null;
  onSignOut: () => void;
  onShowAuth: () => void;
  onOpenMobileMenu?: () => void;
  onShowProfile: () => void;
}

export default function Header({
  view,
  onGoHome,
  activeTool,
  theme,
  onToggleTheme,
  user,
  onSignOut,
  onShowAuth,
  onOpenMobileMenu,
  onShowProfile,
}: HeaderProps) {
  
  const getHeaderDetails = () => {
    if (view === 'home') {
      return {
        title: 'Dashboard',
        desc: 'Access your offline-first local PDF suite.',
      };
    }
    if (view === 'tool' && activeTool) {
      return {
        title: activeTool.name,
        desc: activeTool.desc,
      };
    }
    if (view === 'contact') {
      return {
        title: 'Contact Us',
        desc: 'Send us feedback, bugs, or feature queries.',
      };
    }
    if (view === 'privacy') {
      return {
        title: 'Privacy Policy',
        desc: 'Learn how your data remains secure and local.',
      };
    }
    if (view === 'terms') {
      return {
        title: 'Terms & Conditions',
        desc: 'Please read our localized terms of operations.',
      };
    }
    if (view === 'history') {
      return {
        title: 'Download History',
        desc: 'Recent downloads from your active session.',
      };
    }
    return { title: 'MYDOCIFY', desc: '' };
  };

  const details = getHeaderDetails();

  return (
    <header className="h-[64px] bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-40 select-none">
      
      {/* Back button, Menu indicator & context Titles */}
      <div className="flex items-center gap-2.5 sm:gap-4 py-1.5 h-full overflow-hidden">
        {/* Toggle Menu Button on Mobile */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden bg-[var(--surface2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] rounded-xl p-2 cursor-pointer flex items-center justify-center transition-all shrink-0"
          title="Open Menu"
        >
          <Menu size={18} />
        </button>

        {view === 'tool' && activeTool && (
          <button
            type="button"
            onClick={onGoHome}
            className="bg-[var(--surface2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] rounded-xl py-1.5 px-3 cursor-pointer flex items-center gap-1.5 font-semibold text-xs transition-all shrink-0"
          >
            <ArrowLeft size={13} /> <span className="hidden sm:inline">Back</span>
          </button>
        )}
        <div className="flex flex-col justify-center overflow-hidden">
          <h2 className="font-display font-black text-sm sm:text-lg text-[var(--text)] leading-none truncate">
            {details.title}
          </h2>
          {details.desc && (
            <p className="hidden xs:block text-[10px] sm:text-[11px] text-[var(--muted)] font-medium truncate mt-1 max-w-[140px] sm:max-w-[400px]">
              {details.desc}
            </p>
          )}
        </div>
      </div>

      {/* Settings & Auth actions */}
      <div className="flex items-center gap-2 sm:gap-5 shrink-0">
        
        {/* 4-State Theme Toggle Slider and Labels */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-sm select-none opacity-85" aria-hidden="true">
            {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : theme === 'neon' ? '⚡' : '✨'}
          </span>
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            title={`Switch Theme (Current: ${theme})`}
          >
            <div className="knob">
              {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : theme === 'neon' ? '⚡' : '✨'}
            </div>
          </button>
          <span className="hidden sm:inline-block text-[10px] font-extrabold text-[var(--muted)] tracking-wider w-[80px] select-none capitalize text-left">
            {theme === 'dark' ? 'Amethyst' : theme === 'light' ? 'Light' : theme === 'neon' ? 'Cyber Neon' : 'Aurora Dream'}
          </span>
        </div>

        <div className="hidden sm:block w-px h-5 bg-[var(--border)]" />

        {/* Auth profile states */}
        {user ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onShowProfile}
              className="flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 group focus:outline-none"
              title="Manage Profile"
            >
              <div className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center font-display font-black text-white text-xs sm:text-sm select-none border border-[var(--border)] group-hover:shadow-[0_0_12px_rgba(124,106,240,0.4)] transition-all">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-[9px] font-bold text-[var(--accent)] group-hover:text-[var(--accent2)] tracking-wider mt-0.5 leading-none uppercase select-none transition-colors">
                Profile
              </span>
            </button>
            <div className="hidden md:flex flex-col select-none max-w-[100px]">
              <span className="text-xs font-bold text-[var(--text)] leading-none truncate">
                {user.name}
              </span>
              <span className="text-[9px] text-[var(--muted)] font-medium leading-none truncate mt-1">
                {user.email}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="text-[var(--muted)] hover:text-[var(--accent2)] cursor-pointer p-1.5 rounded-lg transition-colors ml-0.5 self-center shrink-0"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={onShowAuth}
              className="bg-[var(--surface2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] rounded-xl py-1.5 px-2.5 sm:py-2 sm:px-3.5 cursor-pointer font-bold text-[10px] sm:text-xs flex items-center gap-1 transition-all shrink-0"
            >
              <LogIn size={11} /> <span>Sign In</span>
            </button>
            <button
              onClick={onShowAuth}
              className="hidden sm:flex glow-btn py-2 px-4 text-xs font-bold items-center gap-1.5 shrink-0"
            >
              <UserPlus size={11} /> <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
