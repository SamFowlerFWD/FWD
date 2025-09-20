// Input validation and sanitization utilities

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  sanitize?: (value: any) => any;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export class ValidationError extends Error {
  constructor(public field: string, public message: string) {
    super(`Validation error on field '${field}': ${message}`);
    this.name = 'ValidationError';
  }
}

// Sanitize string input
export function sanitizeString(input: string, maxLength: number = 10000): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(input: string): string {
  const htmlEntities: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  
  return String(input).replace(/[&<>"'\/]/g, (s) => htmlEntities[s]);
}

// Validate a single value against a rule
export function validateValue(value: any, rule: ValidationRule, fieldName: string): any {
  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    throw new ValidationError(fieldName, 'This field is required');
  }
  
  // If not required and empty, return early
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return value;
  }
  
  // Type checking
  if (rule.type) {
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rule.type) {
      throw new ValidationError(fieldName, `Expected ${rule.type}, got ${actualType}`);
    }
  }
  
  // String validations
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      throw new ValidationError(fieldName, `Minimum length is ${rule.minLength}`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      throw new ValidationError(fieldName, `Maximum length is ${rule.maxLength}`);
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      throw new ValidationError(fieldName, 'Invalid format');
    }
  }
  
  // Number validations
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      throw new ValidationError(fieldName, `Minimum value is ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      throw new ValidationError(fieldName, `Maximum value is ${rule.max}`);
    }
  }
  
  // Array validations
  if (Array.isArray(value)) {
    if (rule.minLength && value.length < rule.minLength) {
      throw new ValidationError(fieldName, `Minimum ${rule.minLength} items required`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      throw new ValidationError(fieldName, `Maximum ${rule.maxLength} items allowed`);
    }
  }
  
  // Enum validation
  if (rule.enum && !rule.enum.includes(value)) {
    throw new ValidationError(fieldName, `Must be one of: ${rule.enum.join(', ')}`);
  }
  
  // Apply sanitization if provided
  if (rule.sanitize) {
    return rule.sanitize(value);
  }
  
  return value;
}

// Validate an object against a schema
export function validateInput(input: any, schema: ValidationSchema): Record<string, any> {
  const validated: Record<string, any> = {};
  const errors: ValidationError[] = [];
  
  for (const [field, rule] of Object.entries(schema)) {
    try {
      validated[field] = validateValue(input[field], rule, field);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      } else {
        throw error;
      }
    }
  }
  
  if (errors.length > 0) {
    const errorMessage = errors.map(e => `${e.field}: ${e.message}`).join('; ');
    throw new Error(`Validation failed: ${errorMessage}`);
  }
  
  return validated;
}

// Common validation schemas
export const commonSchemas = {
  fileUpload: {
    file: {
      required: true,
      type: 'object' as const,
    },
    description: {
      required: false,
      type: 'string' as const,
      maxLength: 1000,
      sanitize: sanitizeString,
    },
  },
  
  socialMediaPost: {
    platforms: {
      required: true,
      type: 'array' as const,
      minLength: 1,
      maxLength: 4,
    },
    postType: {
      required: true,
      type: 'string' as const,
      enum: ['Product Launch', 'Company Update', 'Customer Success', 'Educational Content'],
    },
    topic: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 500,
      sanitize: sanitizeString,
    },
    tone: {
      required: true,
      type: 'string' as const,
      enum: ['professional', 'casual', 'excited'],
    },
  },
};