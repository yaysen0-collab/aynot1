import React from 'react';

interface AynotLogoProps {
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  className?: string;
}

export const AynotLogo: React.FC<AynotLogoProps> = ({
  size = 'md',
  showText = false,
  textClassName = '',
  className = '',
}) => {
  let dimension = 36;
  let textClass = 'text-lg';

  if (typeof size === 'number') {
    dimension = size;
  } else {
    switch (size) {
      case 'sm':
        dimension = 28;
        textClass = 'text-base';
        break;
      case 'md':
        dimension = 36;
        textClass = 'text-lg';
        break;
      case 'lg':
        dimension = 48;
        textClass = 'text-2xl';
        break;
      case 'xl':
        dimension = 64;
        textClass = 'text-3xl';
        break;
    }
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Icon with Indigo-to-Teal Gradient, Folded Note Paper & Checkmark */}
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 drop-shadow-sm"
      >
        <defs>
          <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>

          <linearGradient id="logoFoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          <linearGradient id="logoBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>

        {/* Squircle base */}
        <rect width="512" height="512" rx="120" fill="url(#logoBgGrad)" />

        {/* Soft highlight bubbles */}
        <circle cx="120" cy="90" r="130" fill="#ffffff" opacity="0.14" />
        <circle cx="410" cy="420" r="140" fill="#14b8a6" opacity="0.2" />

        {/* Note Paper with Folded Top-Right Corner */}
        <path
          d="M 148 108
             C 126 108 112 122 112 144
             L 112 376
             C 112 398 126 412 148 412
             L 364 412
             C 386 412 400 398 400 376
             L 400 196
             L 312 108
             Z"
          fill="#ffffff"
        />

        {/* Folded Ear Triangle */}
        <path
          d="M 312 108
             L 312 180
             C 312 192 320 196 332 196
             L 400 196
             Z"
          fill="url(#logoFoldGrad)"
        />

        {/* Internal note lines */}
        <rect x="156" y="172" width="124" height="20" rx="10" fill="#4f46e5" opacity="0.9" />
        <rect x="156" y="214" width="188" height="14" rx="7" fill="#0d9488" opacity="0.75" />
        <rect x="156" y="246" width="144" height="12" rx="6" fill="#94a3b8" opacity="0.6" />
        <rect x="156" y="274" width="96" height="12" rx="6" fill="#cbd5e1" opacity="0.65" />

        {/* Sparkle star at top left of note */}
        <path
          d="M 166 128
             Q 166 138 176 138
             Q 166 138 166 148
             Q 166 138 156 138
             Q 166 138 166 128 Z"
          fill="#f59e0b"
        />

        {/* Action Badge: Teal Circle with Crisp White Checkmark */}
        <circle cx="330" cy="344" r="44" fill="url(#logoBadgeGrad)" />
        <path
          d="M 314 344 L 326 356 L 348 332"
          fill="none"
          stroke="#ffffff"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Subtle sparkle near badge */}
        <path
          d="M 270 348
             Q 270 355 277 355
             Q 270 355 270 362
             Q 270 355 263 355
             Q 270 355 270 348 Z"
          fill="#06b6d4"
        />
      </svg>

      {/* Rounded Lowercase Logotype: "aynot." */}
      {showText && (
        <span
          className={`font-black tracking-tight leading-none text-slate-800 dark:text-slate-100 ${textClass} ${textClassName}`}
          style={{ letterSpacing: '-0.035em' }}
        >
          aynot<span className="text-teal-600 dark:text-teal-400">.</span>
        </span>
      )}
    </div>
  );
};
