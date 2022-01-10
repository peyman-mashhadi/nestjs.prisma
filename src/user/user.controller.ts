import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  HttpCode,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticateUserDto } from './dto/authenticate-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EndpointIsPublic } from '../common/decorators/publicEndpoint.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  async find(@Query() findUserDto: FindUserDto, @Req() req: Request): Promise<User[]> {
    const { user } = req;
    const users = await this.usersService.find(findUserDto, user);
    return users;
  }

  @Get(':id')
  async findUnique(@Param('id', ParseIntPipe) id, @Req() req: Request): Promise<User> {
    const user: Partial<User> = req.user;
    return this.usersService.findUnique({ id }, user);
  }

  @EndpointIsPublic()
  @HttpCode(HttpStatus.OK)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Patch()
  async update(@Body() updateUserDto: UpdateUserDto, @Req() req: Request): Promise<User> {
    const user: Partial<User> = req.user;
    return this.usersService.update(updateUserDto, user);
  }

  @Delete()
  async delete(@Body() deleteUserDto: DeleteUserDto, @Req() req: Request): Promise<User> {
    const user: Partial<User> = req.user;
    return this.usersService.delete(deleteUserDto, user);
  }

  @EndpointIsPublic()
  @HttpCode(HttpStatus.OK)
  @Post('validate')
  async userValidateToken(@Req() req: Request) {
    return this.usersService.validateToken(req.headers.authorization.split(' ')[1]);
  }

  @EndpointIsPublic()
  @HttpCode(HttpStatus.OK)
  @Post('authenticate')
  async userAuthenticate(@Body() authenticateUserDto: AuthenticateUserDto): Promise<boolean> {
    return this.usersService.authenticate(authenticateUserDto);
  }

  @EndpointIsPublic()
  @HttpCode(HttpStatus.OK)
  @Post('token')
  async userGetToken(@Body() authenticateUserDto: AuthenticateUserDto): Promise<{ token: string }> {
    return this.usersService.authenticateAndGetJwtToken(authenticateUserDto);
  }
}
