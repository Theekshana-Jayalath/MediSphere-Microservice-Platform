import crypto from "crypto";

export const generateHash = (merchantId, orderId, amount, currency, merchantSecret) => {
  const formattedAmount = parseFloat(amount).toFixed(2);

  // PayHere expects MD5 of: merchant_id + order_id + amount + currency + merchant_secret
  const raw = merchantId + orderId + formattedAmount + currency + merchantSecret;
  const hash = crypto.createHash("md5").update(raw).digest("hex").toUpperCase();

  return hash;
};