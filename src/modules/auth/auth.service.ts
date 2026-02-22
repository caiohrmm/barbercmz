import bcrypt from 'bcrypt';
import { User } from '../users/user.model';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../../utils/jwt';
import { JWTPayload } from '../../middlewares/auth.middleware';
import { UnauthorizedError } from '../../utils/errors';
import logger from '../../utils/logger';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'barber';
    barbershopId: string;
  };
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResult> {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.active) {
      throw new UnauthorizedError('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user._id.toString(),
      barbershopId: user.barbershopId.toString(),
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    logger.info({ userId: user._id, email: user.email }, 'User logged in');

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        barbershopId: user.barbershopId.toString(),
      },
      refreshToken, // Will be set as cookie by controller
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = verifyToken(refreshToken) as JWTPayload;

      // Check if user still exists and is active
      const user = await User.findById(payload.userId);

      if (!user || !user.active) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Verify barbershopId matches
      if (user.barbershopId.toString() !== payload.barbershopId) {
        throw new UnauthorizedError('Invalid token');
      }

      // Generate new access token
      const newPayload: JWTPayload = {
        userId: user._id.toString(),
        barbershopId: user.barbershopId.toString(),
        role: user.role,
        email: user.email,
      };

      const accessToken = generateAccessToken(newPayload);

      logger.info({ userId: user._id }, 'Token refreshed');

      return { accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(): Promise<void> {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token. We could implement token blacklisting here
    // if needed in the future.
    logger.info('User logged out');
  }
}

export const authService = new AuthService();

