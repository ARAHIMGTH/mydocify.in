/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileText, Calendar, ExternalLink } from 'lucide-react';

export default function TermsPage() {
  const termsList = [
    [
      '1. Use of the Service',
      'MYDOCIFY allows users to upload, process, and manage documents and related content. You agree not to: Use the service for illegal purposes; Upload malicious, harmful, copyrighted, or abusive material; Attempt to damage, hack, overload, or misuse the platform.',
    ],
    [
      '2. User Responsibility',
      'Users are fully responsible for: Their account, Uploaded files and content, Any activity performed using their account. You must keep your login credentials secure.',
    ],
    [
      '3. Limited Data Storage',
      'MYDOCIFY only stores: User email address, Encrypted password/authentication data, Profile section information provided by the user. Processed or generated file data is stored temporarily for operational purposes and is automatically deleted after approximately 1 hour. We do not permanently store user files unless explicitly stated otherwise.',
    ],
    [
      '4. No Responsibility for User Files',
      'MYDOCIFY acts only as a platform/tool. We are not responsible or liable for: User-uploaded files, File content, Copyright violations, Illegal or harmful material, File loss, corruption, or unauthorized access, Any damages caused by user activity or uploaded content. Users use the service entirely at their own risk.',
    ],
    [
      '5. Third-Party Services',
      'MYDOCIFY uses Firebase by Google for backend infrastructure, authentication, and database services. Service reliability, uptime, storage, and security may depend partly on third-party providers. Official website: Firebase.',
    ],
    [
      '6. No Guarantees',
      'The service is provided “AS IS” and “AS AVAILABLE”. We do not guarantee: Continuous availability, Permanent file storage, Error-free functionality, Absolute security or protection from data loss.',
    ],
    [
      '7. Limitation of Liability',
      'To the fullest extent permitted by law, MYDOCIFY and its developers shall not be liable for: Any direct or indirect damages, Data loss, Temporary or permanent file deletion, Unauthorized access, Third-party service failures, User-generated content or activities.',
    ],
    [
      '8. Termination',
      'We may suspend or terminate accounts that violate these Terms or misuse the platform.',
    ],
    [
      '9. Changes to Terms',
      'These Terms may be updated at any time. Continued use of the service means acceptance of updated Terms.',
    ],
    [
      '10. Contact',
      'For support or legal concerns: ardeveloper001@gmail.com',
    ],
  ];

  return (
    <div id="terms-page-container" className="max-w-[700px] mx-auto animate-fade-in pb-10">
      <div id="terms-page-header" className="flex items-center gap-3.5 mb-3">
        <div id="terms-page-icon" className="w-10 h-10 rounded-xl bg-[rgba(124,106,240,0.12)] border border-[rgba(124,106,240,0.25)] flex items-center justify-center text-[var(--accent)]">
          <FileText size={20} />
        </div>
        <div>
          <h1 id="terms-page-title" className="text-3xl font-display font-black text-[var(--text)] leading-none">Terms & Conditions</h1>
          <p id="terms-page-date" className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-1 font-semibold">
            <Calendar size={11} /> Effective Date: 20 May 2026
          </p>
        </div>
      </div>

      <div className="h-px bg-[var(--border)] my-6" />

      <p className="text-xs text-[var(--muted)] mb-6 font-semibold leading-relaxed">
        Welcome to MYDOCIFY (“App”, “Service”, “we”, “our”, or “us”). By accessing or using MYDOCIFY, you agree to these Terms and Conditions.
      </p>

      <div id="terms-list-wrapper" className="flex flex-col gap-6">
        {termsList.map(([title, content]) => (
          <div key={title} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--muted)] transition-colors">
            <h3 className="font-display font-bold text-sm text-[var(--text)] mb-2">{title}</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed font-semibold">
              {title.includes('5. Third-Party') ? (
                <>
                  MYDOCIFY uses Firebase by Google for backend infrastructure, authentication, and database services. Service reliability, uptime, storage, and security may depend partly on third-party providers. Official website:{' '}
                  <a href="https://firebase.google.com/" target="_blank" rel="noreferrer" className="text-[var(--accent)] font-bold hover:underline inline-flex items-center gap-0.5">
                    Firebase <ExternalLink size={10} />
                  </a>.
                </>
              ) : title.includes('10. Contact') ? (
                <>
                  For support or legal concerns:{' '}
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
