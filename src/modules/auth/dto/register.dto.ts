import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'peter.novak@firma.sk', description: 'Firemný email' })
  @IsEmail({}, { message: 'Neplatný formát emailu' })
  email: string;

  @ApiProperty({ example: 'Heslo123!', description: 'Bezpečné heslo (min. 8 znakov)' })
  @IsString()
  @MinLength(8, { message: 'Heslo musí mať aspoň 8 znakov' })
  password: string;

  @ApiProperty({ example: 'Peter Novák', description: 'Celé meno používateľa' })
  @IsString()
  @IsNotEmpty({ message: 'Meno je povinné' })
  fullName: string;

  @ApiProperty({ enum: UserRole, default: UserRole.TESTER, required: false })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Neplatná rola používateľa' })
  role?: UserRole;

  @ApiProperty({ example: 'peter.novak@teams.local', required: false })
  @IsOptional()
  @IsString()
  teamsUserId?: string;
}
