import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { LANGUAGE_CODES } from '../shared';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;

  @IsOptional()
  @IsIn(LANGUAGE_CODES)
  preferredLanguage?: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit number' })
  code!: string;
}

export class ResendOtpDto {
  @IsEmail()
  email!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(LANGUAGE_CODES)
  preferredLanguage?: string;
}

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  legalName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradingName?: string;

  @IsString()
  @IsNotEmpty()
  businessType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  industry?: string;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  @Type(() => Number)
  yearEstablished?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  tin?: string;

  @IsOptional()
  @IsIn(LANGUAGE_CODES)
  preferredLanguage?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tradingName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  tin?: string;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  @Type(() => Number)
  yearEstablished?: number;

  @IsOptional()
  @IsIn(LANGUAGE_CODES)
  preferredLanguage?: string;
}