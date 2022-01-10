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

    prisma.user.findMany = jest.fn().mockReturnValueOnce([
      {
        id: 1,
        name: 'peyman',
        email: 'peyman@gmail.com',
        email_confirmed: true,
        is_admin: true,
        credentials_id: 1,
        created_at: new Date(),
        updated_at: null,
      },
      {
        id: 2,
        name: 'bahram',
        email: 'bahram@gmail.com',
        email_confirmed: true,
        is_admin: false,
        credentials_id: 2,
        created_at: new Date(),
        updated_at: null,
      },
    ]);
  });
  afterAll(() => prisma.onModuleDisconnect());

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('getUsers', () => {
    it('Find all the users without filters by admin', async () => {
      const result = await userService.find({}, {});
      expect(result).toEqual([
        {
          created_at: expect.any(Date),
          credentials_id: 1,
          email: 'peyman@gmail.com',
          email_confirmed: true,
          id: 1,
          is_admin: true,
          name: 'peyman',
          updated_at: null,
        },
        {
          created_at: expect.any(Date),
          credentials_id: 2,
          email: 'bahram@gmail.com',
          email_confirmed: true,
          id: 2,
          is_admin: false,
          name: 'bahram',
          updated_at: null,
        },
      ]);
    });
  });
});
