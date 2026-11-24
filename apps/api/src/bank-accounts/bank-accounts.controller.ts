import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/bank-account.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('bank-accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all linked bank accounts for current user' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.bankAccountsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific bank account' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bankAccountsService.findOne(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Link a new bank account' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.bankAccountsService.create(userId, dto);
  }

  @Patch(':id/primary')
  @ApiOperation({ summary: 'Set bank account as primary' })
  async setPrimary(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bankAccountsService.setPrimary(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Unlink/remove a bank account' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bankAccountsService.remove(userId, id);
  }
}
