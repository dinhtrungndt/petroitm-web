import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_ENCRYPT_KEY;

const isLikelyJwt = (value) => {
  if (typeof value !== 'string') return false;
  return value.split('.').length === 3;
};

// 🔐 Mã hóa token
export const encryptToken = (token) => {
  if (!token) return null;

  if (!SECRET_KEY) {
    return token;
  }

  try {
    return CryptoJS.AES.encrypt(token, SECRET_KEY).toString();
  } catch (error) {
    return token;
  }
};

// 🔓 Giải mã token
export const decryptToken = (encryptedToken) => {
  if (!encryptedToken) return null;

  if (!SECRET_KEY) {
    return encryptedToken;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (decrypted) {
      return decrypted;
    }

    return isLikelyJwt(encryptedToken) ? encryptedToken : null;
  } catch (error) {
    return isLikelyJwt(encryptedToken) ? encryptedToken : null;
  }
};
