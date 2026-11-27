import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { AddMoneyDto, WithdrawDto, SetPinDto } from './dto/wallet.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ArcjetFinancial, ArcjetPin } from '../arcjet/arcjet.decorators';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet details and balance' })
  async getWallet(@CurrentUser('id') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance and recent transactions' })
  async getBalance(@CurrentUser('id') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Post('add-money')
  @ArcjetFinancial()
  @ApiOperation({ summary: 'Add money to wallet from bank account' })
  async addMoney(
    @CurrentUser('id') userId: string,
    @Body() dto: AddMoneyDto,
  ) {
    return this.walletService.addMoney(userId, dto);
  }

  @Post('withdraw')
  @ArcjetFinancial()
  @ApiOperation({ summary: 'Withdraw money from wallet to bank account' })
  async withdraw(
    @CurrentUser('id') userId: string,
    @Body() dto: WithdrawDto,
  ) {
    return this.walletService.withdraw(userId, dto);
  }

  @Post('set-pin')
  @ArcjetPin()
  @ApiOperation({ summary: 'Create or update 6-digit payment PIN' })
  async setPin(
    @CurrentUser('id') userId: string,
    @Body() dto: SetPinDto,
  ) {
    return this.walletService.setPin(userId, dto);
  }
}
