import crypto from "crypto";

export const generateHash = (merchantId, orderId, amount, currency, merchantSecret) => {
  // Format amount to 2 decimal places
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  // According to PayHere official documentation:
  // hash = strtoupper(md5(merchant_id + order_id + amount + currency + strtoupper(md5(merchant_secret))))
  
  // Step 1: Generate MD5 of merchant_secret and convert to UPPERCASE
  const md5Secret = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
  console.log("Step 1 - MD5 of merchant_secret (uppercase):", md5Secret);
  
  // Step 2: Concatenate: merchant_id + order_id + amount + currency + md5Secret
  const rawString = merchantId + orderId + formattedAmount + currency + md5Secret;
  console.log("Step 2 - Raw string for final hash:", rawString);
  
  // Step 3: Generate MD5 of the concatenated string and convert to UPPERCASE
  const hash = crypto.createHash("md5").update(rawString).digest("hex").toUpperCase();
  console.log("Step 3 - Final hash (uppercase):", hash);
  
  return hash;
};