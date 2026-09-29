import React from 'react';

interface UttamLogoProps {
  className?: string;
  showSubtitle?: boolean;
  inverted?: boolean;
  useImage?: boolean;
}

/**
 * Official Uttam Bharat - Power and Distribution Transformers Brand Logo
 * Matches the uploaded brand artwork:
 * - Bold black typography for 'UTT' and 'M'
 * - Blue triangular 'A' with sharp electric power lightning bolt
 * - Registered trademark symbol (®) at top right of 'M'
 * - Serif uppercase tagline: 'POWER AND DISTRIBUTION TRANSFORMERS'
 * - Responsive support for light, dark, and inverted contexts
 */
export const UttamLogo: React.FC<UttamLogoProps> = ({
  className = 'h-10',
  showSubtitle = true,
  inverted = false,
  useImage = false,
}) => {
  if (useImage && !inverted) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/logo.png"
          alt="Uttam Bharat - Power and Distribution Transformers"
          className="w-auto h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const textColor = inverted ? '#ffffff' : 'currentColor';
  const subtitleColor = inverted ? '#f1f5f9' : 'currentColor';
  const triangleBlue = '#006ce5';
  const boltCyan = '#38bdf8';
  const boltWhite = '#ffffff';

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox={showSubtitle ? '0 0 1000 375' : '0 0 1000 270'}
        className="w-auto h-full overflow-visible"
        style={{ maxHeight: '100%' }}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Uttam Bharat - Power and Distribution Transformers"
      >
        <defs>
          <filter id="boltGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g id="uttam-brand-mark">
          {/* UTT */}
          <text
            x="18"
            y="238"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Impact, 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize="220"
            letterSpacing="5"
            fill={textColor}
          >
            UTT
          </text>

          {/* Letter 'A': Vibrant Blue Triangle with Cutting Electric Lightning Bolt */}
          <g id="letter-A">
            {/* Primary Blue Triangle */}
            <polygon
              points="615,55 715,240 515,240"
              fill={triangleBlue}
            />

            {/* Lightning Bolt Streak Glow */}
            <polyline
              points="676,48 633,136 660,140 556,262"
              fill="none"
              stroke={boltCyan}
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="miter"
              filter="url(#boltGlow)"
            />

            {/* Sharp White Lightning Bolt Core */}
            <polyline
              points="676,48 633,136 660,140 556,262"
              fill="none"
              stroke={boltWhite}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="miter"
            />
          </g>

          {/* M */}
          <text
            x="724"
            y="238"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Impact, 'Arial Black', sans-serif"
            fontWeight="900"
            fontSize="220"
            letterSpacing="5"
            fill={textColor}
          >
            M
          </text>

          {/* Registered Trademark ® */}
          <g id="registered-mark" transform="translate(936, 68)">
            <circle
              cx="26"
              cy="26"
              r="24"
              fill="none"
              stroke={textColor}
              strokeWidth="6.5"
            />
            <text
              x="26"
              y="36"
              fontFamily="system-ui, -apple-system, Arial, sans-serif"
              fontWeight="900"
              fontSize="28"
              textAnchor="middle"
              fill={textColor}
            >
              R
            </text>
          </g>

          {/* Subtitle: POWER AND DISTRIBUTION TRANSFORMERS (Bold Serif) */}
          {showSubtitle && (
            <text
              x="498"
              y="328"
              fontFamily="Georgia, 'Times New Roman', Times, serif"
              fontWeight="bold"
              fontSize="45"
              letterSpacing="4.5"
              textAnchor="middle"
              fill={subtitleColor}
            >
              POWER AND DISTRIBUTION TRANSFORMERS
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};
