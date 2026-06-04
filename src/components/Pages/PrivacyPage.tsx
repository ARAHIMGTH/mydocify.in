/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldCheck, Calendar, ExternalLink } from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    [
      '1. Information We Collect',
      'We only collect limited user information, including: Email address, Authentication/password-related data, Profile information voluntarily added by users. We do not permanently store user files.',
    ],
    [
      '2. Temporary File Processing',
      'Files uploaded or generated through MYDOCIFY may be temporarily processed and stored for functionality purposes. Such processed/generated file data is automatically deleted after approximately 1 hour.',
    ],
    [
      '3. How We Use Data',
      'Collected information is used to: Create and manage user accounts, Authenticate login access, Provide app functionality, Improve security and prevent abuse.',
    ],
    [
      '4. User Responsibility',
      'Users are solely responsible for: The files they upload, The content they process, Compliance with copyright and applicable laws. MYDOCIFY does not monitor or take responsibility for user-uploaded content.',
    ],
    [
      '5. Firebase and Third-Party Services',
      'MYDOCIFY uses Firebase and related services provided by Google. These services may process technical data according to their own policies. Privacy details: Firebase Privacy Information.',
    ],
    [
      '6. Data Security',
      'We use reasonable security measures to protect stored information. However, no online service can guarantee complete security. Users use the service at their own risk.',
    ],
    [
      '7. Children\'s Privacy',
      'MYDOCIFY is not intended for children under 13 years of age.',
    ],
    [
      '8. Policy Updates',
      'We may update this Privacy Policy from time to time. Continued use of the app after updates means you accept the revised policy.',
    ],
    [
      '9. Contact',
      'For privacy-related concerns: ardeveloper001@gmail.com',
    ],
  ];

  return (
    <div id="privacy-page-container" className="max-w-[700px] mx-auto animate-fade-in pb-10">
      <div id="privacy-page-header" className="flex items-center gap-3.5 mb-3">
        <div id="privacy-page-icon" className="w-10 h-10 rounded-xl bg-[rgba(67,233,123,0.12)] border border-[rgba(67,233,123,0.25)] flex items-center justify-center text-[var(--accent3)]">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 id="privacy-page-title" className="text-3xl font-display font-black text-[var(--text)] leading-none">Privacy Policy</h1>
          <p id="privacy-page-date" className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-1 font-semibold">
            <Calendar size={11} /> Effective Date: 20 May 2026
          </p>
        </div>
      </div>

      <div className="h-px bg-[var(--border)] my-6" />

      <p className="text-xs text-[var(--muted)] mb-6 font-semibold leading-relaxed">
        MYDOCIFY values your privacy. This Privacy Policy explains what information we collect and how it is used.
      </p>

      <div id="privacy-list-wrapper" className="flex flex-col gap-6">
        {sections.map(([title, content]) => (
          <div key={title} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--muted)] transition-colors">
            <h3 className="font-display font-bold text-sm text-[var(--text)] mb-2">{title}</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold text-wrap">
              {title.includes('5. Firebase') ? (
                <>
                  MYDOCIFY uses Firebase and related services provided by Google. These services may process technical data according to their own policies. Privacy details:{' '}
                  <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer" className="text-[var(--accent)] font-bold hover:underline inline-flex items-center gap-0.5">
                    Firebase Privacy Information <ExternalLink size={10} />
                  </a>.
                </>
              ) : title.includes('9. Contact') ? (
                <>
                  For privacy-related concerns:{' '}
                  <a href="mailto:ardeveloper001@gmail.com" className="text-[var(--accent)] font-bold hover:underline">
                    ardeveloper001@gmail.com
                  </a>
                </>
              ) : (
                content
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
