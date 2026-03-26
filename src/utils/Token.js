import { decryptToken, encryptToken } from './cryptoUtils';

const TOKEN_KEY = 'access_token';

export const setToken = (token) => {
  if (!token) return;
  const encrypted = encryptToken(token);
  localStorage.setItem(TOKEN_KEY, encrypted);
};

export const getToken = () => {
  const encrypted = localStorage.getItem(TOKEN_KEY);
  return decryptToken(encrypted);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};
