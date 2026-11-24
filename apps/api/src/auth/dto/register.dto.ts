import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RegisterDto {
  @ApiPropertyOptional({ example: "John Doe" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "John" })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: "Doe" })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: "john.doe@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "+919876543210", minLength: 10, maxLength: 10 })
  @IsPhoneNumber("IN")
  @MinLength(10)
  @MaxLength(10)
  phone: string;

  @ApiProperty({ example: "SecurePass123!", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: "1234", description: "4-digit wallet PIN" })
  @IsString()
  @IsOptional()
  @MinLength(4)
  pin?: string;
}
