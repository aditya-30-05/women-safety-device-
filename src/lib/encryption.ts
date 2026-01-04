// End-to-End Encryption Service using Web Crypto API
export class EncryptionService {
  private static async getKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: string, password: string): Promise<string> {
    try {
      const key = await this.getKey(password);
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(data)
      );
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  static async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      const key = await this.getKey(password);
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed - wrong password or corrupted data');
    }
  }

  static async encryptObject<T>(data: T, password: string): Promise<string> {
    const jsonData = JSON.stringify(data);
    return this.encrypt(jsonData, password);
  }

  static async decryptObject<T>(encryptedData: string, password: string): Promise<T> {
    const decrypted = await this.decrypt(encryptedData, password);
    return JSON.parse(decrypted) as T;
  }
}

// Helper to get encryption password from storage
export const getEncryptionPassword = (): string | null => {
  try {
    const hash = localStorage.getItem('encryption_password_hash');
    if (hash) {
      return atob(hash);
    }
    return null;
  } catch {
    return null;
  }
};

// Helper to check if stealth mode is active
export const isStealthModeActive = (): boolean => {
  try {
    const saved = localStorage.getItem('stealth_mode');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.active || false;
    }
    return false;
  } catch {
    return false;
  }
};

