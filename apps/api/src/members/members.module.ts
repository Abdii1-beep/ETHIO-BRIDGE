import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { buildOtpTransportAsync, OTP_TRANSPORT } from '../auth/otp-transport';

@Module({
  controllers: [MembersController],
  providers: [
    MembersService,
    {
      provide: OTP_TRANSPORT,
      useFactory: (config: ConfigService) => buildOtpTransportAsync(config),
      inject: [ConfigService],
    },
  ],
})
export class MembersModule {}