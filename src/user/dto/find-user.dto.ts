import { IsOptional, IsString } from 'class-validator';

// There should be a better approach to define the query params with their real type,
// instead of getting them as string and then parse them.
// I've tried @type and @transform. but still I had some problem. I need to dig in it, and find better apprach.
export class FindUserDto {
  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  offset?: string;

  @IsOptional()
  @IsString()
  updatedSince?: string;

  @IsOptional()
  @IsString()
  ids?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  includeCredentials?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
