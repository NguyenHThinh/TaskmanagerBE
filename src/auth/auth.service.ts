import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { UserDocument } from '../users/schemas/user.schema';

type AuthenticatedUser = {
    id: string;
    username: string;
    email: string;
    roles: Role[];
};

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    private getAccessSecret(): string {
        return this.configService.get<string>('JWT_SECRET') || 'defaultSecret';
    }

    private getRefreshSecret(): string {
        return this.configService.get<string>('JWT_REFRESH_SECRET') || this.getAccessSecret();
    }

    private sanitizeUser(user: UserDocument): AuthenticatedUser {
        return {
            id: String(user._id),
            username: user.username,
            email: user.email,
            roles: user.roles,
        };
    }

    private async createTokens(user: AuthenticatedUser): Promise<{ accessToken: string; refreshToken: string }> {
        const payload = { username: user.username, sub: user.id, roles: user.roles };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.getAccessSecret(),
                expiresIn: '60m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.getRefreshSecret(),
                expiresIn: '7d',
            }),
        ]);

        return { accessToken, refreshToken };
    }

    async validateUser(email: string, pass: string): Promise<AuthenticatedUser | null> {
        const user = await this.usersService.findByEmail(email);
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            return this.sanitizeUser(user);
        }
        return null;
    }

    async login(user: AuthenticatedUser): Promise<{ accessToken: string; refreshToken: string }> {
        const tokens = await this.createTokens(user);
        const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
        await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);
        return tokens;
    }

    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        let payload: { sub: string };

        try {
            payload = await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
                secret: this.getRefreshSecret(),
            });
        } catch {
            throw new UnauthorizedException('Refresh token không hợp lệ');
        }

        const user = await this.usersService.findById(payload.sub);
        if (!user?.refreshTokenHash) {
            throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
        }

        const isRefreshTokenMatched = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!isRefreshTokenMatched) {
            throw new UnauthorizedException('Refresh token không hợp lệ');
        }

        const sanitizedUser = this.sanitizeUser(user);
        const nextTokens = await this.createTokens(sanitizedUser);
        const nextRefreshTokenHash = await bcrypt.hash(nextTokens.refreshToken, 10);
        await this.usersService.updateRefreshTokenHash(sanitizedUser.id, nextRefreshTokenHash);

        return nextTokens;
    }

    async register(user: { username: string; email: string; password: string; roles?: Role[] }): Promise<AuthenticatedUser> {
        const createdUser = await this.usersService.create(user);
        return this.sanitizeUser(createdUser);
    }
}
