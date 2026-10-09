// __tests__/utils/validators.test.ts
import {
  Validator,
  validateField,
  validateForm,
  commonValidations,
} from '../../src/utils/validators/index';

// ─── Validator.email ──────────────────────────────────────────────────────────

describe('Validator.email', () => {
  it('accepts valid email addresses', () => {
    expect(Validator.email('user@example.com')).toBe(true);
    expect(Validator.email('test.user+tag@domain.co.in')).toBe(true);
    expect(Validator.email('a@b.c')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(Validator.email('notanemail')).toBe(false);
    expect(Validator.email('missing@domain')).toBe(false);
    expect(Validator.email('@nodomain.com')).toBe(false);
    expect(Validator.email('spaces @domain.com')).toBe(false);
    expect(Validator.email('')).toBe(false);
  });
});

// ─── Validator.required ──────────────────────────────────────────────────────

describe('Validator.required', () => {
  it('returns true for non-empty strings', () => {
    expect(Validator.required('hello')).toBe(true);
    expect(Validator.required('  a  ')).toBe(true);
  });

  it('returns false for empty or whitespace-only strings', () => {
    expect(Validator.required('')).toBe(false);
    expect(Validator.required('   ')).toBe(false);
  });

  it('returns true for non-null non-undefined values', () => {
    expect(Validator.required(0)).toBe(true);
    expect(Validator.required(false)).toBe(true);
    expect(Validator.required([])).toBe(true);
  });

  it('returns false for null and undefined', () => {
    expect(Validator.required(null)).toBe(false);
    expect(Validator.required(undefined)).toBe(false);
  });
});

// ─── Validator.minLength ─────────────────────────────────────────────────────

describe('Validator.minLength', () => {
  it('returns true when length is at least minLength', () => {
    expect(Validator.minLength('hello', 5)).toBe(true);
    expect(Validator.minLength('hello', 3)).toBe(true);
  });

  it('returns false when length is less than minLength', () => {
    expect(Validator.minLength('hi', 5)).toBe(false);
    expect(Validator.minLength('', 1)).toBe(false);
  });
});

// ─── Validator.maxLength ─────────────────────────────────────────────────────

describe('Validator.maxLength', () => {
  it('returns true when length is at most maxLength', () => {
    expect(Validator.maxLength('hi', 5)).toBe(true);
    expect(Validator.maxLength('hello', 5)).toBe(true);
  });

  it('returns false when length exceeds maxLength', () => {
    expect(Validator.maxLength('hello world', 5)).toBe(false);
  });
});

// ─── Validator.phone ─────────────────────────────────────────────────────────

describe('Validator.phone', () => {
  it('accepts valid phone numbers', () => {
    expect(Validator.phone('9876543210')).toBe(true);
    expect(Validator.phone('+91 98765 43210')).toBe(true);
    expect(Validator.phone('(555) 867-5309')).toBe(true);
  });

  it('rejects short or letter-containing strings', () => {
    expect(Validator.phone('123')).toBe(false);
    expect(Validator.phone('phone')).toBe(false);
  });
});

// ─── Validator.url ───────────────────────────────────────────────────────────

describe('Validator.url', () => {
  it('accepts valid URLs', () => {
    expect(Validator.url('https://example.com')).toBe(true);
    expect(Validator.url('http://sub.domain.co.in/path?q=1')).toBe(true);
  });

  it('rejects invalid URLs', () => {
    expect(Validator.url('not a url')).toBe(false);
    expect(Validator.url('ftp/invalid')).toBe(false);
  });
});

// ─── Validator.password ──────────────────────────────────────────────────────

describe('Validator.password', () => {
  it('accepts strong passwords', () => {
    expect(Validator.password('Password1')).toBe(true);
    expect(Validator.password('Str0ngPass!')).toBe(true);
  });

  it('rejects weak passwords', () => {
    expect(Validator.password('short1A')).toBe(false); // < 8 chars
    expect(Validator.password('alllowercase1')).toBe(false); // no uppercase
    expect(Validator.password('ALLUPPERCASE1')).toBe(false); // no lowercase
    expect(Validator.password('NoNumbers!')).toBe(false); // no digit
  });
});

// ─── Validator.number ────────────────────────────────────────────────────────

describe('Validator.number', () => {
  it('returns true for finite numbers', () => {
    expect(Validator.number(0)).toBe(true);
    expect(Validator.number(3.14)).toBe(true);
    expect(Validator.number('42')).toBe(true);
  });

  it('returns false for NaN and Infinity', () => {
    expect(Validator.number(NaN)).toBe(false);
    expect(Validator.number(Infinity)).toBe(false);
    expect(Validator.number('abc')).toBe(false);
  });
});

// ─── Validator.integer ───────────────────────────────────────────────────────

describe('Validator.integer', () => {
  it('returns true for whole numbers', () => {
    expect(Validator.integer(0)).toBe(true);
    expect(Validator.integer(42)).toBe(true);
    expect(Validator.integer(-5)).toBe(true);
  });

  it('returns false for floats and non-numbers', () => {
    expect(Validator.integer(3.14)).toBe(false);
    expect(Validator.integer(NaN)).toBe(false);
  });
});

// ─── Validator.range ─────────────────────────────────────────────────────────

describe('Validator.range', () => {
  it('returns true when within range', () => {
    expect(Validator.range(5, 1, 10)).toBe(true);
    expect(Validator.range(1, 1, 10)).toBe(true);
    expect(Validator.range(10, 1, 10)).toBe(true);
  });

  it('returns false when outside range', () => {
    expect(Validator.range(0, 1, 10)).toBe(false);
    expect(Validator.range(11, 1, 10)).toBe(false);
  });
});

// ─── Validator.match ─────────────────────────────────────────────────────────

describe('Validator.match', () => {
  it('returns true when values are equal', () => {
    expect(Validator.match('abc', 'abc')).toBe(true);
    expect(Validator.match(42, 42)).toBe(true);
  });

  it('returns false when values differ', () => {
    expect(Validator.match('abc', 'def')).toBe(false);
    expect(Validator.match(1, 2)).toBe(false);
  });
});

// ─── validateField ───────────────────────────────────────────────────────────

describe('validateField', () => {
  it('returns null when all rules pass', () => {
    const rules = [
      { validate: (v: string) => v.length > 0, message: 'Required' },
      { validate: (v: string) => v.includes('@'), message: 'Must have @' },
    ];
    expect(validateField('hello@world', rules)).toBeNull();
  });

  it('returns the first failing rule message', () => {
    const rules = [
      { validate: (v: string) => v.length > 0, message: 'Required' },
      { validate: (v: string) => v.includes('@'), message: 'Must have @' },
    ];
    expect(validateField('', rules)).toBe('Required');
    expect(validateField('noemail', rules)).toBe('Must have @');
  });
});

// ─── validateForm ─────────────────────────────────────────────────────────────

describe('validateForm', () => {
  const rules = {
    email: commonValidations.email('Email'),
    password: commonValidations.password('Password'),
  };

  it('returns empty errors object for valid form', () => {
    const values = { email: 'user@example.com', password: 'StrongPass1' };
    const errors = validateForm(values, rules);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('returns errors for each invalid field', () => {
    const values = { email: '', password: 'weak' };
    const errors = validateForm(values, rules);
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  it('returns only the failing field error', () => {
    const values = { email: 'user@example.com', password: 'weak' };
    const errors = validateForm(values, rules);
    expect(errors.email).toBeUndefined();
    expect(errors.password).toBeDefined();
  });
});

// ─── commonValidations ───────────────────────────────────────────────────────

describe('commonValidations.phone', () => {
  const phoneRules = commonValidations.phone('Phone');

  it('fails when phone is empty', () => {
    expect(validateField('', phoneRules)).toBe('Phone is required');
  });

  it('fails when phone is invalid', () => {
    const err = validateField('123', phoneRules);
    expect(err).toContain('valid phone');
  });

  it('passes with a valid phone number', () => {
    expect(validateField('9876543210', phoneRules)).toBeNull();
  });
});
