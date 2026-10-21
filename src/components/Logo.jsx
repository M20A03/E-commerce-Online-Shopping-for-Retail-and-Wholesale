// Modern Ultra-Crisp Geometric Monogram Logo for Roshan Enterprises
import React from 'react';
import { Link } from 'react-router-dom';
import './Logo.css';

const Logo = ({ className = '', size = 'medium', showText = true, onClick }) => {
  return (
    <Link to="/" className={`roshan-logo roshan-logo--${size} ${className}`} onClick={onClick} aria-label="Roshan Enterprises Home">
      <div className="roshan-logo__icon-wrapper">
        <svg className="roshan-logo__symbol" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="roshanModernGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="roshanGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="roshanGoldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="modernPillGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Elevated Squircle Background with Gradient Border */}
          <rect x="6" y="6" width="88" height="88" rx="26" fill="url(#roshanGlowGrad)" stroke="url(#roshanModernGrad)" strokeWidth="3" />
          
          {/* Subtle Ambient Light Corner Accent */}
          <path d="M12 32C12 20.9543 20.9543 12 32 12H52L24 40H12V32Z" fill="url(#roshanModernGrad)" opacity="0.15" />

          {/* Minimalist Geometric Monogram 'R' */}
          <path
            d="M34 26H52C61.9411 26 70 34.0589 70 44C70 51.8 65.04 58.44 58.07 60.85L70.5 74H57.5L47.5 62H44V74H34V26ZM44 35V53H52C56.9706 53 61 48.9706 61 44C61 39.0294 56.9706 35 52 35H44Z"
            fill="url(#roshanModernGrad)"
            filter="url(#modernPillGlow)"
          />

          {/* Dynamic Gold Spark/Crown Accent */}
          <circle cx="68" cy="28" r="4.5" fill="url(#roshanGoldAccent)" />
          <path d="M68 20V23M68 33V36M60 28H63M73 28H76" stroke="url(#roshanGoldAccent)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <span className="roshan-logo__text">
          <span className="roshan-logo__title">Roshan</span>
          <span className="roshan-logo__subtitle">ENTERPRISES</span>
        </span>
      )}
    </Link>
  );
};

export default React.memo(Logo);
