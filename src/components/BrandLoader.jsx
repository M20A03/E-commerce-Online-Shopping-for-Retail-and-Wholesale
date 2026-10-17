import React from 'react';
import './BrandLoader.css';

const BrandLoader = ({ message = 'Loading Roshan Enterprises...', fullPage = false }) => {
  return (
    <div className={`brand-loader-wrap ${fullPage ? 'brand-loader-wrap--full' : ''}`} role="status" aria-live="polite">
      <div className="brand-loader__glow" aria-hidden="true" />
      <div className="brand-loader__card">
        {/* Animated Golden Emblem */}
        <div className="brand-loader__emblem-container">
          <svg className="brand-loader__svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="blGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e8c28a" />
                <stop offset="50%" stopColor="#d4a373" />
                <stop offset="100%" stopColor="#8d5b34" />
              </linearGradient>
              <filter id="blGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <circle cx="50" cy="50" r="44" stroke="url(#blGold)" strokeWidth="2.5" strokeDasharray="6 4" className="brand-loader__ring-spin" />
            <circle cx="50" cy="50" r="38" fill="#1b120c" stroke="url(#blGold)" strokeWidth="1" opacity="0.9" />
            <path
              d="M38 28 H 52 C 60 28, 66 32, 66 40 C 66 47, 60 51, 52 51 H 45 V 72 H 38 V 28 Z M 45 34 V 45 H 52 C 56 45, 59 43, 59 39.5 C 59 36, 56 34, 52 34 H 45 Z"
              fill="url(#blGold)"
              filter="url(#blGlow)"
            />
            <path d="M 50 49 L 65 72 H 57 L 44 50 Z" fill="url(#blGold)" />
            <circle cx="50" cy="18" r="2.5" fill="url(#blGold)" />
            <circle cx="42" cy="20" r="1.8" fill="url(#blGold)" />
            <circle cx="58" cy="20" r="1.8" fill="url(#blGold)" />
          </svg>
          <div className="brand-loader__pulse-aura" />
        </div>

        <div className="brand-loader__text-group">
          <h3 className="brand-loader__brand-name">ROSHAN ENTERPRISES</h3>
          <p className="brand-loader__sub">Everyday Quality Essentials • Dhanbad</p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="brand-loader__progress-bar">
          <div className="brand-loader__progress-fill" />
        </div>

        <span className="brand-loader__msg">{message}</span>
      </div>
    </div>
  );
};

export default React.memo(BrandLoader);
