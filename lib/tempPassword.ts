const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateTempPassword = (length = 10) => {
  let out = '';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  for (let i = 0; i < bytes.length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return `LSFMDHR-${out}`;
};
