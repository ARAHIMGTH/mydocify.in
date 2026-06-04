/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, Minimize2, Combine, Scissors, Trash2, RotateCw, Stamp, Image, FileText, History, PanelLeftClose, PanelLeft, X, ListOrdered, FileImage, Sparkles, PlayCircle, PenTool, LayoutGrid } from 'lucide-react';
import Logo from './Logo';
import { Tool } from '../types';

interface SidebarProps {
  view: string;
  onSetView: (v: string) => void;
  activeTool: Tool | null;
  onSelectTool: (t: Tool) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  tools: Tool[];
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  installPromptAvailable?: boolean;
  onInstallApp?: () => void;
  isOffline?: boolean;
}

export default function Sidebar({
  view,
  onSetView,
  activeTool,
  onSelectTool,
  collapsed,
  onToggleCollapse,
  tools,
  mobileOpen = false,
  onCloseMobile,
  installPromptAvailable = false,
  onInstallApp,
  isOffline = false,
}: SidebarProps) {
  
  const extras = [
    { id: 'history', name: 'Download History', icon: History },
  ];

  const handleSetView = (v: string) => {
    onSetView(v);
    onCloseMobile?.();
  };

  const handleSelectTool = (t: Tool) => {
    onSelectTool(t);
    onCloseMobile?.();
  };

  // Maps custom tool keys to Lucide icons
  const getToolIcon = (id: string, color: string) => {
    const props = { size: 16, className: 'shrink-0', style: { color } };
    switch (id) {
      case 'compress':
        return <Minimize2 {...props} />;
      case 'merge':
        return <Combine {...props} />;
      case 'split':
        return <Scissors {...props} />;
      case 'reorder':
        return <ListOrdered {...props} />;
      case 'remove':
        return <Trash2 {...props} />;
      case 'rotate':
        return <RotateCw {...props} />;
      case 'watermark':
        return <Stamp {...props} />;
      case 'pdf2img':
        return <Image {...props} />;
      case 'img2pdf':
        return <FileImage {...props} />;
      case 'signer':
        return <PenTool {...props} />;
      case 'nup':
        return <LayoutGrid {...props} />;
      default:
        return <FileText {...props} />;
    }
  };

  const renderWidth = (collapsed && !mobileOpen) ? '68px' : '260px';
  const showContent = !collapsed || mobileOpen;

  return (
    <>
      {/* Background overlay for mobile view */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
        />
      )}

      <aside
        style={{ width: renderWidth }}
        className={`
          bg-[var(--surface)] border-r border-[var(--border)] flex flex-col 
          transition-[width,transform] duration-300 ease-in-out z-50 shrink-0 overflow-hidden h-full
          fixed md:relative inset-y-0 left-0
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-[var(--border)] min-h-[64px] select-none">
          <div
            className="flex items-center gap-3.5 cursor-pointer"
            onClick={() => handleSetView('home')}
          >
            <div className="shrink-0 flex items-center gap-1.5 overflow-hidden">
              <Logo showText={showContent} size={34} textSizeClass="text-lg" />
            </div>
          </div>

          {/* Mobile close button drawer trigger */}
          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)] rounded-xl p-2 cursor-pointer hover:bg-[var(--border)] transition-colors shrink-0"
              title="Close Menu"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav Content */}
        <div className="flex-1 overflow-y-auto p-2.5 custom-scroll flex flex-col gap-1.5 select-none">
          
          {/* Core Link */}
          <button
            type="button"
            onClick={() => handleSetView('home')}
            style={{ justifyContent: showContent ? 'flex-start' : 'center' }}
            className={`sidebar-link ${view === 'home' ? 'active' : ''}`}
            title="Dashboard"
          >
            <Home size={16} className="shrink-0" />
            {showContent && <span>Dashboard</span>}
          </button>

          {showContent && (
            <div className="text-[10px] font-black tracking-wider text-[var(--muted)] uppercase px-3 mt-4 mb-1">
              PDF Tools
            </div>
          )}
          {!showContent && <div className="h-4" />}

          {/* Dynamic Tools */}
          {tools.map((t) => {
            const isActive = view === 'tool' && activeTool?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTool(t)}
                style={{ justifyContent: showContent ? 'flex-start' : 'center' }}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                title={t.name}
              >
                {getToolIcon(t.id, t.color)}
                {showContent && <span className="truncate">{t.name}</span>}
              </button>
            );
          })}



          {showContent && (
            <div className="text-[10px] font-black tracking-wider text-[var(--muted)] uppercase px-3 mt-4 mb-1">
              General Pages
            </div>
          )}
          {!showContent && <div className="h-4" />}

          {/* Static Extra Pages */}
          {extras.map((extra) => {
            const IconComp = extra.icon;
            const isActive = view === extra.id;
            return (
              <button
                key={extra.id}
                type="button"
                onClick={() => handleSetView(extra.id)}
                style={{ justifyContent: showContent ? 'flex-start' : 'center' }}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                title={extra.name}
              >
                <IconComp size={16} className="shrink-0 text-[var(--muted)]" />
                {showContent && <span>{extra.name}</span>}
              </button>
            );
          })}
        </div>

        {/* PWA Installer and Connection Indicator Block */}
        {(installPromptAvailable || isOffline) && (
          <div className="p-3 mx-2.5 mb-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface2)]/40 flex flex-col gap-2">
            {isOffline ? (
              <div className="flex items-center gap-2 text-rose-500 font-sans" style={{ justifyContent: showContent ? 'flex-start' : 'center' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                {showContent && <span className="text-[10px] font-black uppercase tracking-wider">Offline Cache Active</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-500 font-sans" style={{ justifyContent: showContent ? 'flex-start' : 'center' }}>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {showContent && <span className="text-[10px] font-black uppercase tracking-wider">Secure Local Safe</span>}
              </div>
            )}

            {installPromptAvailable && showContent && (
              <button
                type="button"
                onClick={onInstallApp}
                className="w-full bg-[var(--accent)] hover:bg-[rgba(124,106,240,0.9)] text-white text-[10.5px] font-bold py-1.5 px-2.5 rounded-lg shadow-sm shadow-[rgba(124,106,240,0.2)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center uppercase tracking-wider scale-[0.98]"
              >
                <Sparkles size={11} /> <span>Install MyDocify</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom Collapse Handle */}
        <div className="p-2 border-t border-[var(--border)] mt-auto bg-transparent">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="sidebar-link w-full border-none bg-transparent flex gap-3 py-2.5 px-3 rounded-xl hover:bg-[var(--surface2)] cursor-pointer text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            style={{ justifyContent: showContent ? 'flex-start' : 'center' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {!showContent ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            {showContent && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
