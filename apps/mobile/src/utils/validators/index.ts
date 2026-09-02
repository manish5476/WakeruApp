export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule[];
}

export class Validator {
  static email = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  static required = (value: any): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  };

  static minLength = (value: string, length: number): boolean => {
    return value.length >= length;
  };

  static maxLength = (value: string, length: number): boolean => {
    return value.length <= length;
  };

  static pattern = (value: string, pattern: RegExp): boolean => {
    return pattern.test(value);
  };

  static phone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  static url = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  static password = (password: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  };

  static number = (value: any): boolean => {
    return !isNaN(value) && isFinite(value);
  };

  static integer = (value: any): boolean => {
    return Number.isInteger(value);
  };

  static range = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  };

  static match = (value1: any, value2: any): boolean => {
    return value1 === value2;
  };
}

export const createValidationRules = (
  rules: Record<string, ValidationRule[]>,
): ValidationRules => {
  return rules;
};

export const validateField = (
  value: any,
  rules: ValidationRule[],
): string | null => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
};

export const validateForm = (
  values: Record<string, any>,
  rules: ValidationRules,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.entries(rules).forEach(([fieldName, fieldRules]) => {
    const error = validateField(values[fieldName], fieldRules);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return errors;
};

// Common validation rule presets
export const commonValidations = {
  email: (label = 'Email'): ValidationRule[] => [
    {
      validate: v => Validator.required(v),
      message: `${label} is required`,
    },
    {
      validate: v => Validator.email(v),
      message: 'Please enter a valid email',
    },
  ],
  password: (label = 'Password'): ValidationRule[] => [
    {
      validate: v => Validator.required(v),
      message: `${label} is required`,
    },
    {
      validate: v => Validator.minLength(v, 8),
      message: `${label} must be at least 8 characters`,
    },
    {
      validate: v => Validator.password(v),
      message: `${label} must contain uppercase, lowercase, and number`,
    },
  ],
  required: (label = 'Field'): ValidationRule[] => [
    {
      validate: v => Validator.required(v),
      message: `${label} is required`,
    },
  ],
  phone: (label = 'Phone'): ValidationRule[] => [
    {
      validate: v => Validator.required(v),
      message: `${label} is required`,
    },
    {
      validate: v => Validator.phone(v),
      message: 'Please enter a valid phone number',
    },
  ],
};
