import React, { useState, useEffect } from 'react';
import './WelcomeSplash.css';

export default function WelcomeSplash({ onFinish }) {
  const [fading, setFading] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    // Show the splash for 1.4s, then smoothly fade out
    const timer = setTimeout(() => {
      setFading(true);
    }, 1200);

    const removeTimer = setTimeout(() => {
      setRemoved(true);
      if (onFinish) onFinish();
    }, 1800);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  if (removed) return null;

  return (
    <div className={`re-welcome-splash ${fading ? 're-welcome-splash--fade' : ''}`} role="dialog" aria-modal="true">
      <div className="re-welcome-glow" aria-hidden="true" />
      <div className="re-welcome-card">
        {/* Animated Gold Roshan Crest */}
        <div className="re-welcome-emblem-wrap">
          <svg className="re-welcome-emblem" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="reSplashGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde0b2" />
                <stop offset="50%" stopColor="#d4a373" />
                <stop offset="100%" stopColor="#8d5b34" />
              </linearGradient>
              <filter id="reGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <circle cx="50" cy="50" r="45" stroke="url(#reSplashGold)" strokeWidth="2.5" fill="none" className="re-spin-slow" />
            <circle cx="50" cy="50" r="40" fill="#1b120c" />
            <circle cx="50" cy="50" r="38" stroke="url(#reSplashGold)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            <path
              d="M38 28 H 52 C 60 28, 66 32, 66 40 C 66 47, 60 51, 52 51 H 45 V 72 H 38 V 28 Z M 45 34 V 45 H 52 C 56 45, 59 43, 59 39.5 C 59 36, 56 34, 52 34 H 45 Z"
              fill="url(#reSplashGold)"
              filter="url(#reGlowFilter)"
            />
            <path d="M 50 49 L 65 72 H 57 L 44 50 Z" fill="url(#reSplashGold)" />
            <circle cx="50" cy="18" r="2.5" fill="url(#reSplashGold)" />
            <circle cx="42" cy="20" r="1.8" fill="url(#reSplashGold)" />
            <circle cx="58" cy="20" r="1.8" fill="url(#reSplashGold)" />
          </svg>
          <div className="re-pulse-ring" />
        </div>

        <div className="re-welcome-brand">
          <span className="re-welcome-name">ROSHAN</span>
          <span className="re-welcome-subtitle">ENTERPRISES</span>
        </div>

        <p className="re-welcome-tagline">Everyday Quality Essentials • Dhanbad</p>

        <div className="re-welcome-bar">
          <div className="re-welcome-bar-fill" />
        </div>

        <span className="re-welcome-status">Opening Storefront...</span>
      </div>
    </div>
  );
}
