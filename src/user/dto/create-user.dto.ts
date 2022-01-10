import { IsString, IsOptional, IsEmail, MinLength, MaxLength, Matches, Validate } from 'class-validator';
import { UnencryptedPasswordValidator } from '../../common/validators/unencrypted-password-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;
  @IsString()
  // @MinLength(8)
  // @MaxLength(32)
  // @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
  //   message:
  //     'Password should contain at least 1 upper case letter, 1 lower case letter and 1 number or special character',
  // })
  @Validate(UnencryptedPasswordValidator, {
    message:
      'Password should contain at least 1 upper case letter, 1 lower case letter and 1 number or special character',
  })
  password: string;
  @IsOptional()
  @IsString()
  name?: string;
}
