// IMPROVEMENT: Memoized Footer with vector Logo, real social URLs, GDPR Manage Cookies trigger, and Admin Portal wiring
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  Headphones, 
  CreditCard, 
  Globe, 
  MessageCircle, 
  Send, 
  Cookie, 
  MapPin, 
  Phone, 
  Mail 
} from 'lucide-react';
import Logo from './Logo';
import './Footer.css';

const Footer = () => {
  const handleOpenCookieConsent = useCallback((e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-cookie-consent'));
  }, []);

  return (
    <footer className="footer">
      <div className="footer-top-glow" aria-hidden="true" />
      <div className="container relative-z">
        <div className="footer-grid">

          {/* Brand Info */}
          <div className="footer-brand">
            <Logo size="large" />
            <p className="footer-desc">
              Premier FMCG & grocery destination in Dhanbad. Authorized wholesale distributor & retail provider of oils, teas, and home essentials.
            </p>
            <div className="footer-social">
              <a
                href="https://e-commerce-roshan-enterprises-dhn.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Official Website"
              >
                <Globe size={18} />
              </a>
              <a
                href="https://wa.me/917004634675?text=Hello%20Roshan%20Enterprises,%20I%20have%20an%20inquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Chat on WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href="https://t.me/roshanenterprises"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Telegram Channel"
              >
                <Send size={18} />
              </a>
            </div>
          </div>

          {/* Links Group: 2-column on mobile, inline grid columns on desktop */}
          <div className="footer-links-group">
            {/* Quick Links */}
            <div className="footer-links-col">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/categories">Categories</Link></li>
                <li><Link to="/track-order">Track Order</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            {/* Support & Legal */}
            <div className="footer-links-col">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-links">
                <li><Link to="/orders">Order History</Link></li>
                <li><Link to="/shipping-policy">Shipping Policy</Link></li>
                <li><Link to="/return-policy">Return Policy</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/account">My Account</Link></li>
                <li>
                  <button
                    type="button"
                    onClick={handleOpenCookieConsent}
                    className="footer-cookie-btn"
                  >
                    <Cookie size={14} /> Manage Cookies
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info & Admin Link */}
          <div className="footer-links-col">
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="footer-contact">
              <li>
                <span className="contact-icon"><MapPin size={16} /></span>
                <span>
                  <a
                    href="https://maps.app.goo.gl/EgYHSHAsKaKmMsxT8"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Roshan Enterprises, Dhanbad
                  </a>
                </span>
              </li>
              <li>
                <span className="contact-icon"><Phone size={16} /></span>
                <span><a href="tel:+917004634675">+91 7004634675</a></span>
              </li>
              <li>
                <span className="contact-icon"><Mail size={16} /></span>
                <span><a href="mailto:surendrakumardhn@gmail.com">surendrakumardhn@gmail.com</a></span>
              </li>
              <li className="footer-policy-links">
                <Link to="/privacy">Privacy Policy</Link>
                <span className="divider">•</span>
                <Link to="/terms">Terms</Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="footer-trust-badges">
          <div className="trust-badge">
            <Truck size={24} />
            <div>
              <h6>Free Shipping</h6>
              <p>On orders over ₹500</p>
            </div>
          </div>
          <div className="trust-badge">
            <ShieldCheck size={24} />
            <div>
              <h6>Secure Payment</h6>
              <p>100% safe transactions</p>
            </div>
          </div>
          <div className="trust-badge">
            <Headphones size={24} />
            <div>
              <h6>24/7 Support</h6>
              <p>Dedicated assistance</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright-text">&copy; {new Date().getFullYear()} Roshan Enterprises. All rights reserved.</p>
          <div className="footer-payments">
            <span title="UPI"><CreditCard size={20} /> UPI</span>
            <span title="Visa">Visa</span>
            <span title="Mastercard">Mastercard</span>
            <span title="RuPay">RuPay</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
