const PIN_SESSION_KEY = 'sportowy-vibe-pin-session';

interface PinSessionData {
  userId: string;
  email: string;
  encryptedSession: string; // base64 encoded encrypted JSON { access_token, refresh_token, expires_at }
  iv: string; // base64 encoded IV
  salt: string; // base64 encoded salt for PBKDF2
  pinHash: string; // SHA-256 hash of PIN+userId for quick local verification
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function sha256(message: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(message));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function encryptSession(
  pin: string,
  userId: string,
  email: string,
  sessionJson: string
): Promise<boolean> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(pin, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(sessionJson)
    );

    const pinHash = await sha256(pin + ':' + userId);

    const data: PinSessionData = {
      userId,
      email,
      encryptedSession: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt),
      pinHash,
    };

    localStorage.setItem(PIN_SESSION_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('[Crypto] encryptSession error:', e);
    return false;
  }
}

export async function decryptSession(pin: string): Promise<
  | { ok: true; sessionJson: string; email: string; userId: string }
  | { ok: false; reason: 'no_session' | 'wrong_pin' | 'decrypt_error' }
> {
  try {
    const raw = localStorage.getItem(PIN_SESSION_KEY);
    if (!raw) {
      return { ok: false, reason: 'no_session' };
    }

    const data: PinSessionData = JSON.parse(raw);

    // Quick local PIN verification first
    const expectedHash = await sha256(pin + ':' + data.userId);
    if (expectedHash !== data.pinHash) {
      return { ok: false, reason: 'wrong_pin' };
    }

    const key = await deriveKey(pin, base64ToArrayBuffer(data.salt));
    const iv = base64ToArrayBuffer(data.iv);
    const encrypted = base64ToArrayBuffer(data.encryptedSession);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const dec = new TextDecoder();
    const sessionJson = dec.decode(decrypted);

    return { ok: true, sessionJson, email: data.email, userId: data.userId };
  } catch (e) {
    console.error('[Crypto] decryptSession error:', e);
    return { ok: false, reason: 'decrypt_error' };
  }
}

export function hasPinSession(): boolean {
  return localStorage.getItem(PIN_SESSION_KEY) !== null;
}

export function getPinSessionEmail(): string | null {
  try {
    const raw = localStorage.getItem(PIN_SESSION_KEY);
    if (!raw) return null;
    const data: PinSessionData = JSON.parse(raw);
    return data.email || null;
  } catch {
    return null;
  }
}

export function clearPinSession(): void {
  localStorage.removeItem(PIN_SESSION_KEY);
}