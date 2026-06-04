/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, DragEvent, ChangeEvent, MouseEvent, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import TcModal from './components/TcModal';
import Logo, { LogoIcon } from './components/Logo';
import CompressTool from './components/Tools/CompressTool';
import MergeTool from './components/Tools/MergeTool';
import SplitTool from './components/Tools/SplitTool';
import RemoveTool from './components/Tools/RemoveTool';
import RotateTool from './components/Tools/RotateTool';
import WatermarkTool from './components/Tools/WatermarkTool';
import Pdf2ImgTool from './components/Tools/Pdf2ImgTool';
import Img2PdfTool from './components/Tools/Img2PdfTool';
import ReorderTool from './components/Tools/ReorderTool';
import SignerTool from './components/Tools/SignerTool';
import NupTool from './components/Tools/NupTool';
import ContactPage from './components/Pages/ContactPage';
import PrivacyPage from './components/Pages/PrivacyPage';
import TermsPage from './components/Pages/TermsPage';
import HistoryPage from './components/Pages/HistoryPage';
import FaqSection from './components/FaqSection';
import { Tool, HistoryItem, User, HistoryFile } from './types';
import { auth, analyticsPromise } from './firebase';
import { logEvent } from 'firebase/analytics';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  Minimize2, 
  Combine, 
  Scissors, 
  Trash2, 
  RotateCw, 
  Stamp, 
  Image as ImageIcon, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Heart, 
  CheckCircle2,
  FileText,
  UploadCloud,
  X as CloseIcon,
  ListOrdered,
  PenTool,
  LayoutGrid,
  FileImage,
  PlayCircle,
  Tv,
  Sliders,
  Layers,
  Search,
  Star,
  Sparkles,
  ArrowUp,
  Trees
} from 'lucide-react';

const TOOLS: Tool[] = [
  { id: 'compress', name: 'Compress PDF', icon: 'compress', color: '#7c6af0', desc: 'Optimize images and streams to reduce file size with balanced levels.' },
  { id: 'merge', name: 'Merge PDFs', icon: 'merge', color: '#f06292', desc: 'Combine multiple documents in any custom arrangement into a single file.' },
  { id: 'split', name: 'Split PDF', icon: 'split', color: '#43e97b', desc: 'Disassemble document pages into individual single-page PDF files.' },
  { id: 'reorder', name: 'Reorder Pages', icon: 'reorder', color: '#4facfe', desc: 'Rearrange page sequences, discard specific sheets, or reverse entire files.' },
  { id: 'remove', name: 'Remove Pages', icon: 'remove', color: '#ffd740', desc: 'Visually select and strike out unnecessary pages from a loaded file.' },
  { id: 'rotate', name: 'Rotate Pages', icon: 'rotate', color: '#00c6ff', desc: 'Rotate specific boundaries or rotate entire sheets at 90-degree steps.' },
  { id: 'watermark', name: 'Add Watermark', icon: 'watermark', color: '#a78bfa', desc: 'Stamp editable, semi-transparent text watermarks centered onto your sheets.' },
  { id: 'pdf2img', name: 'PDF to Images', icon: 'img', color: '#fd746c', desc: 'Convert and extract pages losslessly into high-resolution PNG image grids.' },
  { id: 'img2pdf', name: 'Images to PDF', icon: 'img2pdf', color: '#f857a6', desc: 'Upload local JPEG, PNG, or WebP images and render them into a single compiled PDF.' },
  { id: 'signer', name: 'Draw & Sign PDF', icon: 'signer', color: '#059669', desc: 'Freehand draw or type elegant cursive signatures and visually position them on any page.' },
  { id: 'nup', name: 'N-Up Page Gridder', icon: 'nup', color: '#7c3aed', desc: 'Compile layout formats of multiple pages in 2-up, 4-up, or custom booklet printing grids.' },
];

// Helper to serialize history to local storage with base64 encoded Uint8Arrays
function serializeHistory(items: HistoryItem[]): string {
  const serialized = items.map((item) => {
    const files = item.files?.map((file) => {
      if (file.bytes) {
        let binary = '';
        const len = file.bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(file.bytes[i]);
        }
        const base64 = window.btoa(binary);
        return {
          name: file.name,
          base64: base64,
        };
      }
      return {
        name: file.name,
        dataUrl: file.dataUrl,
      };
    });
    return {
      id: item.id,
      name: item.name,
      tool: item.tool,
      size: item.size,
      time: item.time,
      files,
    };
  });
  return JSON.stringify(serialized);
}

