

/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/modules/auth/auth.service.ts



import { StatusCodes } from 'http-status-codes';

import config from '../../config';
import AppError from '../../errors/appError';

import User from '../user/user.model';
import { IAuth, IJwtPayload } from './auth.interface';
import { createToken, verifyToken } from './auth.utils';
import  mongoose, { Types } from 'mongoose';
import { Secret, SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';


/* ---------------------------- LOGIN ---------------------------- */
const loginUser = async (payload: IAuth) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const user = await User.findOne({ email: payload.email.toLowerCase() })
      .select('+password _id name email role isActive')
      .session(session);

    if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'This user is not found!');
    if (!user.isActive) throw new AppError(StatusCodes.FORBIDDEN, 'This user is not active!');

    const matched = await User.isPasswordMatched(payload.password, user.password!);
    if (!matched) throw new AppError(StatusCodes.FORBIDDEN, 'Password does not match');

    const jwtPayload: IJwtPayload = {
      userId: (user._id as Types.ObjectId).toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      sid: randomUUID(),                    // ✅ correct
      tokenVersion: (user as any).tokenVersion ?? 0,
    };

    const accessExp  = config.jwt_access_expires_in  as SignOptions['expiresIn'];
    const refreshExp = config.jwt_refresh_expires_in as SignOptions['expiresIn'];

    const accessToken  = createToken(jwtPayload, config.jwt_access_secret  as Secret, accessExp);
    const refreshToken = createToken(jwtPayload, config.jwt_refresh_secret as Secret, refreshExp);

    // কন্ডিশনাল $set: clientInfo থাকলে সেট হবে, না থাকলে শুধু lastLogin
    const $set: any = { lastLogin: new Date() };
    if (payload.clientInfo) $set.clientInfo = payload.clientInfo;

    await User.findByIdAndUpdate(user._id, { $set }, { new: false, session });

    await session.commitTransaction();
    return { accessToken, refreshToken };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};




/* ------------------------- REFRESH TOKEN ------------------------ */
const refreshToken = async (token: string) => {
  let verified: any;
  try {
    verified = verifyToken(token, config.jwt_refresh_secret as Secret);
  } catch {
    throw new AppError(StatusCodes.FORBIDDEN, 'Invalid refresh token');
  }

  const { userId } = verified as { userId: string };
  const user = await User.findById(userId).select('_id name email role isActive tokenVersion');

  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User does not exist');
  if (!user.isActive) throw new AppError(StatusCodes.BAD_REQUEST, 'User is not active');

  const payload: IJwtPayload = {
    userId: (user._id as Types.ObjectId).toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    sid: randomUUID(),                                  // ✅ here too
    tokenVersion: (user as any).tokenVersion ?? 0,
  };

  const accessExp = config.jwt_access_expires_in as SignOptions['expiresIn'];
  const accessToken = createToken(payload, config.jwt_access_secret as Secret, accessExp);

  return { accessToken };
};

/* ------------------------ CHANGE PASSWORD ----------------------- */
// const changePassword = async (
//   userData: JwtPayload,
//   payload: { oldPassword: string; newPassword: string }
// ) => {
//   const { userId } = userData as { userId: string };
//   const { oldPassword, newPassword } = payload;

//   const user = await User.findById(userId).select('+password isActive');
//   if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
//   if (!user.isActive) throw new AppError(StatusCodes.FORBIDDEN, 'User account is inactive');

//   const ok = await User.isPasswordMatched(oldPassword, user.password);
//   if (!ok) throw new AppError(StatusCodes.FORBIDDEN, 'Incorrect old password');

//   const hashed = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
//   await User.updateOne({ _id: userId }, { password: hashed });

//   return { message: 'Password changed successfully' };
// };

/* ------------------------- FORGOT PASSWORD ---------------------- */
// const forgotPassword = async ({ email }: { email: string }) => {
//   const user = await User.findOne({ email: email.toLowerCase() });
//   if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
//   if (!user.isActive) throw new AppError(StatusCodes.BAD_REQUEST, 'User is not active!');

//   const otp = generateOtp(); // e.g., 6-digit

//   const otpToken = jwt.sign({ otp, email: user.email }, config.jwt_otp_secret as string, {
//     expiresIn: '5m',
//   });

//   await User.updateOne({ email: user.email }, { otpToken });

//   try {
//     const emailContent = await EmailHelper.createEmailContent(
//       { otpCode: otp, userName: user.name },
//       'forgotPassword'
//     );
//     await EmailHelper.sendEmail(user.email, emailContent, 'Reset Password OTP');
//   } catch (e) {
//     await User.updateOne({ email: user.email }, { $unset: { otpToken: 1 } });
//     throw new AppError(
//       StatusCodes.INTERNAL_SERVER_ERROR,
//       'Failed to send OTP email. Please try again later.'
//     );
//   }
// };

/* ---------------------------- VERIFY OTP ------------------------ */
// const verifyOTP = async ({ email, otp }: { email: string; otp: string }) => {
//   const user = await User.findOne({ email: email.toLowerCase() });
//   if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

//   if (!user.otpToken || user.otpToken === '') {
//     throw new AppError(
//       StatusCodes.BAD_REQUEST,
//       'No OTP token found. Please request a new password reset OTP.'
//     );
//   }

//   let decoded: any;
//   try {
//     decoded = verifyToken(user.otpToken as string, config.jwt_otp_secret as string);
//   } catch (e) {
//     throw new AppError(StatusCodes.FORBIDDEN, 'OTP has expired or is invalid');
//   }

//   if (decoded.otp !== otp) {
//     throw new AppError(StatusCodes.FORBIDDEN, 'Invalid OTP');
//   }

//   user.otpToken = null;
//   await user.save();

//   const resetToken = jwt.sign({ email: user.email }, config.jwt_pass_reset_secret as string, {
//     expiresIn: config.jwt_pass_reset_expires_in,
//   });

//   return { resetToken };
// };

/* --------------------------- RESET PASSWORD --------------------- */
// const resetPassword = async ({
//   token,
//   newPassword,
// }: {
//   token: string;
//   newPassword: string;
// }) => {
//   const session: ClientSession = await User.startSession();

//   try {
//     session.startTransaction();

//     const decoded: any = verifyToken(token, config.jwt_pass_reset_secret as string);

//     const user = await User.findOne({ email: decoded.email, isActive: true })
//       .select('_id email')
//       .session(session);
//     if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

//     const hashed = await bcrypt.hash(String(newPassword), Number(config.bcrypt_salt_rounds));

//     await User.updateOne({ email: user.email }, { password: hashed }, { session });

//     await session.commitTransaction();

//     return { message: 'Password changed successfully' };
//   } catch (err) {
//     await session.abortTransaction();
//     throw err;
//   } finally {
//     session.endSession();
//   }
// };

export const AuthService = {
  loginUser,
  refreshToken,
//   changePassword,
//   forgotPassword,
//   verifyOTP,
//   resetPassword,
};
