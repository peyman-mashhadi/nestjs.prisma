import { Injectable, NotFoundException, UnauthorizedException, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.services';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPassword, matchHashedPassword } from '../common/utils/password';
import { JwtPayload } from '../common/types/jwtTokenUser';
import { WhereConditions } from '../common/types/common';
import { DELETED_USER_NAME } from '../common/utils/constant';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  /**
   * Finds users with matching fields
   *
   * @param findUserDto
   * @returns User[]
   */
  async find(findUserDto: FindUserDto, user: Partial<User>): Promise<User[]> {
    const { limit, offset, updatedSince, ids, name, includeCredentials, email } = findUserDto;
    const where: WhereConditions = {};
    if (user.is_admin) {
      // unnecessary parse, beacuse I couldn't fid a way to send query params with their actual types, and not string
      if (ids) where.id = { in: JSON.parse(ids) };
      if (name) where.name = { contains: name };
      if (updatedSince) where.updated_at = { gte: new Date(updatedSince) };
      if (email) where.email = email;
    } else {
      where.id = user.id;
    }
    const users = await this.prisma.user.findMany({
      where: where,
      include: { credentials: includeCredentials === 'true' ? true : false },
      skip: offset ? Number(offset) : 0,
      take: limit ? Number(limit) : 100,
    });
    return users;
  }

  /**
   * Finds single User by id, name or email
   *
   * @param whereUnique
   * @returns User
   */
  async findUnique(
    whereUnique: Prisma.UserWhereUniqueInput,
    includeCredentials = false,
    user?: Partial<User>,
  ): Promise<User> {
    const { id } = whereUnique;
    if (user.is_admin || user.id === id) {
      return this.prisma.user.findUnique({
        where: { id },
        include: {
          credentials: includeCredentials,
        },
      });
    } else {
      throw new UnauthorizedException('You can not see other users');
    }
  }

  async findValidUser(whereUnique: Prisma.UserWhereUniqueInput, includeCredentials = false): Promise<User> {
    const { id } = whereUnique;
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        credentials: includeCredentials,
      },
    });
  }

  /**
   * Creates a new user with credentials
   *
   * @param createUserDto
   * @returns result of create
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { name, email, password } = createUserDto;
    const hash = await hashPassword(password);
    const user = await this.prisma.user.create({
      data: { email, name, credentials: { create: { hash } } },
    });
    return user;
  }

  /**
   * Updates a user unless it does not exist or has been marked as deleted before
   *
   * @param updateUserDto
   * @returns result of update
   */
  async update(updateUserDto: UpdateUserDto, user: Partial<User>) {
    const { id, password, email, email_confirmed, name } = updateUserDto;
    if (user.is_admin || user.id === id) {
      const existingUser = await this.prisma.user.findUnique({ where: { id: id } });
      if (existingUser && existingUser.name !== DELETED_USER_NAME) {
        const hash = password ? await hashPassword(password) : null;
        return this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            email,
            email_confirmed,
            name,
            updated_at: new Date().toISOString(),
            credentials: hash ? { update: { hash, updated_at: new Date().toISOString() } } : {},
          },
        });
      } else {
        throw new NotFoundException(`User with ID ${id} not found or it has deleted`);
      }
    } else {
      throw new UnauthorizedException('You can not modify other users');
    }
  }

  /**
   * Deletes a user
   * Function does not actually remove the user from database but instead marks them as deleted by:
   * - removing the corresponding `credentials` row from your db
   * - changing the name to DELETED_USER_NAME constant (default: `(deleted)`)
   * - setting email to NULL
   *
   * @param deleteUserDto
   * @returns results of users and credentials table modification
   */

  async delete(deleteUserDto: DeleteUserDto, user: Partial<User>): Promise<User> {
    const { id, hard_delete } = deleteUserDto;
    if (user.is_admin || user.id === id) {
      const existingUser = await this.prisma.user.findUnique({ where: { id } });
      if (user.is_admin && existingUser && hard_delete) {
        return this.prisma.user.delete({ where: { id: existingUser.id } });
      }
      if (existingUser && existingUser.name !== DELETED_USER_NAME) {
        // deletedMany in nested query does not work,
        // I need to find a solution to delete credentials and update user
        const deletedUser = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            email: null,
            name: DELETED_USER_NAME,
            updated_at: new Date().toISOString(),
          },
        });
        // await this.prisma.credentials.delete({ where: { id: existingUser.credentials_id } });
        return deletedUser;
      } else {
        throw new NotFoundException(`User with ID ${id} not found or it has deleted`);
      }
    } else {
      throw new UnauthorizedException('You can not delete other users');
    }
  }

  /**
   * Authenticates a user and returns a JWT token
   *
   * @param authenticateUserDto email and password for authentication
   * @returns a JWT token
   */
  async authenticateAndGetJwtToken(authenticateUserDto: AuthenticateUserDto): Promise<{ token: string }> {
    const { email, password } = authenticateUserDto;
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        credentials: true,
      },
    });
    if (user && (await matchHashedPassword(password, user.credentials.hash))) {
      const payload: JwtPayload = { id: user.id, username: user.email };
      const token: string = await this.jwtService.sign(payload);
      return { token };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
  }

  /**
   * Authenticates a user
   *
   * @param authenticateUserDto email and password for authentication
   * @returns true or false
   */
  async authenticate(authenticateUserDto: AuthenticateUserDto): Promise<boolean> {
    const token: { token: string } = await this.authenticateAndGetJwtToken(authenticateUserDto);
    if (token) return true;
    return false;
  }

  /**
   * Validates a JWT token
   *
   * @param token a JWT token
   * @returns the decoded token if valid
   */
  async validateToken(token: string) {
    return this.jwtService.verify(token);
  }
}
