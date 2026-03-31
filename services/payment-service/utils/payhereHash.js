import CryptoJS from "crypto-js";

export function generateHash(merchantId, orderId, amount, currency, merchantSecret) {

    const hashedSecret = CryptoJS.MD5(merchantSecret).toString().toUpperCase();

    const hash = CryptoJS.MD5(
        merchantId + orderId + amount + currency + hashedSecret
    ).toString().toUpperCase();

    return hash;
}