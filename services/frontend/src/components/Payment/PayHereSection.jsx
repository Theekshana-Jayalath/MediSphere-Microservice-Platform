import { useState, useRef, useEffect } from "react";
import visaImg from '../../assets/visa.png';
import masterImg from '../../assets/master.png';
import frimiImg from '../../assets/frimi.png';
import genieImg from '../../assets/genie.png';
import payhereImg from '../../assets/payhere.png';

// Card Form Component
const CardForm = ({ variant = 'visa', onDataChange }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [touched, setTouched] = useState({});

  // Send card data to parent when valid
  useEffect(() => {
    const isValid = validateCardNumber() && validateCardHolder() && validateExpiry() && validateCvv();
    if (onDataChange) {
      onDataChange({
        isValid,
        data: {
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardHolder,
          expiry,
          cvv
        }
      });
    }
  }, [cardNumber, cardHolder, expiry, cvv]);

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    setExpiry(value);
  };

  const validateCardNumber = () => {
    const digits = cardNumber.replace(/\s/g, '');
    return digits.length === 16;
  };

  const validateExpiry = () => {
    return /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry);
  };

  const validateCvv = () => {
    return /^\d{3}$/.test(cvv);
  };

  const validateCardHolder = () => {
    return cardHolder.trim().length > 0;
  };

  return (
    <div className="card-form">
      <div className="form-group">
        <label className="form-label">
          {variant === 'visa' ? 'Visa Card Number' : 'Mastercard Number'}
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={handleCardNumberChange}
          onBlur={() => setTouched({ ...touched, cardNumber: true })}
        />
        {touched.cardNumber && !validateCardNumber() && (
          <span className="form-error">Please enter a valid 16-digit card number</span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Card Holder Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="JOHN DOE"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
          onBlur={() => setTouched({ ...touched, cardHolder: true })}
        />
        {touched.cardHolder && !validateCardHolder() && (
          <span className="form-error">Please enter card holder name</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Expiry Date (MM/YY)</label>
          <input
            type="text"
            className="form-input"
            placeholder="MM/YY"
            value={expiry}
            onChange={handleExpiryChange}
            onBlur={() => setTouched({ ...touched, expiry: true })}
          />
          {touched.expiry && !validateExpiry() && (
            <span className="form-error">Invalid expiry date</span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">CVV</label>
          <input
            type="text"
            className="form-input"
            placeholder="123"
            maxLength="3"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
            onBlur={() => setTouched({ ...touched, cvv: true })}
          />
          {touched.cvv && !validateCvv() && (
            <span className="form-error">CVV must be 3 digits</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Wallet Form Component
const WalletForm = ({ type, onDataChange }) => {
  const [mobileNumber, setMobileNumber] = useState('');

  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        isValid: mobileNumber.length >= 10,
        data: { mobileNumber }
      });
    }
  }, [mobileNumber]);

  return (
    <div className="wallet-form">
      <div className="form-group">
        <label className="form-label">{type} Mobile Number</label>
        <input
          type="tel"
          className="form-input"
          placeholder="0712345678"
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
        />
        <span className="form-hint">Enter your {type} registered mobile number</span>
      </div>
    </div>
  );
};

// Main PayHere Section Component
const PayHereSection = ({ 
  onSelectMethod, 
  selectedMethod, 
  onProcessPayment, 
  contact, 
  onContactChange, 
  isProcessing,
  payHereReady = true 
}) => {
  const [quickPay, setQuickPay] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
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

  const paymentMethods = [
    { id: 'visa', name: 'VISA', img: visaImg },
    { id: 'master', name: 'Mastercard', img: masterImg },
    { id: 'frimi', name: 'FriMi', img: frimiImg },
    { id: 'genie', name: 'Genie', img: genieImg }
  ];

  const handlePaymentDataChange = (data) => {
    setPaymentData(data);
  };

  const isPaymentMethodValid = () => {
    if (!selectedMethod) return false;
    if (selectedMethod === 'visa' || selectedMethod === 'master') {
      return paymentData?.isValid === true;
    }
    if (selectedMethod === 'frimi' || selectedMethod === 'genie') {
      return paymentData?.isValid === true;
    }
    return true;
  };

  return (
    <div className="payment-methods-card" ref={containerRef}>
      <div className="methods-header">
        <div className="payhere-logo">
          <img src={payhereImg} alt="PayHere" />
        </div>
        <span className="secure-badge">● SECURE</span>
      </div>

      <div className="contact-input">
        <label className="form-label">Mobile Number or Email</label>
        <div className="input-with-icon">
          <input
            type="text"
            placeholder="e.g. 0771234567 or you@email.com"
            value={contact ?? ''}
            onChange={(e) => onContactChange && onContactChange(e.target.value)}
            className="form-input"
            disabled={isProcessing}
          />
          <span className="input-icon">🔍</span>
        </div>
      </div>

      <div className="payment-methods">
        <p className="methods-title">Available Payment Modes</p>
        <div className="methods-icons">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectMethod(method.id)}
              className={`method-btn ${selectedMethod === method.id ? 'active' : ''}`}
              disabled={isProcessing}
            >
              <img src={method.img} alt={method.name} />
            </button>
          ))}
        </div>

        {/* Show card form when Visa or Mastercard is selected */}
        {(selectedMethod === 'visa' || selectedMethod === 'master') && (
          <CardForm variant={selectedMethod} onDataChange={handlePaymentDataChange} />
        )}

        {/* Show wallet form when FriMi or Genie is selected */}
        {(selectedMethod === 'frimi' || selectedMethod === 'genie') && (
          <WalletForm 
            type={selectedMethod === 'frimi' ? 'FriMi' : 'Genie'} 
            onDataChange={handlePaymentDataChange}
          />
        )}
      </div>

      <div className="quick-pay">
        <div 
          className={`toggle-switch ${quickPay ? 'active' : ''}`} 
          onClick={() => !isProcessing && setQuickPay(!quickPay)}
        >
          <div className="toggle-slider"></div>
        </div>
        <span>Remember me for Quick Pay</span>
        <span className="lightning-icon">⚡</span>
      </div>

      <button 
        onClick={onProcessPayment} 
        className="pay-now-button"
        disabled={isProcessing || !selectedMethod || !contact || !payHereReady || (selectedMethod && !isPaymentMethodValid())}
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
};

export default PayHereSection;