import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { SendMoneyDto, GetHistoryDto } from './dto/payments.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ArcjetFinancial } from '../arcjet/arcjet.decorators';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('send')
  @ArcjetFinancial()
  @ApiOperation({ summary: 'Send money to another user by phone number' })
  async sendMoney(
    @CurrentUser('id') userId: string,
    @Body() dto: SendMoneyDto,
  ) {
    return this.paymentsService.sendMoney(userId, dto);
  }

  @Get('recipients')
  @ApiOperation({ summary: 'Get list of potential recipients from database' })
  async getRecipients(
    @CurrentUser('id') userId: string,
    @Query('query') query?: string,
  ) {
    return this.paymentsService.getRecipients(userId, query);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get paginated transaction history' })
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query() dto: GetHistoryDto,
  ) {
    return this.paymentsService.getHistory(userId, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get paginated transactions list (alias)' })
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query() dto: GetHistoryDto,
  ) {
    return this.paymentsService.getHistory(userId, dto);
  }

  @Get('lookup/:phone')
  @ApiOperation({ summary: 'Lookup recipient user by phone number' })
  async lookupUser(@Param('phone') phone: string) {
    return this.paymentsService.lookupUser(phone);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single transaction details' })
  async getTransaction(
    @CurrentUser('id') userId: string,
    @Param('id') txnId: string,
  ) {
    return this.paymentsService.getTransaction(userId, txnId);
  }
}
