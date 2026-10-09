// __tests__/utils/antiSpam.test.ts
import {
  isDisposableEmail,
  validateRegistrationAntiSpam,
} from '../../src/utils/antiSpam';

// ─── isDisposableEmail ───────────────────────────────────────────────────────

describe('isDisposableEmail', () => {
  it('returns true for known disposable domains', () => {
    expect(isDisposableEmail('user@mailinator.com')).toBe(true);
    expect(isDisposableEmail('test@tempmail.com')).toBe(true);
    expect(isDisposableEmail('hello@yopmail.com')).toBe(true);
    expect(isDisposableEmail('foo@10minutemail.com')).toBe(true);
    expect(isDisposableEmail('bar@guerrillamail.com')).toBe(true);
    expect(isDisposableEmail('me@burnermail.io')).toBe(true);
  });

  it('returns false for legitimate email providers', () => {
    expect(isDisposableEmail('user@gmail.com')).toBe(false);
    expect(isDisposableEmail('user@outlook.com')).toBe(false);
    expect(isDisposableEmail('user@icloud.com')).toBe(false);
    expect(isDisposableEmail('user@proton.me')).toBe(false);
    expect(isDisposableEmail('user@company.co.in')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isDisposableEmail('')).toBe(false);
  });

  it('returns false when there is no @ sign', () => {
    expect(isDisposableEmail('nodomain')).toBe(false);
  });

  it('is case-insensitive for the domain', () => {
    expect(isDisposableEmail('user@MAILINATOR.COM')).toBe(true);
    expect(isDisposableEmail('user@YoPmail.CoM')).toBe(true);
  });
});

// ─── validateRegistrationAntiSpam ────────────────────────────────────────────

describe('validateRegistrationAntiSpam', () => {
  const validEmail = 'user@gmail.com';
  const validName = 'Alice';
  const validPassword = 'securepass';

  it('returns valid=true for good credentials', () => {
    const result = validateRegistrationAntiSpam(
      validEmail,
      validName,
      validPassword,
    );
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects invalid email format', () => {
    const result = validateRegistrationAntiSpam(
      'notanemail',
      validName,
      validPassword,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('valid email');
  });

  it('rejects disposable email domains', () => {
    const result = validateRegistrationAntiSpam(
      'user@mailinator.com',
      validName,
      validPassword,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('disposable');
  });

  it('rejects name shorter than 2 characters', () => {
    const result = validateRegistrationAntiSpam(validEmail, 'A', validPassword);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('2 characters');
  });

  it('rejects name longer than 70 characters', () => {
    const longName = 'A'.repeat(71);
    const result = validateRegistrationAntiSpam(
      validEmail,
      longName,
      validPassword,
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('70 characters');
  });

  it('rejects passwords shorter than 6 characters', () => {
    const result = validateRegistrationAntiSpam(validEmail, validName, 'abc');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('6 characters');
  });

  it('trims whitespace from email and name before validation', () => {
    const result = validateRegistrationAntiSpam(
      '  user@gmail.com  ',
      '  Alice  ',
      validPassword,
    );
    expect(result.valid).toBe(true);
  });

  it('accepts a name exactly 2 characters long', () => {
    const result = validateRegistrationAntiSpam(
      validEmail,
      'Al',
      validPassword,
    );
    expect(result.valid).toBe(true);
  });

  it('accepts a name exactly 70 characters long', () => {
    const name70 = 'A'.repeat(70);
    const result = validateRegistrationAntiSpam(
      validEmail,
      name70,
      validPassword,
    );
    expect(result.valid).toBe(true);
  });

  it('accepts a password exactly 6 characters long', () => {
    const result = validateRegistrationAntiSpam(
      validEmail,
      validName,
      'abc123',
    );
    expect(result.valid).toBe(true);
  });
});
