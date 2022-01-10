import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../user/user.service';
import { isJwtTokenUser } from '../types/jwtTokenUser';
import { User } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly userService: UserService, private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload): Promise<User> {
    if (isJwtTokenUser(payload)) {
      const user = await this.userService.findValidUser({ id: payload.id });
      if (user) {
        return user;
      }
    }
    throw new UnauthorizedException();
  }
}
