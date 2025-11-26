const ensureCrypto = () => {
  if (typeof globalThis.crypto === 'undefined') {
    throw new Error('Web Crypto API is not available in this environment');
  }
  return globalThis.crypto;
};

const encoder = new TextEncoder();

export const arrayBufferToHex = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const hexToUint8Array = (hex: string) => {
  const length = hex.length / 2;
  const result = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return result;
};

export const timingSafeEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
};

export const computeHmacSha256Hex = async (secret: string, payload: string) => {
  const cryptoObj = ensureCrypto();
  const key = await cryptoObj.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await cryptoObj.subtle.sign('HMAC', key, encoder.encode(payload));
  return arrayBufferToHex(signature);
};

export { encoder };
