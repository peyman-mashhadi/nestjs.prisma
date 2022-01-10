import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class DeleteUserDto {
  @IsNumber()
  id: number;
  @IsBoolean()
  @IsOptional()
  hard_delete?: boolean;
}
