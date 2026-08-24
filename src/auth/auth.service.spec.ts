jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { AuthService } from './auth.service';

const hashPassword = (password: string) =>
  crypto.createHash('sha256').update(password).digest('hex');

describe('AuthService', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const jwtServiceMock = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  };

  const supabaseServiceMock = {
    client: {
      auth: {
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    },
  };

  const service = new AuthService(
    prismaMock as any,
    jwtServiceMock as any,
    supabaseServiceMock as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject invalid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'user@example.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return a JWT when credentials are valid', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
      passwordHash: hashPassword('StrongPass!123'),
    });

    const result = await service.login({
      email: 'user@example.com',
      password: 'StrongPass!123',
    });

    expect(result.access_token).toBe('mocked-jwt-token');
    expect(result.user.email).toBe('user@example.com');
    expect(jwtServiceMock.sign).toHaveBeenCalledWith({
      sub: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
    });
  });
});
