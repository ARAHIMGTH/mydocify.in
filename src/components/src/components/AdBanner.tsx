import React, { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface AdBannerProps {
  className?: string;
  slot?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ className = '', slot = '5217954033' }) => {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('AdSense unit push failed or already loaded:', err);
    }
  }, []);

  return (
    <div className={`w-full overflow-hidden flex justify-center items-center min-h-[90px] my-6 select-none ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-4171962220033443"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;
