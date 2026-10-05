
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
export const INDIAN_PHONE_PREFIX_REGEX = /^(\+91[-\s]?)?[6-9]\d{9}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const PIN_REGEX = /^[1-9][0-9]{5}$/;

export function normalizePhone(val?: string | null): string {
  if (!val) return '';
  return String(val)
    .replace(/[\s-]/g, '')
    .replace(/^(\+91|0)/, '');
}

export const normalisePhone = normalizePhone;

export function isValidIndianMobile(
  phone?: string | null,
  allowPrefix = false
): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  if (allowPrefix) {
    return INDIAN_PHONE_PREFIX_REGEX.test(trimmed);
  }
  const clean = normalizePhone(trimmed);
  return INDIAN_MOBILE_REGEX.test(clean);
}

export function isValidPan(pan?: string | null): boolean {
  if (!pan) return false;
  const clean = pan.trim().toUpperCase();
  return PAN_REGEX.test(clean);
}

export function isValidGstin(gstin?: string | null): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  return GSTIN_REGEX.test(clean);
}

export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isNonEmptyString(val?: unknown, minLength = 1): boolean {
  if (typeof val !== 'string') return false;
  return val.trim().length >= minLength;
}

export function isPositiveNumber(val?: unknown): boolean {
  if (typeof val === 'number') {
    return !isNaN(val) && isFinite(val) && val > 0;
  }
  if (typeof val === 'string' && val.trim().length > 0) {
    const num = Number(val);
    return !isNaN(num) && isFinite(num) && num > 0;
  }
  return false;
}

export function isValidFileExtension(
  fileName?: string | null,
  allowedExtensions: string[] = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
): boolean {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

export function isValidFileSize(
  fileSizeBytes?: number | null,
  maxBytes: number = 10 * 1024 * 1024
): boolean {
  if (fileSizeBytes === null || fileSizeBytes === undefined || isNaN(fileSizeBytes)) {
    return false;
  }
  return fileSizeBytes > 0 && fileSizeBytes <= maxBytes;
}
