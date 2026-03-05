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
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'none', // Cần 'none' để gửi cookie khi FE và BE khác domain (cross-origin)
    secure: true, // Bắt buộc khi sameSite='none'
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
  ): Promise<ApiResponse<{ accessToken: string; projects: any[] }>> {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const result = await this.authService.loginWithProjects(user);
    setRefreshCookie(res, result.refreshToken);

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: { accessToken: result.accessToken, projects: result.projects },
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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<void>> {
    const refreshToken = parseCookieValue(
      req.headers.cookie,
      REFRESH_COOKIE_NAME,
    );
    if (!refreshToken) {
      throw new UnauthorizedException('Thiếu refresh token');
    }
    await this.authService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: '/',
      sameSite: 'none',
      secure: true,
    });
    return {
      success: true,
      message: 'Đăng xuất thành công',
    };
  }
}
