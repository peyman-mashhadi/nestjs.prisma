import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { PrismaService } from '../prisma.services';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'JWT_SECRET',
          signOptions: {
            expiresIn: '1year',
            algorithm: 'HS256',
          },
        }),
      ],
      providers: [UserService, PrismaService, JwtStrategy, ConfigService],
    }).compile();
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });
});
