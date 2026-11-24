import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'john.doe@example.com or 9876543210',
    description: 'Email address or phone number of the account',
  })
  @IsString()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'john.doe@example.com or 9876543210',
    description: 'Email address or phone number of the account',
  })
  @IsString()
  email: string;

  @ApiProperty({
    example: 'NewSecurePass123!',
    description: 'New password (minimum 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiPropertyOptional({ example: '123456', description: 'OTP verification code' })
  @IsString()
  @IsOptional()
  otp?: string;
}
