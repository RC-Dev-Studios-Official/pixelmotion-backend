import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { GoogleLoginDto } from './dto/google-login.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly supabaseService: SupabaseService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  private googleClient: OAuth2Client;

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || user.passwordHash !== this.hashPassword(dto.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name ?? user.email.split('@')[0],
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: payload.name,
      },
    };
  }

  async register(email: string, password: string, name?: string) {
    const normalizedEmail = email.toLowerCase();
    const finalName = (name ?? normalizedEmail.split('@')[0]).trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const passwordHash = this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: finalName,
        passwordHash,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name ?? finalName,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: payload.name,
      },
    };
  }

  async googleLogin(dto: GoogleLoginDto) {
    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const normalizedEmail = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = payload.name ?? normalizedEmail.split('@')[0];

    // Find user by email or googleId
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { googleId }],
      },
    });

    if (user) {
      // If user exists but doesn't have googleId set, update it
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      }
    } else {
      // Create a new user
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          googleId,
        },
      });
    }

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    return {
      access_token: this.jwtService.sign(jwtPayload),
      user: {
        id: user.id,
        email: user.email,
        name: jwtPayload.name,
      },
    };
  }

  async logout() {
    try {
      const { error } = await this.supabaseService.client.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'User logged out successfully',
      };
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Logout failed',
      );
    }
  }
}
