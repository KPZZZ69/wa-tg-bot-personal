const crypto = require('crypto');
require('dotenv').config();

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.DB_ENCRYPTION_KEY; // Must be 32 bytes

if (!KEY || KEY.length !== 32) {
  console.warn('WARNING: DB_ENCRYPTION_KEY is not set or not exactly 32 bytes... Using fallback for dev, NOT FOR PRODUCTION!');
}

const getValidKey = () => {
    if (KEY && KEY.length === 32) return Buffer.from(KEY, 'utf-8');
    return crypto.scryptSync('fallback-dev-password', 'salt', 32);
};

function encrypt(text) {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, getValidKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed', err);
    return text; // Return plain fallback or could throw
  }
}

function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getValidKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed', err);
    return null;
  }
}

function encryptJSON(obj) {
  if (!obj) return obj;
  return encrypt(JSON.stringify(obj));
}

function decryptJSON(encryptedText) {
  if (!encryptedText) return null;
  const dec = decrypt(encryptedText);
  try {
    return dec ? JSON.parse(dec) : null;
  } catch(e) {
    return null;
  }
}

module.exports = { encrypt, decrypt, encryptJSON, decryptJSON };
