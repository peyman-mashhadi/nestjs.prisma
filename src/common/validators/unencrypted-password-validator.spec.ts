import { UnencryptedPasswordValidator } from './unencrypted-password-validator';

describe('UnencryptedPasswordValidator', () => {
  const passwordValidator = new UnencryptedPasswordValidator();
  it('should return false if password is weak', () => {
    expect(passwordValidator.isValidPassword('ppp12345')).toBe(false);
  });

  it('should return true if password is strong', () => {
    expect(passwordValidator.isValidPassword('mPmP123@')).toBe(true);
  });
});
