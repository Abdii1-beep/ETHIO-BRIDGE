import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { OtpService } from './otp.service';
import { TokensService } from './tokens.service';
import { buildOtpTransportAsync, OTP_TRANSPORT } from './otp-transport';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_ACCESS_TTL') || '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    OtpService,
    TokensService,
    {
      provide: OTP_TRANSPORT,
      useFactory: (config: ConfigService) => buildOtpTransportAsync(config),
      inject: [ConfigService],
    },
  ],
  exports: [TokensService, PasswordService, OtpService, OTP_TRANSPORT, JwtModule],
})
export class AuthModule {}

export { JwtAuthGuard };