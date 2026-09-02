import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@rits-workbench.local' })
  @IsEmail({}, { message: 'Neplatný formát emailu' })
  email: string;

  @ApiProperty({ example: 'AdminPassword123!' })
  @IsString()
  @IsNotEmpty({ message: 'Heslo je povinné' })
  password: string;
}
