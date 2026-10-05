// src/utils/antiSpam.ts
// Anti-spam and fraud prevention utilities for user registration and authentication

/**
 * Common disposable / temporary email domains frequently used by automated spam bots.
 */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'yopmail.com',
  'yopmail.net',
  'trashmail.com',
  'throwawaymail.com',
  'sharklasers.com',
  'fakeinbox.com',
  'dispostable.com',
  'getairmail.com',
  'mohmal.com',
  'crazymailing.com',
  'tempail.com',
  'burnermail.io',
  'generator.email',
  'inboxkitten.com',
  'tempinbox.com',
  'fakemailgenerator.com',
  'emailondeck.com',
]);

/**
 * Returns true if the email address belongs to a known temporary/disposable burner service.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.trim().split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

/**
 * Validates registration data against spam, weak credentials, and disposable emails.
 */
export function validateRegistrationAntiSpam(
  email: string,
  name: string,
  password: string,
): { valid: boolean; error?: string } {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  // Basic email pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  // Reject disposable burner domains
  if (isDisposableEmail(trimmedEmail)) {
    return {
      valid: false,
      error:
        'Temporary or disposable email addresses are not allowed. Please use a genuine email provider (e.g. Gmail, Outlook, iCloud, Proton).',
    };
  }

  // Name validation
  if (trimmedName.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long.' };
  }
  if (trimmedName.length > 70) {
    return { valid: false, error: 'Name cannot exceed 70 characters.' };
  }

  // Password strength
  if (password.length < 6) {
    return {
      valid: false,
      error: 'Password must be at least 6 characters long.',
    };
  }

  return { valid: true };
}
