import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { PrismaService } from '../../prisma.services';
import { UserService } from '../user.service';

describe('UserService', () => {
  let userService: UserService;
  let prisma: PrismaService;

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
    prisma = module.get<PrismaService>(PrismaService);

    prisma.user.create = jest.fn().mockReturnValueOnce({
      id: 4,
      name: 'stark',
      email: 'fariba@gmail.com',
      email_confirmed: false,
      is_admin: false,
      credentials_id: 4,
      created_at: new Date(),
      updated_at: null,
    });
  });
  afterAll(() => prisma.onModuleDisconnect());

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('create user', () => {
    it('create a user successfully', async () => {
      const result = await userService.create({ email: 'fariba@gmail.com', password: '23' });
      expect(result).toEqual({
        created_at: expect.any(Date),
        credentials_id: 4,
        email: 'fariba@gmail.com',
        email_confirmed: false,
        id: 4,
        is_admin: false,
        name: 'stark',
        updated_at: null,
      });
    });
  });
});
