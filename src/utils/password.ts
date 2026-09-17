export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasDigitOrSymbol: boolean;
  error?: string;
}

/**
 * Validates password complexity:
 * - At least 6 characters
 * - Mandatory uppercase letter (Latin or Cyrillic)
 * - Mandatory lowercase letter (Latin or Cyrillic)
 * - Mandatory digit or special symbol
 */
export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const pwd = password || '';
  const hasMinLength = pwd.length >= 6;
  const hasUpper = /[A-ZА-ЯЁ]/.test(pwd);
  const hasLower = /[a-zа-яё]/.test(pwd);
  const hasDigitOrSymbol = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`№]/.test(pwd);

  const isValid = hasMinLength && hasUpper && hasLower && hasDigitOrSymbol;
  let error: string | undefined;

  if (!isValid) {
    error = 'Пароль должен состоять как минимум из 6 символов и состоять из обязательной заглавной буквы, строчной буквы и цифры или символа';
  }

  return {
    isValid,
    hasMinLength,
    hasUpper,
    hasLower,
    hasDigitOrSymbol,
    error
  };
}
