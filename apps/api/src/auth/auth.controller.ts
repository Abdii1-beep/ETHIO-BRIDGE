import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LogoutDto,
  RefreshDto,
  RegisterDto,
  ResendOtpDto,
  UpdateProfileDto,
  VerifyOtpDto,
} from './auth.dto';
import { CurrentUser, JwtUser, Public } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyEmail(dto);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.auth.resendOtp(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: LogoutDto) {
    return this.auth.logout(dto);
  }

  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return this.auth.me(user.sub);
  }

  @Put('me')
  updateProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.sub, dto);
  }
}