export declare function encrypt(plaintext: string): string;
export declare function decrypt(encryptedText: string): string;
export declare function encryptField<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): T;
export declare function decryptField<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): T;
