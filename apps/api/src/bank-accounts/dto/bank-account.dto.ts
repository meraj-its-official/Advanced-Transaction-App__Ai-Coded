import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateBankAccountDto {
  @ApiProperty({ example: "123456789012", description: "Bank account number" })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: "HDFC0001234", description: "IFSC Code" })
  @IsString()
  @Length(11, 11)
  ifscCode: string;

  @ApiProperty({ example: "HDFC Bank", description: "Bank name" })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiPropertyOptional({
    example: "John Doe",
    description: "Account holder name",
  })
  @IsString()
  @IsOptional()
  holderName?: string;

  @ApiPropertyOptional({
    example: "John Doe",
    description: "Account holder name (alias)",
  })
  @IsString()
  @IsOptional()
  accountHolderName?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
