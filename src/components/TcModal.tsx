/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileText, Shield, Calendar, AlertTriangle, ExternalLink } from 'lucide-react';

interface TcModalProps {
  warningMode?: boolean; // If true, display the red warning banner "YOU HAVE TO ACCEPT THE T&C before using the tool"
  onAccept: () => void;
  onDecline: () => void;
}

export default function TcModal({ warningMode = false, onAccept, onDecline }: TcModalProps) {
  return (
    <div
      id="tc-modal-overlay"
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div
        id="tc-modal-container"
        className="bg-[var(--surface)] border-t sm:border border-[var(--border)] rounded-t-[28px] sm:rounded-[24px] p-6 pb-10 sm:p-8 w-full max-w-[680px] shadow-[var(--shadow)] animate-slide-up sm:animate-fade-in my-0 sm:my-8 flex flex-col max-h-[92vh]"
      >
        {/* Mobile Swipe-Up indicator drag handle */}
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mb-4 sm:hidden opacity-60 shrink-0" />
        {/* Warning Banner block */}
        {warningMode && (
          <div
            id="tc-warning-banner"
            className="mb-5 bg-[rgba(240,98,146,0.08)] border border-[rgba(240,98,146,0.3)] rounded-xl p-4 flex items-start gap-3 text-[var(--accent2)] animate-pulse"
          >
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <div id="tc-warning-banner-text">
              <h4 className="font-display font-bold text-sm tracking-tight">YOU HAVE TO ACCEPT THE T&C before using the tool</h4>
              <p className="text-[11px] leading-relaxed mt-1 opacity-90 font-medium">
                Please review the Terms & Conditions and Privacy Policy below and click "Accept" to continue using MYDOCIFY tools.
              </p>
            </div>
          </div>
        )}

        {/* Modal Top Header */}
        <div id="tc-modal-header" className="flex items-start gap-4 mb-5">
          <div
            id="tc-modal-header-icon"
            className="w-12 h-12 rounded-xl bg-[rgba(124,106,240,0.12)] border border-[rgba(124,106,240,0.25)] flex items-center justify-center text-[var(--accent)] shrink-0"
          >
            <Shield size={24} />
          </div>
          <div id="tc-modal-header-title-wrapper" className="flex-1">
            <h2 id="tc-modal-title" className="text-2xl font-display font-black text-[var(--text)] tracking-tight leading-none">
              Legal Agreements
            </h2>
            <p id="tc-modal-subtitle" className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-1 font-semibold">
              <Calendar size={12} /> Effective Date: 20 May 2026
            </p>
          </div>
        </div>

        {/* Scrollable Terms & Policy Segment */}
        <div
          id="tc-scrollbar-viewport"
          className="flex-1 overflow-y-auto pr-2 mb-6 space-y-6 custom-scroll select-text border border-[var(--border)] bg-[rgba(0,0,0,0.15)] rounded-2xl p-4"
        >
          {/* SECTION I: TERMS AND CONDITIONS */}
          <div id="tc-terms-section-wrapper" className="space-y-4">
            <div className="flex items-center gap-2 text-[var(--accent)] font-display font-bold text-base border-b border-[var(--border)] pb-2_wrap">
              <FileText size={16} />
              <span>Terms and Conditions</span>
            </div>
            
            <p className="text-[11px] text-[var(--muted)] leading-relaxed font-semibold">
              Welcome to MYDOCIFY (“App”, “Service”, “we”, “our”, or “us”). By accessing or using MYDOCIFY, you agree to these Terms and Conditions.
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">1. Use of the Service</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  MYDOCIFY allows users to upload, process, and manage documents and related content. You agree not to: Use the service for illegal purposes; Upload malicious, harmful, copyrighted, or abusive material; Attempt to damage, hack, overload, or misuse the platform.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">2. User Responsibility</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  Users are fully responsible for: Their account, Uploaded files and content, Any activity performed using their account. You must keep your login credentials secure.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">3. Limited Data Storage</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  MYDOCIFY only stores: User email address, Encrypted password/authentication data, Profile section information provided by the user. Processed or generated file data is stored temporarily for operational purposes and is automatically deleted after approximately 1 hour. We do not permanently store user files unless explicitly stated otherwise.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">4. No Responsibility for User Files</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  MYDOCIFY acts only as a platform/tool. We are not responsible or liable for: User-uploaded files, File content, Copyright violations, Illegal or harmful material, File loss, corruption, or unauthorized access, Any damages caused by user activity or uploaded content. Users use the service entirely at their own risk.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">5. Third-Party Services</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  MYDOCIFY uses Firebase by Google for backend infrastructure, authentication, and database services. Service reliability, uptime, storage, and security may depend partly on third-party providers. You can learn more at{' '}
                  <a href="https://firebase.google.com/" target="_blank" rel="noreferrer" className="text-[var(--accent)] font-bold hover:underline inline-flex items-center gap-0.5">
                    Firebase <ExternalLink size={10} />
                  </a>.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">6. No Guarantees</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  The service is provided “AS IS” and “AS AVAILABLE”. We do not guarantee: Continuous availability, Permanent file storage, Error-free functionality, Absolute security or protection from data loss.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">7. Limitation of Liability</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  To the fullest extent permitted by law, MYDOCIFY and its developers shall not be liable for: Any direct or indirect damages, Data loss, Temporary or permanent file deletion, Unauthorized access, Third-party service failures, User-generated content or activities.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">8. Termination</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  We may suspend or terminate accounts that violate these Terms or misuse the platform.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">9. Changes to Terms</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  These Terms may be updated at any time. Continued use of the service means acceptance of updated Terms.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">10. Contact</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  For support or legal concerns:{' '}
                  <a href="mailto:ardeveloper001@gmail.com" className="text-[var(--accent)] font-bold hover:underline">
                    ardeveloper001@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* SECTION II: PRIVACY POLICY */}
          <div id="tc-privacy-section-wrapper" className="space-y-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--accent2)] font-display font-bold text-base border-b border-[var(--border)] pb-2 flex-wrap">
              <Shield size={16} />
              <span>Privacy Policy</span>
            </div>

            <p className="text-[11px] text-[var(--muted)] leading-relaxed font-semibold">
              MYDOCIFY values your privacy. This Privacy Policy explains what information we collect and how it is used.
            </p>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">1. Information We Collect</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 text-wrap font-medium">
                  We only collect limited user information, including: Email address, Authentication/password-related data, Profile information voluntarily added by users. We do not permanently store user files.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">2. Temporary File Processing</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  Files uploaded or generated through MYDOCIFY may be temporarily processed and stored for functionality purposes. Such processed/generated file data is automatically deleted after approximately 1 hour.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">3. How We Use Data</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  Collected information is used to: Create and manage user accounts, Authenticate login access, Provide app functionality, Improve security and prevent abuse.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">4. User Responsibility</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  Users are solely responsible for: The files they upload, The content they process, Compliance with copyright and applicable laws. MYDOCIFY does not monitor or take responsibility for user-uploaded content.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">5. Firebase and Third-Party Services</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium font-medium">
                  MYDOCIFY uses Firebase and related services provided by Google. These services may process technical data according to their own policies. Privacy details:{' '}
                  <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer" className="text-[var(--accent)] font-bold hover:underline inline-flex items-center gap-0.5">
                    Firebase Privacy Information <ExternalLink size={10} />
                  </a>.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">6. Data Security</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  We use reasonable security measures to protect stored information. However, no online service can guarantee complete security. Users use the service at their own risk.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">7. Children's Privacy</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  MYDOCIFY is not intended for children under 13 years of age.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">8. Policy Updates</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  We may update this Privacy Policy from time to time. Continued use of the app after updates means you accept the revised policy.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">9. Contact</h4>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed pl-1.5 font-medium">
                  For privacy-related concerns:{' '}
                  <a href="mailto:ardeveloper001@gmail.com" className="text-[var(--accent)] font-bold hover:underline">
                    ardeveloper001@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Button Bar */}
        <div id="tc-actions-bar" className="flex flex-col sm:flex-row gap-3">
          <button
            id="tc-btn-decline"
            type="button"
            className="flex-1 py-3 px-4 rounded-xl border border-[var(--border)] text-xs font-bold hover:bg-[rgba(240,98,146,0.1)] hover:text-[var(--accent2)] hover:border-[rgba(240,98,146,0.4)] transition-all flex items-center justify-center cursor-pointer text-[var(--muted)]"
            onClick={onDecline}
          >
            Decline & Exit
          </button>
          
          <button
            id="tc-btn-accept"
            type="button"
            className="flex-1 glow-btn py-3 px-4 text-xs font-bold flex items-center justify-center cursor-pointer"
            onClick={onAccept}
          >
            Accept Agreements & Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
