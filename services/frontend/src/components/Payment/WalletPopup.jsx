import { createPortal } from "react-dom";

const WalletPopup = ({ open, onClose, type }) => {
  if (!open) return null;

  const modal = (
    <div className="pm-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>

        <h2 className="text-lg font-semibold mb-4">{type} Payment</h2>

        <input className="pm-input" placeholder="Mobile Number" inputMode="tel" />

        <button className="ms-btn-primary w-full py-2 rounded-lg">Continue</button>

        <button onClick={onClose} className="text-sm text-gray-500 mt-3 w-full">Cancel</button>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default WalletPopup;