import { useState, useRef, useEffect } from "react";
import visaImg from '../../assets/visa.png';
import masterImg from '../../assets/master.png';
import frimiImg from '../../assets/frimi.png';
import genieImg from '../../assets/genie.png';
import payhereImg from '../../assets/payhere.png';

// Card payment form with validation
const CardForm = ({ variant = 'visa', onPay }) => {
  const label = variant === 'visa' ? 'Visa Card Number' : 'Mastercard Number';

  const [number, setNumber] = useState(''); // raw digits only
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState(''); // formatted MM/YY
  const [cvv, setCvv] = useState('');

  const [touched, setTouched] = useState({ number: false, holder: false, expiry: false, cvv: false });

  const formatNumber = (digits) => {
    // group into 4-4-4 for 12 digits: "1234 5678 9012"
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const handleNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    setNumber(digits);
  };

  const handleHolderChange = (e) => {
    setHolder(e.target.value);
  };

  const handleExpiryChange = (e) => {
    // keep only digits and auto-insert slash after two digits
    let v = e.target.value.replace(/\D/g, '').slice(0, 4); // MMYY
    if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
    setExpiry(v);
  };

  const handleCvvChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCvv(digits);
  };

  const validateNumber = () => number.length === 12;
  const validateHolder = () => holder.trim().length > 0;
  const validateExpiry = () => {
    if (!/^(\d{2}\/\d{2})$/.test(expiry)) return false;
    const [m] = expiry.split('/');
    const month = Number(m);
    return month >= 1 && month <= 12;
  };
  const validateCvv = () => /^\d{3}$/.test(cvv);

  const showError = (field) => touched[field] && !({ number: validateNumber(), holder: validateHolder(), expiry: validateExpiry(), cvv: validateCvv() }[field]);

  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ fontSize: 12, color: '#555' }}>{label}</label>
      <input
        className="pm-input"
        inputMode="numeric"
        value={formatNumber(number)}
        onChange={handleNumberChange}
        onBlur={() => setTouched((t) => ({ ...t, number: true }))}
        aria-invalid={!validateNumber()}
      />
      {showError('number') && (
        <div style={{ color: 'crimson', fontSize: 12, marginTop: 4 }}>Card number must be 12 digits (3 groups of 4).</div>
      )}

      <label style={{ fontSize: 12, color: '#555', marginTop: 8 }}>Card Holder Name</label>
      <input
        className="pm-input"
        value={holder}
        onChange={handleHolderChange}
        onBlur={() => setTouched((t) => ({ ...t, holder: true }))}
        aria-invalid={!validateHolder()}
      />
      {showError('holder') && (
        <div style={{ color: 'crimson', fontSize: 12, marginTop: 4 }}>Please enter the card holder's name.</div>
      )}

      <div className="pm-row">
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, color: '#555' }}>Expiry (MM/YY)</label>
          <input
            className="pm-input"
            inputMode="numeric"
            value={expiry}
            onChange={handleExpiryChange}
            onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
            aria-invalid={!validateExpiry()}
          />
          {showError('expiry') && (
            <div style={{ color: 'crimson', fontSize: 12, marginTop: 4 }}>Enter a valid expiry month (01-12) and year.</div>
          )}
        </div>

        <div style={{ width: 120 }}>
          <label style={{ fontSize: 12, color: '#555' }}>CVV</label>
          <input
            className="pm-input"
            inputMode="numeric"
            value={cvv}
            onChange={handleCvvChange}
            onBlur={() => setTouched((t) => ({ ...t, cvv: true }))}
            aria-invalid={!validateCvv()}
          />
          {showError('cvv') && (
            <div style={{ color: 'crimson', fontSize: 12, marginTop: 4 }}>CVV must be 3 digits.</div>
          )}
        </div>
      </div>

      {/* inline pay button removed - use page-level Pay button */}
    </div>
  );
};

// Wallet form
const WalletForm = ({ type, onContinue }) => (
  <div style={{ marginTop: 12 }}>
    <input className="pm-input" placeholder="Mobile Number" inputMode="tel" />
  {/* inline continue button removed - use page-level Pay button */}
  </div>
);

const PayHereSection = ({ onSelectMethod, selectedMethod, onProcessPayment, contact, onContactChange }) => {
  const [quickPay, setQuickPay] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleDocClick = (e) => {
      const node = containerRef.current;
      if (!node) return;
      if (!node.contains(e.target) && selectedMethod) {
        onSelectMethod(null);
      }
    };

    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [selectedMethod, onSelectMethod]);

  // These trigger processing if parent supplied a handler
  const handlePay = () => {
    onProcessPayment && onProcessPayment();
  };

  const handleWalletContinue = () => {
    onProcessPayment && onProcessPayment();
  };

  return (
    <div className="pm-payhere-card" ref={containerRef}>

      <div className="pm-payhere-header">
        <h3>
          <img src={payhereImg} alt="PayHere" className="pm-logo-img" />
        </h3>
        <span className="pm-secure">● SECURE</span>
      </div>

      <label className="pm-input-label">
        Mobile Number or Email
      </label>

      <div className="pm-input-wrap">
        <input
          type="text"
          placeholder="e.g. +1 234 567 890 or you@email.com"
          value={contact ?? ''}
          onChange={(e) => onContactChange && onContactChange(e.target.value)}
        />
        <span>🔍</span>
      </div>

      <div className="pm-methods">
        <p>Available Payment Modes</p>

        <div className="pm-method-icons">

          <button
            type="button"
            onClick={() => onSelectMethod("visa")}
            className={selectedMethod === 'visa' ? 'active-method pm-method-btn' : 'pm-method-btn'}
          >
            <img src={visaImg} alt="VISA" />
          </button>

          <button
            type="button"
            onClick={() => onSelectMethod("master")}
            className={selectedMethod === 'master' ? 'active-method pm-method-btn' : 'pm-method-btn'}
          >
            <img src={masterImg} alt="Mastercard" />
          </button>

          <button
            type="button"
            onClick={() => onSelectMethod("frimi")}
            className={selectedMethod === 'frimi' ? 'active-method pm-method-btn' : 'pm-method-btn'}
          >
            <img src={frimiImg} alt="FriMi" />
          </button>

          <button
            type="button"
            onClick={() => onSelectMethod("genie")}
            className={selectedMethod === 'genie' ? 'active-method pm-method-btn' : 'pm-method-btn'}
          >
            <img src={genieImg} alt="Genie" />
          </button>

        </div>

        {(selectedMethod === 'visa' || selectedMethod === 'master') && (
          <CardForm variant={selectedMethod} onPay={handlePay} />
        )}

        {selectedMethod === 'frimi' && (
          <WalletForm type="FriMi" onContinue={handleWalletContinue} />
        )}

        {selectedMethod === 'genie' && (
          <WalletForm type="Genie" onContinue={handleWalletContinue} />
        )}

      </div>

      <div className="pm-toggle-row">
        <div
          className={`pm-toggle ${quickPay ? "active" : ""}`}
          onClick={() => setQuickPay(!quickPay)}
        >
          <div></div>
        </div>

        <span> Remember me for Quick Pay</span>
        <span className="pm-lightning">⚡</span>
      </div>

    </div>
  );
};

export default PayHereSection;