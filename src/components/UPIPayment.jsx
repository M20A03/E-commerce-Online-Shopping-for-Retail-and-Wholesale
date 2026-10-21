import React, { useMemo, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Copy, ExternalLink, Clock, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { validateUPIUTR } from '../utils/orderLifecycle';
import './UPIPayment.css';

const UPI_RECEIVER_ID = 'mayankraj.dhn5-2@okaxis';
const UPI_RECEIVER_NAME = 'Roshan Enterprises';

const UPIPayment = ({
  amount,
  lockedAmount,
  customerName = UPI_RECEIVER_NAME,
  onPaymentConfirm,
  isProcessing = false
}) => {
  const [transactionId, setTransactionId] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [step, setStep] = useState('pay'); // 'pay' | 'verify'
  const [utrError, setUtrError] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins countdown

  const payableAmount = Number((lockedAmount ?? amount ?? 0).toFixed(2));
  const [randomSuffix] = useState(() => Math.floor(100000 + Math.random() * 900000));
  const orderRef = `RE${randomSuffix}`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Standard generic UPI URI specification
  const genericUpiUri = useMemo(() => {
    return `upi://pay?pa=${encodeURIComponent(UPI_RECEIVER_ID)}&pn=${encodeURIComponent(UPI_RECEIVER_NAME)}&am=${payableAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${orderRef}`)}&tr=${orderRef}`;
  }, [payableAmount, orderRef]);

  // Specific App Links
  const gpayUri = genericUpiUri;
  const phonepeUri = genericUpiUri;
  const paytmUri = genericUpiUri;

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleVerifyAndSubmit = (e) => {
    e.preventDefault();
    const cleanUTR = transactionId.trim().replace(/\s+/g, '');

    if (!cleanUTR) {
      setUtrError('Please enter the 12-digit UPI UTR / Reference ID from your app.');
      return;
    }

    if (!validateUPIUTR(cleanUTR)) {
      setUtrError('Invalid reference ID. A valid UPI UTR must be exactly 12 characters (e.g. 402819384729).');
      return;
    }

    setUtrError('');
    onPaymentConfirm({
      method: 'upi',
      upiId: UPI_RECEIVER_ID,
      amount: payableAmount,
      transactionId: cleanUTR.toUpperCase(),
      orderRef,
      timestamp: new Date().toISOString(),
      paymentVerificationStatus: 'Under Review'
    });
  };

  return (
    <div className="upi-payment">
      {/* Timer Bar */}
      <div className="upi-timer-bar">
        <div className="upi-timer-info">
          <Clock size={16} className="text-amber-500" />
          <span>Payment Session Expires In:</span>
          <strong className="upi-timer-digit">{formattedTime}</strong>
        </div>
        <span className="upi-verified-badge">
          <ShieldCheck size={14} /> 256-Bit Encrypted
        </span>
      </div>

      {step === 'pay' ? (
        <div className="upi-step-content">
          <div className="upi-qr-card">
            <div className="upi-qr-header">
              <h4>Scan to Pay with Any UPI App</h4>
              <p>Google Pay, PhonePe, Paytm, BHIM, or Banking Apps</p>
            </div>

            <div className="upi-qr-wrapper">
              <QRCodeSVG
                value={genericUpiUri}
                size={190}
                level="M"
                includeMargin={true}
                className="upi-qr-code"
              />
              <div className="upi-amount-pill">
                Pay Exactly: <strong>₹{payableAmount.toFixed(2)}</strong>
              </div>
            </div>

            {/* Direct Mobile App Intent Buttons */}
            <div className="upi-mobile-intents">
              <span className="upi-mobile-intents-label">On mobile? Tap your preferred app:</span>
              <div className="upi-app-buttons-grid">
                <a href={gpayUri} className="upi-intent-btn upi-intent-btn--gpay">
                  <span>Google Pay</span>
                  <ExternalLink size={14} />
                </a>
                <a href={phonepeUri} className="upi-intent-btn upi-intent-btn--phonepe">
                  <span>PhonePe</span>
                  <ExternalLink size={14} />
                </a>
                <a href={paytmUri} className="upi-intent-btn upi-intent-btn--paytm">
                  <span>Paytm / UPI</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Manual Details & Copy Area */}
          <div className="upi-manual-box">
            <h5>Or Pay Manually to Official UPI ID</h5>
            <div className="upi-copy-row">
              <div className="upi-copy-info">
                <span className="upi-copy-label">UPI ID</span>
                <span className="upi-copy-val">{UPI_RECEIVER_ID}</span>
              </div>
              <button
                type="button"
                className="upi-copy-btn"
                onClick={() => handleCopy(UPI_RECEIVER_ID, 'upiId')}
              >
                {copiedField === 'upiId' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copiedField === 'upiId' ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="upi-copy-row">
              <div className="upi-copy-info">
                <span className="upi-copy-label">Payable Amount</span>
                <span className="upi-copy-val">₹{payableAmount.toFixed(2)}</span>
              </div>
              <button
                type="button"
                className="upi-copy-btn"
                onClick={() => handleCopy(payableAmount.toFixed(2), 'amount')}
              >
                {copiedField === 'amount' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copiedField === 'amount' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="upi-action-btn upi-action-btn--primary"
            onClick={() => setStep('verify')}
          >
            <span>I Have Paid — Enter 12-Digit Reference ID</span>
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <form className="upi-step-content upi-verify-step" onSubmit={handleVerifyAndSubmit}>
          <div className="upi-verify-header">
            <h4>Submit UPI Payment Reference</h4>
            <p>
              Please enter the 12-digit <strong>UTR / UPI Ref Number</strong> from your payment receipt to link your order.
            </p>
          </div>

          <div className="upi-input-group">
            <label htmlFor="upi-utr-input">12-Digit UTR / Transaction Reference ID</label>
            <input
              id="upi-utr-input"
              type="text"
              inputMode="numeric"
              maxLength={12}
              className={`upi-utr-input ${utrError ? 'is-invalid' : ''}`}
              placeholder="e.g. 402819384729"
              value={transactionId}
              onChange={(e) => {
                setTransactionId(e.target.value.trim().toUpperCase());
                if (utrError) setUtrError('');
              }}
              autoFocus
            />
            <div className="upi-input-hint">
              <span>Length: {transactionId.length}/12 digits</span>
              {transactionId.length === 12 && validateUPIUTR(transactionId) && (
                <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                  <CheckCircle2 size={14} /> Valid Format
                </span>
              )}
            </div>
            {utrError && (
              <div className="upi-error-msg">
                <AlertCircle size={14} /> {utrError}
              </div>
            )}
          </div>

          <div className="upi-verify-actions">
            <button
              type="button"
              className="upi-action-btn upi-action-btn--secondary"
              onClick={() => setStep('pay')}
            >
              Back to QR Code
            </button>
            <button
              type="submit"
              className="upi-action-btn upi-action-btn--primary"
              disabled={isProcessing || transactionId.length !== 12}
            >
              {isProcessing ? 'Verifying & Placing Order...' : 'Confirm & Place Order'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default React.memo(UPIPayment);
