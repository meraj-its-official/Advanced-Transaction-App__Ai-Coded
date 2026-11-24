import { IsNumber, IsString, IsPositive, Min, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMoneyDto {
  @ApiProperty({ example: 1000, description: 'Amount in INR' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'HDFC_BANK', description: 'Bank account ID or identifier' })
  @IsString()
  bankAccountId: string;
}

export class WithdrawDto {
  @ApiProperty({ example: 500, description: 'Amount in INR' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'HDFC_BANK' })
  @IsString()
  bankAccountId: string;

  @ApiProperty({ example: '123456', description: '6-digit wallet PIN' })
  @IsString()
  @MinLength(4)
  pin: string;
}

export class SetPinDto {
  @ApiProperty({ example: '123456', description: '6-digit payment PIN' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' })
  pin: string;

  @ApiPropertyOptional({ example: 'SecurePassword123!', description: 'Current password for verification' })
  @IsString()
  @IsOptional()
  password?: string;
}

