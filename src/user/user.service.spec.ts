import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { PrismaService } from '../prisma.services';
import { UserService } from './user.service';

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
  });

  afterAll(() => prisma.onModuleDisconnect());

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('getUsers', () => {
    it('Find all the users without filters by admin', async () => {
      const expectation = await prisma.user.findMany();
      const result = await userService.find({}, { id: 1, is_admin: true });
      expect(result).toEqual(expectation);
    });

    it('Find all the users with credentials by admin', async () => {
      const expectation = await prisma.user.findMany({ include: { credentials: true } });
      const result = await userService.find({ includeCredentials: 'true' }, { id: 1, is_admin: true });
      expect(result).toEqual(expectation);
    });

    it('Find all the users with credentials and limit of 1 users by admin', async () => {
      const expectation = await prisma.user.findMany({ include: { credentials: true }, take: 1 });
      const result = await userService.find({ includeCredentials: 'true', limit: '1' }, { id: 1, is_admin: true });
      expect(result).toEqual(expectation);
    });

    it('Find all the users without credentials and (limit=2, skip=1) users by admin', async () => {
      const expectation = await prisma.user.findMany({ take: 2, skip: 1 });
      const result = await userService.find({ limit: '2', offset: '1' }, { id: 1, is_admin: true });
      expect(result).toEqual(expectation);
    });

    it('Find  the users with Id = [1,2,3] with credentials by admin', async () => {
      const expectation = await prisma.user.findMany({
        where: { id: { in: [1, 2, 3] } },
        include: { credentials: true },
      });
      const result = await userService.find({ includeCredentials: 'true', ids: '[1,2,3]' }, { id: 1, is_admin: true });
      expect(result).toEqual(expectation);
    });

    it('Find  the users with Id = [1,2,3] with credentials and name like <peyman> by admin ', async () => {
      const expectation = await prisma.user.findMany({
        where: { id: { in: [1, 2] }, name: { contains: 'pey' } },
        include: { credentials: true },
      });
      const result = await userService.find(
        { includeCredentials: 'true', ids: '[1,2]', name: 'pey' },
        { id: 1, is_admin: true },
      );
      expect(result).toEqual(expectation);
    });

    it('Find all the users without credentials where email = peyman.mashhadi@gmail.com by admin', async () => {
      const expectation = await prisma.user.findMany({
        where: { email: 'peyman.mashhadi@gmail.com' },
      });
      const result = await userService.find({ email: 'peyman.mashhadi@gmail.com' }, { id: 1, is_admin: true });
      expect(result).toEqual(expectation);
    });

    it('Find all the users without filters by user 2', async () => {
      const expectation = await prisma.user.findMany({ where: { id: 2 } });
      const result = await userService.find({}, { id: 2, is_admin: false });
      expect(result).toEqual(expectation);
    });

    it('Find all the users with credentials where email = peyman.mashhadi@gmail.com by admin', async () => {
      const expectation = await prisma.user.findMany({
        where: { email: 'peyman.mashhadi@gmail.com' },
        include: { credentials: true },
      });
      const result = await userService.find(
        { email: 'peyman.mashhadi@gmail.com', includeCredentials: 'true' },
        { id: 1, is_admin: true },
      );
      expect(result).toEqual(expectation);
    });
  });
});
