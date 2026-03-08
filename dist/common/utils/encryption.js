"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.encryptField = encryptField;
exports.decryptField = decryptField;
const crypto_1 = require("crypto");
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is not set. Cannot perform encryption operations.');
    }
    return key;
}
function deriveKey(salt) {
    const secret = getEncryptionKey();
    return (0, crypto_1.scryptSync)(secret, salt, KEY_LENGTH);
}
function encrypt(plaintext) {
    if (!plaintext) {
        return plaintext;
    }
    const salt = (0, crypto_1.randomBytes)(SALT_LENGTH);
    const key = deriveKey(salt);
    const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return [
        salt.toString('hex'),
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted,
    ].join(':');
}
function decrypt(encryptedText) {
    if (!encryptedText) {
        return encryptedText;
    }
    const parts = encryptedText.split(':');
    if (parts.length !== 4) {
        throw new Error('Invalid encrypted text format');
    }
    const [saltHex, ivHex, authTagHex, encrypted] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = deriveKey(salt);
    const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
function encryptField(obj, fields) {
    const result = { ...obj };
    for (const field of fields) {
        const value = result[field];
        if (typeof value === 'string' && value.length > 0) {
            result[field] = encrypt(value);
        }
    }
    return result;
}
function decryptField(obj, fields) {
    const result = { ...obj };
    for (const field of fields) {
        const value = result[field];
        if (typeof value === 'string' && value.length > 0) {
            result[field] = decrypt(value);
        }
    }
    return result;
}
//# sourceMappingURL=encryption.js.map