import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

export type UnencryptedPassword = string;

@ValidatorConstraint({ name: 'unencryptedPasswordValidator', async: true })
@Injectable()
export class UnencryptedPasswordValidator implements ValidatorConstraintInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validate(val: UnencryptedPassword, args: ValidationArguments) {
    if (!val) return false;
    return this.isValidPassword(val);
  }

  isValidPassword(passwordToValidate: string): boolean {
    if (!passwordToValidate) return false;
    if (passwordToValidate.length < 6 && passwordToValidate.length > 32) return false;
    const strongRegExp = /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
    if (!strongRegExp.test(passwordToValidate)) return false;
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(args: ValidationArguments) {
    return `Password is not complex enough`;
  }
}
