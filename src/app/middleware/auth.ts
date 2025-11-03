/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/middleware/auth.ts
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';


import { StatusCodes } from 'http-status-codes';

import User from '../modules/user/user.model';
import { UserRole } from '../modules/user/user.interface';
import AppError from '../errors/appError';
import config from '../config';

// Helper: extract token from "Authorization: Bearer <token>" or cookie (optional)
function extractAccessToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && typeof auth === 'string') {
    const parts = auth.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
    return auth; // allow raw token too
  }
  // if you also set cookies for access token, uncomment below:
  // if (req.cookies?.accessToken) return req.cookies.accessToken as string;
  return null;
}

/**
 * Auth middleware
 * - Verifies JWT access token
 * - Ensures user exists & isActive
 * - Optionally enforces role(s)
 * - Attaches minimal user info to req.user
 */
const auth =
  (...requiredRoles: UserRole[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const token = extractAccessToken(req);
      if (!token) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized!');
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        config.jwt_access_secret as string
      ) as JwtPayload & { email?: string; role?: UserRole; id?: string };

      const { email, role } = decoded;
      if (!email || !role) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token payload!');
      }

      // Check user in DB and active
      const user = await User.findOne({ email }).select('_id email role isActive');
      if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'This user is not found!');
      }
      if (!user.isActive) {
        throw new AppError(StatusCodes.UNAUTHORIZED, 'User is not active!');
      }

      // Role guard (if roles were passed)
      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized!');
      }

      // Attach minimal identity on req.user
  (req as any).user = {
  id: user.id,            // <-- _id নয়, id (string virtual)
  email: user.email,
  role: user.role,
};

      return next();
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        return next(
          new AppError(
            StatusCodes.UNAUTHORIZED,
            'Token has expired! Please login again.'
          )
        );
      }
      if (err instanceof AppError) return next(err);
      return next(new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token!'));
    }
  };

export default auth;
