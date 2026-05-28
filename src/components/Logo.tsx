import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'horizontal' | 'vertical';
}

export default function Logo({ className = '', size = 'md', variant = 'horizontal' }: LogoProps) {
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(() => {
    return localStorage.getItem('torky_custom_logo');
  });

  const [storeName, setStoreName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cs_pos_store_config');
      if (saved) {
        return JSON.parse(saved).name || 'Torky Komputer';
      }
    } catch (e) {}
    return 'Torky Komputer';
  });

  const [slogan, setSlogan] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cs_pos_store_config');
      if (saved) {
        return JSON.parse(saved).powerTitle || 'Anda Yang Utama';
      }
    } catch (e) {}
    return 'Anda Yang Utama';
  });

  useEffect(() => {
    const handleLogoChange = () => {
      setCustomLogoUrl(localStorage.getItem('torky_custom_logo'));
    };

    const handleStoreChange = () => {
      try {
        const saved = localStorage.getItem('cs_pos_store_config');
        if (saved) {
          const config = JSON.parse(saved);
          setStoreName(config.name || 'Torky Komputer');
          setSlogan(config.powerTitle || 'Anda Yang Utama');
        }
      } catch (e) {}
    };

    window.addEventListener('torky_logo_changed', handleLogoChange);
    window.addEventListener('torky_store_changed', handleStoreChange);
    return () => {
      window.removeEventListener('torky_logo_changed', handleLogoChange);
      window.removeEventListener('torky_store_changed', handleStoreChange);
    };
  }, []);

  // Split store name elegantly
  const words = storeName.trim().split(/\s+/);
  const topText = words.length > 1 ? words[0] : '';
  const bottomText = words.length > 1 ? words.slice(1).join(' ') : storeName;

  // Size mappings
  const sizeMap = {
    sm: { box: 'w-10 h-11', text: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-14 h-16', text: 'text-lg', sub: 'text-[10px]' },
    lg: { box: 'w-24 h-28', text: 'text-2xl', sub: 'text-xs' },
    xl: { box: 'w-48 h-56', text: 'text-4xl', sub: 'text-sm' },
  };

  const dims = sizeMap[size];

  // SVG Feather/Leaf design matching the user-uploaded logo with precise curves
  const logoSvg = customLogoUrl ? (
    <img
      src={customLogoUrl}
      alt="Store Logo"
      className="max-w-full max-h-full object-contain block mx-auto rounded-lg"
      referrerPolicy="no-referrer"
    />
  ) : (
    <svg
      viewBox="0 0 240 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full select-none"
    >
      <defs>
        {/* Blade 1 (Top Wave): Deep rich royal blue gradient */}
        <linearGradient id="torky-grad-navy" x1="30%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B2B9F" />
          <stop offset="50%" stopColor="#1E5DCE" />
          <stop offset="100%" stopColor="#3187F2" />
        </linearGradient>

        {/* Blade 2 (Middle Wave): Vibrant blue-sky gradient */}
        <linearGradient id="torky-grad-blue" x1="20%" y1="10%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1954C0" />
          <stop offset="60%" stopColor="#2E9AE4" />
          <stop offset="100%" stopColor="#55C9F1" />
        </linearGradient>

        {/* Blade 3 (Bottom Wave): Soft cyan to sky gradient */}
        <linearGradient id="torky-grad-teal" x1="10%" y1="20%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#289EE2" />
          <stop offset="60%" stopColor="#43CECE" />
          <stop offset="100%" stopColor="#81EADF" />
        </linearGradient>

        {/* Gray outline gradient */}
        <linearGradient id="torky-grad-outline-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B5B5B5" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#A0A0A0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#6E6E6E" stopOpacity="0.2" />
        </linearGradient>

        <linearGradient id="torky-grad-outline-right" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CCCCCC" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#9E9E9E" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#7A7A7A" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Outer elegant grey leaf frame outline (Left Arc) */}
      <path
        d="M 112,245 C 92,205 98,110 113,18"
        stroke="url(#torky-grad-outline-left)"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="transparent"
      />

      {/* Outer elegant grey leaf frame outline (Right Arc) */}
      <path
        d="M 113,18 C 128,18 245,115 220,248"
        stroke="url(#torky-grad-outline-right)"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="transparent"
      />

      {/* Blade 1 (Upper main feather swoosh) - sweeping up and left, pointing up to the sky */}
      <path
        d="M 113,18 C 111,55 116,110 160,158 C 182,182 208,185 210,155 C 212,125 192,85 174,68 C 152,47 125,25 113,18 Z"
         fill="url(#torky-grad-navy)"
      />

      {/* Blade 2 (Middle feather swoosh) - parallel nested below the first swoosh */}
      <path
        d="M 113,68 C 111,100 119,145 156,188 C 176,211 202,213 204,185 C 206,158 188,122 172,106 C 152,86 125,73 113,68 Z"
        fill="url(#torky-grad-blue)"
      />

      {/* Blade 3 (Lower/Bottom feather swoosh) - nested at the bottom */}
      <path
        d="M 118,120 C 117,144 122,180 152,212 C 168,229 192,231 194,208 C 196,186 182,156 168,143 C 151,127 128,124 118,120 Z"
        fill="url(#torky-grad-teal)"
      />

      {/* Bottom right teal/cyan circular accent loop */}
      <path
        d="M 172,210 C 178,225 198,228 208,220 C 218,212 216,198 206,192"
        stroke="#4ECECD"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="transparent"
      />
    </svg>
  );

  // Render Horizontal style (ideal for navigation/headers)
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className={`${dims.box} shrink-0 flex items-center justify-center`}>
          {logoSvg}
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex flex-col leading-none">
            {topText && (
              <span className="font-serif font-bold text-slate-500 uppercase tracking-wider text-xs sm:text-sm">
                {topText}
              </span>
            )}
            <span className="font-serif font-black text-slate-700 text-sm sm:text-base -mt-0.5">
              {bottomText}
            </span>
          </div>
          <span className="font-sans font-medium tracking-widest text-[#8A8A8A] text-[8px] sm:text-[9px] uppercase mt-1 block truncate max-w-[120px]">
            {slogan}
          </span>
        </div>
      </div>
    );
  }

  // Render Vertical/Centered style (ideal for splash, login panel, dashboard landing, and receipt banners)
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className={`${dims.box} mb-1 h-32 w-28 flex items-center justify-center`}>
          {logoSvg}
        </div>
        <div className="flex flex-col items-center">
          {topText && (
            <h2 className="font-serif text-lg font-bold tracking-widest text-slate-500 uppercase leading-none">
              {topText}
            </h2>
          )}
          <h3 className="font-serif text-2xl font-extrabold tracking-tight text-slate-700 mt-1 leading-none">
            {bottomText}
          </h3>
          <p className="font-sans text-[10px] font-bold tracking-[0.2em] text-[#8A8A8A] uppercase mt-2">
            {slogan}
          </p>
        </div>
      </div>
    );
  }

  // Icon only
  return <div className={`${dims.box} ${className} flex items-center justify-center`}>{logoSvg}</div>;
}

