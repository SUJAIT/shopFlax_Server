
import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { StatusCodes } from 'http-status-codes';
import AppError from '../errors/appError';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import config from '../config';
 // <-- typo fix
import User from '../modules/user/user.model';
import { IUser, UserRole } from '../modules/user/usre.interface';

// (Better) JWT payload টাইপ — যা আসলে টোকেনে থাকে
interface TokenPayload extends JwtPayload {
  role: UserRole;
  email?: string;
  phone?: string;
  sub?: string; // যদি userId রাখো
}

// Express.Request এ user যোগ (globally রাখলে আলাদা .d.ts এ দাও)
declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}

const auth = (...requiredRoles: UserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const raw = req.headers.authorization;
    if (!raw) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized!');
    }

    // Support: "Bearer <token>"
    const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw;

    try {
      const decoded = jwt.verify(
        token,
        config.jwt_access_secret as string
      ) as TokenPayload;

      const { role, email, phone, sub } = decoded;

      // টোকেনের তথ্য দিয়ে ইউজার খুঁজো (id থাকলে id দিয়ে করা ভাল)
      const user = sub
        ? await User.findById(sub)
        : await User.findOne({
            $or: [{ email }, { phone }],
            role,
            isActive: true,
          });

      if (!user) {
        throw new AppError(
          StatusCodes.UNAUTHORIZED,
          'This user is not authorized!'
        );
      }

      // role গার্ড (model থেকে নাও)
      if (requiredRoles.length && !requiredRoles.includes(user.role)) {
        throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized!');
      }

      // ✅ এখন IUser ডকুমেন্ট অ্যাসাইন করো
      req.user = user;
      next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(
          new AppError(
            StatusCodes.UNAUTHORIZED,
            'Token has expired! Please login again.'
          )
        );
      }
      return next(new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token!'));
    }
  });
};

export default auth;
