// Security utilities for authentication and authorization

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 12) {
    score += 1;
  } else if (password.length >= 8) {
    feedback.push('Use at least 12 characters for better security');
  } else {
    feedback.push('Password must be at least 8 characters');
    return { score: 0, feedback, isStrong: false };
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters (!@#$%^&*)');
  }

  // Common patterns check
  const commonPatterns = ['123', 'abc', 'password', 'qwerty', 'admin'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    feedback.push('Avoid common patterns');
    score = Math.max(0, score - 1);
  }

  return {
    score,
    feedback: feedback.length > 0 ? feedback : ['Strong password!'],
    isStrong: score >= 4,
  };
};

export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

export const hashString = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const getDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 2, 2);
  const canvasFingerprint = canvas.toDataURL();

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvasFingerprint,
  ].join('|');

  return btoa(fingerprint);
};

export const rateLimitCheck = (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
  const storageKey = `rate_limit_${key}`;
  const now = Date.now();
  const attempts = JSON.parse(localStorage.getItem(storageKey) || '[]') as number[];

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limit exceeded
  }

  // Add current attempt
  recentAttempts.push(now);
  localStorage.setItem(storageKey, JSON.stringify(recentAttempts));
  return true; // Within rate limit
};

export const clearRateLimit = (key: string): void => {
  localStorage.removeItem(`rate_limit_${key}`);
};

export const getRateLimitRemaining = (key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): number => {
  const storageKey = `rate_limit_${key}`;
  const now = Date.now();
  const attempts = JSON.parse(localStorage.getItem(storageKey) || '[]') as number[];
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  return Math.max(0, maxAttempts - recentAttempts.length);
};

export const logSecurityEvent = async (
  eventType: string,
  userId: string | null,
  details: Record<string, unknown>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) => {
  const event = {
    event_type: eventType,
    user_id: userId,
    details,
    severity,
    timestamp: new Date().toISOString(),
    ip_address: await getClientIP(),
    device_fingerprint: getDeviceFingerprint(),
    user_agent: navigator.userAgent,
  };

  // Store in localStorage for offline logging
  const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
  logs.push(event);
  // Keep only last 100 logs
  const recentLogs = logs.slice(-100);
  localStorage.setItem('security_logs', JSON.stringify(recentLogs));

  // In production, send to backend
  console.log('Security Event:', event);
};

const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
};

export type UserRole = 'user' | 'admin' | 'moderator' | 'helper';

export interface Permission {
  resource: string;
  action: string;
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  user: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'sos', action: 'create' },
    { resource: 'evidence', action: 'create' },
    { resource: 'evidence', action: 'read' },
    { resource: 'contacts', action: 'manage' },
  ],
  helper: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'sos', action: 'create' },
    { resource: 'evidence', action: 'create' },
    { resource: 'evidence', action: 'read' },
    { resource: 'contacts', action: 'manage' },
    { resource: 'help_requests', action: 'read' },
    { resource: 'help_requests', action: 'respond' },
  ],
  moderator: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'sos', action: 'create' },
    { resource: 'evidence', action: 'create' },
    { resource: 'evidence', action: 'read' },
    { resource: 'contacts', action: 'manage' },
    { resource: 'help_requests', action: 'read' },
    { resource: 'help_requests', action: 'respond' },
    { resource: 'reports', action: 'review' },
    { resource: 'users', action: 'view' },
  ],
  admin: [
    { resource: '*', action: '*' }, // Full access
  ],
};

export const hasPermission = (userRole: UserRole, resource: string, action: string): boolean => {
  const permissions = rolePermissions[userRole] || [];

  // Admin has all permissions
  if (userRole === 'admin') {
    return true;
  }

  return permissions.some(
    perm => (perm.resource === resource || perm.resource === '*') &&
      (perm.action === action || perm.action === '*')
  );
};