// Helper to deserialize history from local storage
function deserializeHistory(jsonStr: string): HistoryItem[] {
  try {
    const parsed = JSON.parse(jsonStr) as any[];
    if (!Array.isArray(parsed)) return [];
    
    return parsed.map((item) => {
      const files = item.files?.map((file: any) => {
        if (file.base64) {
          const binaryString = window.atob(file.base64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return {
            name: file.name,
            bytes: bytes,
          };
        }
        return {
          name: file.name,
          dataUrl: file.dataUrl,
        };
      });
      return {
        id: item.id,
        name: item.name,
        tool: item.tool,
        size: item.size,
        time: item.time,
        files,
      };
    });
  } catch (err) {
    console.error('Error deserializing history:', err);
    return [];
  }
}

function safeSaveHistory(key: string, items: HistoryItem[]) {
  const now = Date.now();
  const ONE_HOUR = 3600000;
  let activeItems = items.filter((item) => now - item.time < ONE_HOUR);

  try {
    const serialized = serializeHistory(activeItems);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn('Storage quota warning. Pruning larger payloads to fit...', err);
    let successfullySaved = false;
    for (let attempts = 1; attempts <= 3; attempts++) {
      try {
        activeItems = activeItems.map((item, idx) => {
          if (idx >= activeItems.length - attempts) {
            return {
              ...item,
              files: item.files?.map((f) => ({ name: f.name })),
            };
          }
          return item;
        });
        const serialized = serializeHistory(activeItems);
        localStorage.setItem(key, serialized);
        successfullySaved = true;
        break;
      } catch (innerErr) {
        // continue
      }
    }
    
    if (!successfullySaved) {
      try {
        const metaOnly = activeItems.map((item) => ({
          ...item,
          files: item.files?.map((f) => ({ name: f.name })),
        }));
        localStorage.setItem(key, serializeHistory(metaOnly));
      } catch (finalErr) {
        console.error('Failed to save even metadata only', finalErr);
      }
    }
  }
}

export default function App() {
  const [view, setView] = useState<string>('home');
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('pdf-theme') || 'dark');

  // Premium UI & UX Enhancements States
  const [pinnedTools, setPinnedTools] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('docify_pinned_tools') || '[]');
    } catch {
      return [];
    }
  });
  const [windowDragActive, setWindowDragActive] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [themeSparkle, setThemeSparkle] = useState<boolean>(false);
  const [toasts, setToasts] = useState<{ id: string; msg: string; type: 'ok' | 'err' }[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const isInitialAuthRef = useRef<boolean>(true);

  // Cross-Tool Shared Document States
  const [sharedFiles, setSharedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showTcModal, setShowTcModal] = useState<boolean>(false);
  const [tcWarningMode, setTcWarningMode] = useState<boolean>(false);
  const [pendingTool, setPendingTool] = useState<Tool | null>(null);
  const [showLoginRequired, setShowLoginRequired] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [toolSearch, setToolSearch] = useState<string>('');

  // PWA and Local Connection State Monitoring
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Dynamically update document title and meta description for SEO / Search Engine indexing!
  useEffect(() => {
    let title = 'MyDocify - Your Free Local Offline-Safe PDF Utilities Suite';
    let description = 'Optimize, merge, split, compress, and sign PDF documents natively offline in your browser. Zero server uploads. Total privacy with WebAssembly.';

    if (view === 'tool' && activeTool) {
      title = `${activeTool.name} - MyDocify`;
      description = `${activeTool.desc} Edit, modify, and optimize your PDF documents locally and privately on MyDocify.`;
    } else if (view === 'contact') {
      title = 'Contact Us - MyDocify';
      description = 'Get in touch with the MyDocify team. We are here to help you with offline-safe PDF compression, conversion, and editing.';
    } else if (view === 'privacy') {
      title = 'Privacy Policy - MyDocify';
      description = 'Read our privacy policy. Your documents are processed 100% locally on your device via compilation threads. We never upload any file to any server.';
    } else if (view === 'terms') {
      title = 'Terms & Conditions - MyDocify';
      description = 'Browse through our Terms of Service for MyDocify local security PDF suite tools.';
    } else if (view === 'history') {
      title = 'Download History - MyDocify';
      description = 'Review your secure download session history and local compiler statistics.';
    }

    document.title = title;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [view, activeTool]);

  // Synchronize incoming URL route with app state on load & popstate (Back/Forward)
  useEffect(() => {
    const syncFromUrl = () => {
      const pathname = window.location.pathname.replace(/^\/|\/$/g, '');
      if (!pathname || pathname === 'home') {
        setView('home');
        setActiveTool(null);
      } else if (['contact', 'privacy', 'terms', 'history'].includes(pathname)) {
        setView(pathname);
        setActiveTool(null);
      } else {
        const foundTool = TOOLS.find((t) => t.id === pathname);
        if (foundTool) {
          setView('tool');
          setActiveTool(foundTool);
        } else {
          setView('home');
          setActiveTool(null);
        }
      }
    };

    // Run on initial load
    syncFromUrl();

    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Synchronize internal state changes out to the browser URL path (pushState)
  useEffect(() => {
    let targetPath = '/';
    if (view === 'tool' && activeTool) {
      targetPath = `/${activeTool.id}`;
    } else if (view && view !== 'home' && view !== 'tool') {
      targetPath = `/${view}`;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [view, activeTool]);

  // Listen to PWA trigger prompts and network statuses
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      triggerToast('MyDocify is installable as an offline app! Click the Install button on the menu to proceed.', 'ok');
    };
    const handleOnline = () => {
      setIsOffline(false);
      triggerToast('Network online. Synchronized local secure processes.', 'ok');
    };
    const handleOffline = () => {
      setIsOffline(true);
      triggerToast('Network disconnected. Offline storage cache enabled successfully.', 'ok');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        triggerToast('Thank you for installing MyDocify!', 'ok');
      }
    } catch (err) {
      console.error('Install error:', err);
    }
    setDeferredPrompt(null);
  };

  // Trigger quick informational toast message (with stack capabilities)
  const triggerToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sync theme selection to document root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pdf-theme', theme);
    
    // Smooth transition trigger
    setThemeSparkle(true);
    const timer = setTimeout(() => setThemeSparkle(false), 900);
    return () => clearTimeout(timer);
  }, [theme]);

  // Google Analytics page_view/screen_view tracking
  useEffect(() => {
    analyticsPromise.then((anal) => {
      if (anal) {
        const screenName = activeTool ? `tool_${activeTool}` : `view_${view}`;
        logEvent(anal, 'screen_view', {
          firebase_screen: screenName,
          firebase_screen_class: 'App'
        });
      }
    }).catch((err) => console.debug('Analytics blocked or inactive:', err));
  }, [view, activeTool]);

  // Global listeners for key shortcuts, view-wide dragging events, and window scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD + K or CTRL + K focuses search bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        triggerToast('Focused offline search bar! ⌘K', 'ok');
      }
      // ESC closes search and active tool back to home
      if (e.key === 'Escape' && view !== 'home') {
        setView('home');
        setActiveTool(null);
        triggerToast('Returned to main dashboard.', 'ok');
      }
    };

    const handleScroll = () => {
      if (window.scrollY > 220) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    // Full screen drag event handlers
    const handleDragEnter = (e: DragEvent | any) => {
      e.preventDefault();
      e.stopPropagation();
      setWindowDragActive(true);
    };

    const handleDragLeave = (e: DragEvent | any) => {
      e.preventDefault();
      e.stopPropagation();
      // On leaving browser window coordinates
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setWindowDragActive(false);
      }
    };

    const handleGlobalDrop = (e: DragEvent | any) => {
      e.preventDefault();
      e.stopPropagation();
      setWindowDragActive(false);
      
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const pdfs = Array.from(files).filter((file: any) => {
          return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        }) as File[];
        
        if (pdfs.length > 0) {
          setSharedFiles((prev) => [...prev, ...pdfs]);
          triggerToast(`Preloaded ${pdfs.length} PDF file${pdfs.length > 1 ? 's' : ''} natively offline!`, 'ok');
        } else {
          triggerToast('Please drop valid PDF files only.', 'err');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', handleGlobalDrop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', (e) => e.preventDefault());
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, [view]);

  // Sync auth state with Firebase Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser && fbUser.emailVerified) {
        const nextUser = {
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
        };
        setUser(nextUser);
        
        // Force reset active tools and view to protect previous guest/user state ONLY if not initial page load
        if (isInitialAuthRef.current) {
          isInitialAuthRef.current = false;
        } else {
          setView('home');
          setActiveTool(null);
        }

        // Load specific user's history
        const key = `docify_history_${nextUser.email.toLowerCase()}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const loaded = deserializeHistory(raw);
          const now = Date.now();
          const ONE_HOUR = 3600000;
          setHistory(loaded.filter((h) => now - h.time < ONE_HOUR));
        } else {
          setHistory([]);
        }
      } else {
        setUser(null);
        
        // Force navigate back and clean up all results / tools on logout ONLY if not initial page load
        if (isInitialAuthRef.current) {
          isInitialAuthRef.current = false;
        } else {
          setView('home');
          setActiveTool(null);
        }
        
        // Load guest's history
        const key = 'docify_history_guest';
        const raw = localStorage.getItem(key);
        if (raw) {
          const loaded = deserializeHistory(raw);
          const now = Date.now();
          const ONE_HOUR = 3600000;
          setHistory(loaded.filter((h) => now - h.time < ONE_HOUR));
        } else {
          setHistory([]);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Check T&C acceptance when user successfully logs in
  useEffect(() => {
    if (user) {
      const accepted = localStorage.getItem(`docify_tc_accepted_${user.email.toLowerCase()}`) === 'true';
      if (!accepted) {
        setShowTcModal(true);
        setTcWarningMode(false);
      }
    }
  }, [user]);

  const handleTcAccept = () => {
    const key = user ? `docify_tc_accepted_${user.email.toLowerCase()}` : 'docify_tc_accepted_guest';
    localStorage.setItem(key, 'true');
    setShowTcModal(false);
    triggerToast('Terms & Conditions accepted. Thank you!', 'ok');
    if (pendingTool) {
      setActiveTool(pendingTool);
      setView('tool');
      setPendingTool(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTcDecline = async () => {
    setShowTcModal(false);
    setPendingTool(null);
    if (user) {
      try {
        await signOut(auth);
        triggerToast('You must accept our Terms to utilize account features.', 'err');
      } catch (err) {
        console.error(err);
      }
    } else {
      triggerToast('You have declined the Terms & Conditions.', 'err');
    }
  };

  const addHistoryItem = (item: { name: string; tool: string; size: string; files?: HistoryFile[] }) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 11),
      name: item.name,
      tool: item.tool,
      size: item.size,
      time: Date.now(),
      files: item.files,
    };

    setHistory((prev) => {
      const updated = [newItem, ...prev];
      const key = user ? `docify_history_${user.email.toLowerCase()}` : 'docify_history_guest';
      safeSaveHistory(key, updated);
      return updated;
    });
  };

  const handleSelectTool = (tool: Tool) => {
    // Prevent usage of tools if user is not authenticated, instead showing the beautiful login-required popup dialog
    if (!user) {
      setShowLoginRequired(true);
      return;
    }

    const key = `docify_tc_accepted_${user.email.toLowerCase()}`;
    const isAccepted = localStorage.getItem(key) === 'true';

    if (!isAccepted) {
      setPendingTool(tool);
      setTcWarningMode(true);
      setShowTcModal(true);
      return;
    }

    setActiveTool(tool);
    setView('tool');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setView('home');
    setActiveTool(null);
  };

  const handleClearPreloaded = (e?: MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSharedFiles([]);
    triggerToast('Pre-loaded document dismissed.');
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = (Array.from(e.dataTransfer.files) as File[]).filter(
        (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf')
      );
      if (files.length > 0) {
        setSharedFiles(files);
        triggerToast(`Successfully pre-loaded ${files.length} PDF file(s). Select a tool below!`);
      } else {
        triggerToast('Please upload PDF files only.', 'err');
      }
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = (Array.from(e.target.files) as File[]).filter(
        (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf')
      );
      if (files.length > 0) {
        setSharedFiles(files);
        triggerToast(`Successfully pre-loaded ${files.length} PDF file(s). Select a tool below!`);
      } else {
        triggerToast('Please upload PDF files only.', 'err');
      }
    }
  };

  const getToolIcon = (id: string, color: string) => {
    const props = { size: 18, style: { color } };
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
        return <ImageIcon {...props} />;
      case 'img2pdf':
        return <FileImage {...props} />;
      case 'signer':
        return <PenTool {...props} />;
      case 'nup':
        return <LayoutGrid {...props} />;
      default:
        return null;
    }
  };

  const togglePinTool = (toolId: string, e: MouseEvent<HTMLButtonElement> | any) => {
    e.stopPropagation();
    let updated;
    if (pinnedTools.includes(toolId)) {
      updated = pinnedTools.filter((id) => id !== toolId);
      triggerToast('Removed tool from shortcuts grid.');
    } else {
      updated = [...pinnedTools, toolId];
      triggerToast('Pinned tool shortcut prominently on dashboard! ⭐');
    }
    setPinnedTools(updated);
    localStorage.setItem('docify_pinned_tools', JSON.stringify(updated));
  };

  const filteredTools = TOOLS.filter(t => 
    t.name.toLowerCase().includes(toolSearch.toLowerCase()) || 
    t.desc.toLowerCase().includes(toolSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden relative font-sans leading-normal">
      {/* Dynamic blurred glow backdrops */}
      {theme === 'dark' && (
        <>
          <div className="fixed w-[500px] h-[500px] rounded-full filter blur-[120px] bg-[rgba(124,106,240,0.06)] -top-[160px] -left-[160px] pointer-events-none z-0 animate-float-pulse" />
          <div className="fixed w-[360px] h-[360px] rounded-full filter blur-[100px] bg-[rgba(240,98,146,0.05)] bottom-0 right-[60px] pointer-events-none z-0 animate-float-pulse-reverse" />
        </>
      )}
      {theme === 'neon' && (
        <>
          <div className="fixed w-[500px] h-[500px] rounded-full filter blur-[140px] bg-[rgba(244,63,94,0.08)] -top-[120px] -left-[120px] pointer-events-none z-0 animate-float-pulse" />
          <div className="fixed w-[420px] h-[420px] rounded-full filter blur-[120px] bg-[rgba(6,182,212,0.07)] bottom-[10px] right-[40px] pointer-events-none z-0 animate-float-pulse-reverse" />
        </>
      )}
      {theme === 'aurora' && (
        <>
          <div className="fixed w-[600px] h-[600px] rounded-full filter blur-[150px] bg-[rgba(16,185,129,0.09)] -top-[200px] -left-[150px] pointer-events-none z-0 animate-float-pulse" />
          <div className="fixed w-[450px] h-[450px] rounded-full filter blur-[130px] bg-[rgba(139,92,246,0.09)] bottom-[-50px] right-[20px] pointer-events-none z-0 animate-float-pulse-reverse" />
          <div className="fixed w-[300px] h-[300px] rounded-full filter blur-[100px] bg-[rgba(6,182,212,0.06)] top-[40%] left-[30%] pointer-events-none z-0 animate-float-pulse" />
        </>
      )}
      {theme === 'light' && (
        <>
          <div className="fixed w-[450px] h-[450px] rounded-full filter blur-[110px] bg-[rgba(91,77,224,0.04)] -top-[160px] -left-[160px] pointer-events-none z-0" />
          <div className="fixed w-[320px] h-[320px] rounded-full filter blur-[90px] bg-[rgba(214,57,113,0.03)] bottom-0 right-[60px] pointer-events-none z-0" />
        </>
      )}

      {/* UPGRADE 7: Momentary Shimmer Overlay on Theme Shifts */}
      {themeSparkle && (
        <div className="fixed inset-0 pointer-events-none z-[1000] mix-blend-screen bg-gradient-to-tr from-[rgba(124,106,240,0.15)] via-transparent to-[rgba(240,98,146,0.12)] animate-pulse transition-all duration-300" />
      )}

      {/* UPGRADE 3: Global Window Drag-and-Drop Overlay */}
      {windowDragActive && (
        <div className="fixed inset-0 z-[999] backdrop-blur-md bg-black/60 flex flex-col items-center justify-center text-center p-6 animate-fade-in pointer-events-none border-[12px] border-dashed border-[var(--accent)]/30 m-4 rounded-[32px]">
          <div className="w-20 h-20 rounded-full bg-[rgba(124,106,240,0.15)] border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] mb-4 animate-bounce">
            <UploadCloud size={38} className="translate-y-px" />
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-none mb-2">
            Release to Preload PDFs
          </h2>
          <p className="text-sm text-gray-300 max-w-sm mb-4 leading-relaxed font-sans">
            Drop your documents anywhere onto the screen to stage them globally for offline processing.
          </p>
          <span className="px-4 py-1.5 rounded-full text-xs font-black bg-[var(--accent)] text-white shadow-lg uppercase tracking-wider">
            🔒 Fully Sandboxed
          </span>
        </div>
      )}

      {/* UPGRADE 5: Stacking Notifications Array Center */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl border bg-[var(--surface2)] shadow-xl animate-slide-in cursor-pointer hover:-translate-x-1 hover:brightness-105 active:scale-95 transition-all w-full max-w-sm text-xs font-semibold ${
              t.type === 'err' 
                ? 'border-rose-500/40 text-rose-400 shadow-rose-500/5' 
                : 'border-[var(--accent)]/30 text-[var(--text)] shadow-[var(--accent)]/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{t.type === 'err' ? '⚠️' : '✨'}</span>
              <span>{t.msg}</span>
            </div>
            <button className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] font-sans uppercase font-black pl-2">
              Dismiss
            </button>
          </div>
        ))}
      </div>

      {/* Account authentication wizard overlay */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLogin={(u) => setUser(u)}
          onToast={triggerToast}
        />
      )}

      {/* Profile settings manager overlay */}
      {showProfile && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdateUser={(updated) => setUser(updated)}
          onLogout={async () => {
            try {
              await signOut(auth);
              triggerToast('Signed out of profile session.');
            } catch (err: any) {
               triggerToast('Error signing out.', 'err');
            }
          }}
          onToast={triggerToast}
        />
      )}

      {/* Terms and Conditions / Privacy Policy Acceptance overlay */}
      {showTcModal && (
        <TcModal
          warningMode={tcWarningMode}
          onAccept={handleTcAccept}
          onDecline={handleTcDecline}
        />
      )}

      {/* Beautiful High-Fidelity Login Required custom popup overlay */}
      {showLoginRequired && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-8 w-full max-w-[420px] shadow-2xl relative text-center">
            {/* Centered Large Branding Logo with Signature animation */}
            <div className="flex justify-center mb-6">
              <div className="bg-[#FFFFFF] p-3 rounded-2xl shadow-xl shadow-red-500/5 border border-red-500/10 hover:scale-105 transition-transform duration-300">
                <LogoIcon size={80} />
              </div>
            </div>

            <h2 className="font-display font-black text-2xl text-[var(--text)] tracking-tight mb-2">
              Sign In to Continue
            </h2>
            
            <p className="text-xs text-[var(--muted)] leading-relaxed mb-8 font-sans">
              To keep your data safe and utilize all local offline-safe tools, multi-pass precision compression calibrator, and instant document processors, please log in or sign up first. It is completely free!
            </p>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLoginRequired(false);
                  setShowAuth(true);
                }}
                className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/40 active:scale-[0.98] transition-all cursor-pointer text-sm"
              >
                Sign In / Join MYDOCIFY
              </button>
              
              <button
                type="button"
                onClick={() => setShowLoginRequired(false)}
                className="w-full bg-[var(--surface2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text)] font-semibold py-2.5 px-4 rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION SHELL */}
      <Sidebar
        view={view}
        onSetView={(v) => {
          setView(v);
          setActiveTool(null);
        }}
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        tools={TOOLS}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        installPromptAvailable={!!deferredPrompt}
        onInstallApp={handleInstallApp}
        isOffline={isOffline}
      />

      {/* CORE CONTAINER SEGMENT */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
        
        {/* UPPER NAVIGATION BAR */}
        <Header
          view={view}
          onGoHome={handleGoHome}
          activeTool={activeTool}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : t === 'light' ? 'neon' : t === 'neon' ? 'aurora' : 'dark'))}
          user={user}
          onSignOut={async () => {
            try {
              await signOut(auth);
              triggerToast('Signed out of profile session.');
            } catch (err: any) {
              triggerToast('Error signing out.', 'err');
            }
          }}
          onShowAuth={() => setShowAuth(true)}
          onShowProfile={() => setShowProfile(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* LOWER RESPONSIVE WORKSPACE WRAPPER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scroll flex flex-col justify-between">
          <div className="w-full max-w-[1060px] mx-auto mb-10 flex-1">
            
            {/* VIEW WRAPPERS WITH CONDITIONAL RENDERS */}
            {view === 'home' && (
              <div className="animate-fade-in">
                {/* Brand Showcase Hero */}
                <div className="mb-10 mt-2">
                  <h1 className="text-4xl md:text-5xl font-display font-black text-[var(--text)] tracking-tight leading-[1.1] mb-3 select-none">
                    Your local PDF suite.
                    <br />
                    <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] bg-clip-text text-transparent">
                      Zero server uploads. Total privacy.
                    </span>
                  </h1>
                  <p className="text-sm md:text-base text-[var(--muted)] max-w-lg mt-3 leading-relaxed animate-fade-in">
                    Powered by high performance WebAssembly compiling your operations directly on your device. Never compromise security.
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-5 select-none text-xs">
                    <span className="text-[11px] text-[var(--muted)] font-medium bg-[var(--surface)] border border-[var(--border)] px-3 py-2 rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500 font-bold" /> Local browser sandbox
                    </span>
                  </div>
                </div>

                {/* DIRECT FILE LOAD HUB */}
                <div className="mb-8 select-none">
                  {/* Drag and Drop Loader Overlay */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`w-full flex flex-col justify-center items-center text-center p-8 rounded-3xl border-2 border-dashed transition-all duration-300 relative overflow-hidden group hover:shadow-lg hover:shadow-[rgba(124,106,240,0.015)] ${
                      dragActive
                        ? 'border-[var(--accent)] bg-[rgba(124,106,240,0.08)] scale-[1.015] shadow-md'
                        : sharedFiles.length > 0
                          ? 'border-emerald-500/50 bg-[rgba(16,185,129,0.045)]'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[rgba(124,106,240,0.015)]'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleFileSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />

                    {sharedFiles.length === 0 ? (
                      <div className="flex flex-col items-center max-w-sm relative pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-[rgba(124,106,240,0.1)] flex items-center justify-center text-[var(--accent)] mb-3">
                          <UploadCloud size={22} className="animate-pulse" />
                        </div>
                        <p className="font-display font-black text-sm text-[var(--text)] mb-1.5">
                          Pre-load Files Globally
                        </p>
                        <p className="text-xs text-[var(--muted)] leading-relaxed mb-4 max-w-xs">
                          Drag & Drop files here, then click any tool below to process them instantly offline.
                        </p>
                        <span className="inline-block px-3 py-1 rounded-md text-[10px] bg-[rgba(124,106,240,0.08)] text-[var(--accent)] border border-[rgba(124,106,240,0.15)] font-bold">
                          ⚡ Drag PDFs here
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                          <FileText size={22} />
                        </div>
                        <p className="font-display font-bold text-xs text-emerald-500 mb-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Preloaded & Ready
                        </p>
                        <p className="text-xs text-[var(--text)] font-semibold truncate max-w-full px-4 mt-1.5" title={sharedFiles.map(f => f.name).join(', ')}>
                          {sharedFiles.length === 1
                            ? sharedFiles[0].name
                            : `${sharedFiles.length} files selected`
                          }
                        </p>
                        <p className="text-[10px] text-[var(--muted)] mt-1">
                          Size: {(() => {
                            const totalBytes = sharedFiles.reduce((acc, f) => acc + f.size, 0);
                            if (totalBytes >= 1048576) return (totalBytes / 1048576).toFixed(2) + ' MB';
                            return (totalBytes / 1024).toFixed(1) + ' KB';
                          })()}
                        </p>

                        <div className="flex gap-2 mt-4 relative z-20">
                          <button
                            onClick={handleClearPreloaded}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 active:scale-[0.98] transition-all"
                          >
                            Dismiss File
                          </button>
                          <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500 text-white shadow-sm flex items-center">
                            Launch an editor!
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dynamic local search bar for speedy access */}
                <div className="mb-6 relative z-10">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--muted)]">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      value={toolSearch}
                      onChange={(e) => setToolSearch(e.target.value)}
                      placeholder="Search from 10+ offline local tools (e.g. compress, sign, rotate, merge)..."
                      className="w-full pl-10 pr-24 py-3 bg-[var(--surface)] text-sm rounded-2xl border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] outline-none transition-all duration-250 shadow-sm placeholder:text-[var(--muted)]/70 hover:border-[var(--muted)]/50 font-sans"
                    />
                    {toolSearch && (
                      <button
                        type="button"
                        onClick={() => setToolSearch('')}
                        className="absolute inset-y-0 right-16 pr-3 flex items-center text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[var(--surface2)] text-[10px] font-mono border border-[var(--border)] text-[var(--muted)] flex items-center gap-1 select-none">
                      {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
                    </span>
                  </div>

                  {/* Suggestion tabs if no tools found */}
                  {toolSearch && filteredTools.length === 0 && (
                    <div className="mt-4 p-5 bg-[var(--surface2)]/45 border border-[var(--border)] rounded-2xl text-center select-none animate-fade-in">
                      <p className="text-sm font-semibold text-[var(--muted)]">No premium tools match "{toolSearch}"</p>
                      <p className="text-xs text-[var(--muted)]/70 mt-1">Please try one of these instead:</p>
                      <div className="flex flex-wrap gap-2 justify-center mt-3">
                        {['Compress', 'Merge', 'Sign', 'Reorder', 'Watermark', 'Rotate'].map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => setToolSearch(term)}
                            className="px-3 py-1 bg-[var(--surface)] text-[11px] border border-[var(--border)] rounded-xl text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer transition-all active:scale-[0.98]"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard Tools Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTools.map((t) => (
                    <div
                      key={t.id}
                      className={`tool-card hover:translate-y-[-4px] active:scale-[0.99] flex flex-col justify-between transition-all duration-150 ${
                        sharedFiles.length > 0
                          ? 'border-emerald-500/25 dark:border-emerald-500/15 shadow-sm shadow-emerald-500/5'
                          : ''
                      }`}
                      onClick={() => handleSelectTool(t)}
                    >
                      <div>
                        <div
                          style={{
                            background: `${t.color}15`,
                            borderColor: `${t.color}35`,
                          }}
                          className="w-11 h-11 rounded-xl flex items-center justify-center border mb-4"
                        >
                          {getToolIcon(t.id, t.color)}
                        </div>
                        <h3 className="font-display font-bold text-base text-[var(--text)] mb-1.5 shrink-0 flex items-center gap-2">
                          {t.name}
                          {sharedFiles.length > 0 && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Document loaded" />
                          )}
                        </h3>
                        <p className="text-xs text-[var(--muted)] leading-relaxed font-sans mt-1">
                          {t.desc}
                        </p>
                      </div>
                      <div className="mt-5 flex items-center gap-1.5 text-xs font-bold leading-none select-none transition-transform" style={{ color: t.color }}>
                        <span>{sharedFiles.length > 0 ? 'Load file and process' : 'Open module'}</span> <ArrowRight size={12} className="opacity-80 transition-transform hover:translate-x-1" />
                      </div>
                    </div>
                  ))}
                </div>



                {/* Security Reassurance Banner */}
                <div className="mt-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
                  {[
                    ['🔒', '100% Offline-Safe', 'Processing takes place in sandboxed local javascript threads.'],
                    ['⚡', 'Instantly Compiled', 'No heavy upload transfers or network latency lags.'],
                    ['🆓', 'Zero Paywalls', 'Absolutely free without visual advertisement clutters.'],
                    ['📱', 'Fluid Responsive', 'Optimized to scale correctly across any device layout.'],
                  ].map(([emoji, caption, detail]) => (
                    <div key={caption} className="flex flex-col gap-1.5 select-none animate-fade-in">
                      <span className="text-2xl mb-1">{emoji}</span>
                      <h4 className="font-display font-bold text-sm text-[var(--text)]">{caption}</h4>
                      <p className="text-[11px] text-[var(--muted)] leading-relaxed font-sans">{detail}</p>
                    </div>
                  ))}
                </div>

                {/* FAQ Accordion Section */}
                <FaqSection />
              </div>
            )}

            {/* INTEGRATED GRAPHICAL TOOLSETS */}
            {view === 'tool' && activeTool && (
              <div className="animate-fade-in flex-1">
                {(() => {
                  switch (activeTool.id) {
                    case 'compress':
                      return <CompressTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    case 'merge':
                      return <MergeTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    case 'split':
                      return <SplitTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    case 'reorder':
                      return <ReorderTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    case 'remove':
                      return <RemoveTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    case 'rotate':
                      return <RotateTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    case 'watermark':
                      return <WatermarkTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    case 'pdf2img':
                      return <Pdf2ImgTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    case 'img2pdf':
                      return <Img2PdfTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    case 'signer':
                      return <SignerTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    case 'nup':
                      return <NupTool onAddHistory={addHistoryItem} onToast={triggerToast} initialFiles={sharedFiles} />;
                    default:
                      return null;
                  }
                })()}
              </div>
            )}

            {/* CORRESPONDING GENERIC PAGES */}
            {view === 'contact' && <ContactPage onToast={triggerToast} />}
            {view === 'privacy' && <PrivacyPage />}
            {view === 'terms' && <TermsPage />}
            {view === 'history' && (
              <HistoryPage
                history={history}
                onClearHistory={() => {
                  setHistory([]);
                  triggerToast('Session download history cleared.');
                }}
              />
            )}

          </div>

          {/* PAGE UTILITY ACCREDITATIONS FOOTER (humble, literal human label) */}
          <footer className="pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4 w-full max-w-[1060px] mx-auto shrink-0 select-none">
            <div className="flex flex-col items-center sm:items-start gap-1 justify-center sm:justify-start">
              <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                <Logo size={22} textSizeClass="text-[14px]" />
                <span className="text-[11px] text-[var(--muted)] font-medium">
                  © 2026 All rights reserved
                </span>
              </div>
              <p className="text-[11px] sm:pl-[34px] font-extrabold tracking-wide text-transparent bg-clip-text bg-[linear-gradient(90deg,var(--accent),var(--accent2),var(--accent3),var(--accent))] bg-[size:300%_auto] animate-[rgb-flow_6s_linear_infinite] uppercase select-text opacity-90 hover:opacity-100 transition-opacity">
                Created by ABDUR RAHIM
              </p>
            </div>
            
            <div className="flex flex-wrap gap-x-5 gap-y-2 justify-center text-xs font-semibold text-[var(--muted)]">
              <button
                type="button"
                onClick={() => {
                  setView('contact');
                  setActiveTool(null);
                }}
                className="hover:text-[var(--text)] border-none bg-transparent cursor-pointer transition-colors"
              >
                Contact Us
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('privacy');
                  setActiveTool(null);
                }}
                className="hover:text-[var(--text)] border-none bg-transparent cursor-pointer transition-colors"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('terms');
                  setActiveTool(null);
                }}
                className="hover:text-[var(--text)] border-none bg-transparent cursor-pointer transition-colors"
              >
                Terms & Conditions
              </button>
            </div>
          </footer>

        </main>
      </div>
    </div>
  );
}
