import {
  IsString,
  IsNumber,
  IsPositive,
  Min,
  IsOptional,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMoneyDto {
  @ApiProperty({ example: '9876543210', description: 'Recipient phone number' })
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiProperty({ example: 500, description: 'Amount in INR' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'Dinner split' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ example: 'Dinner split' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '1234', description: 'Transaction PIN' })
  @IsString()
  @MinLength(4)
  pin: string;
}

export class GetHistoryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by transaction type' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Search term for name, phone, or reference' })
  @IsString()
  @IsOptional()
  search?: string;
}
