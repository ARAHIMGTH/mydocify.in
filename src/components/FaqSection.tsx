/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, ShieldAlert, Sparkles, Heart } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "Is MYDOCIFY really 100% private and offline-first?",
    answer: "Absolutely. All PDF compilations, splits, and compressions take place entirely inside your web browser using secure local JavaScript sandbox threads and WASM compile routines. We do not host, transfer, or upload your documents to any remote cloud servers. Your personal information and sensitive files never leave your system."
  },
  {
    question: "How does the Image compiling to PDF tool operate offline?",
    answer: "MyDocify processes JPEG, PNG, and WebP images locally directly from file buffers loaded from your device's memory. It wraps them into high-fidelity PDF pages in memory and downloads them as a local blob stream, meaning zero uploads and lightning-fast compilations."
  },
  {
    question: "Does MYDOCIFY support large PDF files?",
    answer: "Yes, because processing occurs locally inside your web browser, you are not subject to standard cloud upload limits, internet speed bottlenecks, or remote server timeout errors. Your files can be as large as your system's browser RAM capacity can accommodate. Generally, modern browsers can seamlessly manage files over 500MB+."
  },
  {
    question: "Can I use MYDOCIFY when I have no internet connection?",
    answer: "Yes! MYDOCIFY is engineered as a fully compliant, high-efficacy Progressive Web App (PWA). Once you visit the site, our Service Workers pre-cache all assets and local secure compilations. You can install it on your desktop, macOS, iOS, or Android device and run all features beautifully in absolute offline mode."
  },
  {
    question: "Are there any usage limits, hidden fees, or subscriptions?",
    answer: "No, there are absolutely no paywalls, registration blockades, visual layout advertisements, or page limits on our tools. We believe everyone deserves high-performance, private document management utilities."
  },
  {
    question: "Which browsers are fully supported?",
    answer: "Any modern, HTML5-compliant web browser. We recommend using Google Chrome, Apple Safari, Mozilla Firefox, or Microsoft Edge for the best performance and maximum memory efficiency with big offline operations."
  }
];

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Auto-inject Schema.org FAQPage structured data on build
  useEffect(() => {
    const existingScript = document.getElementById('mydocify-faq-schema');
    if (existingScript) {
      existingScript.remove();
    }

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": FAQS.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const script = document.createElement('script');
    script.id = 'mydocify-faq-schema';
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('mydocify-faq-schema');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, []);

  const toggleFaq = (idx: number) => {
    setActiveIndex(activeIndex === idx ? null : idx);
  };

  return (
    <div className="mt-14 border-t border-[var(--border)] pt-12 select-none font-sans">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10.5px] font-black tracking-wider uppercase bg-[rgba(124,106,240,0.08)] text-[var(--accent)] border border-[rgba(124,106,240,0.15)] mb-3">
          <Sparkles size={11} className="animate-spin" /> Frequently Asked Questions
        </span>
        <h2 className="font-display font-black text-2xl md:text-3xl text-[var(--text)] tracking-tight">
          Have Questions? We Have Answers.
        </h2>
        <p className="text-xs text-[var(--muted)] mt-2 leading-relaxed">
          Discover why thousands of users trust MYDOCIFY for 100% private, lightning-fast in-browser document compilation and editing.
        </p>
      </div>

      <div className="max-w-[800px] mx-auto flex flex-col gap-3">
        {FAQS.map((faq, idx) => {
          const isOpen = activeIndex === idx;

          return (
            <div
              key={idx}
              className={`border rounded-2xl transition-all duration-200 overflow-hidden bg-[var(--surface)] ${
                isOpen ? 'border-[var(--accent)] shadow-md shadow-[rgba(124,106,240,0.03)]' : 'border-[var(--border)] hover:border-[rgba(124,106,240,0.30)]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between text-left p-5 font-sans font-bold text-sm text-[var(--text)] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-3 pr-4 leading-snug">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border text-xs ${
                    isOpen ? 'bg-[rgba(124,106,240,0.08)] border-[rgba(124,106,240,0.15)] text-[var(--accent)]' : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--muted)]'
                  }`}>
                    Q
                  </span>
                  <span>{faq.question}</span>
                </span>
                <ChevronDown
                  size={16}
                  className={`text-[var(--muted)] transition-transform duration-300 shrink-0 ${
                    isOpen ? 'rotate-180 text-[var(--accent)]' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-5 pt-0 border-t border-[var(--border)]/40 mt-1">
                      <p className="text-xs text-[var(--muted)] leading-relaxed pt-4 font-sans select-text">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Trust & Accreditations Badge section */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left bg-[var(--surface2)]/30 border border-[var(--border)] rounded-2xl p-5 max-w-[800px] mx-auto">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
          <HelpCircle size={20} />
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-black tracking-widest text-[var(--accent)] uppercase font-sans">Security Guarantee</span>
          <p className="text-xs font-semibold text-[var(--text)] leading-snug">
            Still concerned about confidentiality?
          </p>
          <p className="text-[10.5px] text-[var(--muted)] mt-0.5 leading-normal">
            You can turn off your internet, upload any documents, process them locally, and complete all compilations perfectly. MyDocify operates 100% offline.
          </p>
        </div>
      </div>
    </div>
  );
}
