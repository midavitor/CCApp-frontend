/**
 * Utilidades de validación y sanitización mejoradas
 */

export class ValidationUtils {
  
  /**
   * Validación avanzada de números telefónicos
   */
  static validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return {
        valid: false,
        error: 'EMPTY_NUMBER',
        message: 'El número de teléfono es requerido'
      };
    }

    // Limpiar número
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Validaciones específicas
    const validations = [
      {
        test: () => cleaned.length === 0,
        error: 'EMPTY_CLEANED',
        message: 'Número inválido después de limpiar'
      },
      {
        test: () => cleaned.length < 8,
        error: 'TOO_SHORT',
        message: 'Número demasiado corto (mínimo 8 dígitos)'
      },
      {
        test: () => cleaned.length > 16,
        error: 'TOO_LONG',
        message: 'Número demasiado largo (máximo 15 dígitos + código)'
      },
      {
        test: () => !cleaned.startsWith('+') && cleaned.length !== 10,
        error: 'INVALID_DOMESTIC',
        message: 'Número nacional debe tener 10 dígitos'
      },
      {
        test: () => cleaned.startsWith('+') && !/^\+[1-9]\d{7,14}$/.test(cleaned),
        error: 'INVALID_INTERNATIONAL',
        message: 'Formato internacional inválido'
      }
    ];

    // Ejecutar validaciones
    for (const validation of validations) {
      if (validation.test()) {
        return {
          valid: false,
          error: validation.error,
          message: validation.message
        };
      }
    }

    // Normalizar número
    let normalizedNumber = cleaned;
    if (!normalizedNumber.startsWith('+')) {
      // Asumir Colombia si no tiene código de país
      normalizedNumber = '+57' + normalizedNumber;
    }

    return {
      valid: true,
      originalNumber: phoneNumber,
      cleanedNumber: cleaned,
      normalizedNumber: normalizedNumber,
      countryCode: this.extractCountryCode(normalizedNumber),
      isInternational: normalizedNumber !== '+57' + cleaned.slice(cleaned.startsWith('+57') ? 3 : 0)
    };
  }

  /**
   * Extraer código de país
   */
  static extractCountryCode(number) {
    if (!number.startsWith('+')) return null;
    
    const countryCodeMap = {
      '+1': 'US/CA',
      '+57': 'CO',
      '+52': 'MX',
      '+34': 'ES',
      '+44': 'UK'
    };

    for (const [code, country] of Object.entries(countryCodeMap)) {
      if (number.startsWith(code)) {
        return { code, country };
      }
    }

    return { code: number.substring(0, 3), country: 'UNKNOWN' };
  }

  /**
   * Sanitizar entrada de texto
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remover caracteres peligrosos
      .substring(0, 100); // Limitar longitud
  }

  /**
   * Validar email
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(email);
    
    return {
      valid,
      message: valid ? 'Email válido' : 'Formato de email inválido'
    };
  }

  /**
   * Validar contraseña
   */
  static validatePassword(password) {
    const validations = [
      {
        test: password.length >= 8,
        message: 'Mínimo 8 caracteres'
      },
      {
        test: /[A-Z]/.test(password),
        message: 'Al menos una mayúscula'
      },
      {
        test: /[a-z]/.test(password),
        message: 'Al menos una minúscula'
      },
      {
        test: /\d/.test(password),
        message: 'Al menos un número'
      }
    ];

    const failedValidations = validations.filter(v => !v.test);
    
    return {
      valid: failedValidations.length === 0,
      strength: this.calculatePasswordStrength(password),
      errors: failedValidations.map(v => v.message)
    };
  }

  /**
   * Calcular fortaleza de contraseña
   */
  static calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    
    if (score < 30) return 'weak';
    if (score < 60) return 'medium';
    if (score < 90) return 'strong';
    return 'very_strong';
  }
}

export default ValidationUtils;
