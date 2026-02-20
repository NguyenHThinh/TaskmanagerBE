import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const parseCookieValue = (
  cookieHeader: string | undefined,
  key: string,
): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const cookiePair = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${key}=`));

  if (!cookiePair) {
    return null;
  }

  return decodeURIComponent(cookiePair.substring(key.length + 1));
};

const setRefreshCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: '/',
  });
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const tokens = await this.authService.login(user);
    setRefreshCookie(res, tokens.refreshToken);

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: { accessToken: tokens.accessToken },
    };
  }

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<
    ApiResponse<{ user: Awaited<ReturnType<AuthService['register']>> }>
  > {
    const user = await this.authService.register(createUserDto);
    return {
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: { user },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<{ accessToken: string }>> {
    const refreshToken = parseCookieValue(
      req.headers.cookie,
      REFRESH_COOKIE_NAME,
    );
    if (!refreshToken) {
      throw new UnauthorizedException('Thiếu refresh token');
    }

    const tokens = await this.authService.refreshAccessToken(refreshToken);
    setRefreshCookie(res, tokens.refreshToken);

    return {
      success: true,
      message: 'Làm mới access token thành công',
      data: { accessToken: tokens.accessToken },
    };
  }
}
