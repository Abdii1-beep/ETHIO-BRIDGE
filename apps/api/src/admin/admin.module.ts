import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { buildOtpTransportAsync, OTP_TRANSPORT } from '../auth/otp-transport';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    {
      provide: OTP_TRANSPORT,
      useFactory: (config: ConfigService) => buildOtpTransportAsync(config),
      inject: [ConfigService],
    },
  ],
})
export class AdminModule {}