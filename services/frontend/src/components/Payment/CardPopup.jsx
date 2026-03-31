import { createPortal } from "react-dom";

const CardPopup = ({ open, onClose }) => {
  if (!open) return null;

  const modal = (
    <div
      className="pm-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>

        <h2 className="text-lg font-semibold mb-4">Card Payment</h2>

        <input className="pm-input" placeholder="Card Number" inputMode="numeric" />
        <input className="pm-input" placeholder="Card Holder Name" />

        <div className="pm-row">
          <input className="pm-input" placeholder="MM/YY" />
          <input className="pm-input" placeholder="CVV" inputMode="numeric" />
        </div>

        <button className="ms-btn-primary w-full mt-2 py-2 rounded-lg">Pay Now</button>

        <button onClick={onClose} className="text-sm text-gray-500 mt-3 w-full">
          Cancel
        </button>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default CardPopup;