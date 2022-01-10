import { IsString, IsOptional, IsEmail, IsNumber, IsBoolean, Validate } from 'class-validator';
import { UnencryptedPasswordValidator } from '../../common/validators/unencrypted-password-validator';

export class UpdateUserDto {
  @IsNumber()
  id: number;
  @IsOptional()
  @IsEmail()
  email?: string;
  @IsOptional()
  @IsString()
  // @MinLength(6)
  // @MaxLength(32)
  // @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
  //   message:
  //     'Password should contain at least 1 upper case letter, 1 lower case letter and 1 number or special character',
  // })
  @Validate(UnencryptedPasswordValidator, {
    message:
      'Password should contain at least 1 upper case letter, 1 lower case letter and 1 number or special character',
  })
  password?: string;
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsBoolean()
  email_confirmed?: boolean;
}
