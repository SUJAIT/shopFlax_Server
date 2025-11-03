// src/app/modules/auth/auth.validation.ts
import { z } from 'zod';

/* -------------------- shared pieces -------------------- */
const clientInfoSchema = z.object({
  device: z.enum(['pc', 'mobile']),                                   // required by default
  browser: z.string().min(1, 'Browser is required'),
  ipAddress: z.string().min(3, 'IP address is required'),
  pcName: z.string().optional(),
  os: z.string().optional(),
  userAgent: z.string().optional(),
});

const emailSchema = z.string().min(1, 'Email is required').email('Invalid email');

/* ---------------------- login ---------------------- */
export const loginZodSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(6, 'Password must be at least 6 characters'),
    clientInfo: clientInfoSchema,
  }),
});

/* ------------------ refresh token ------------------ */
// যদি কুকি দিয়েই নাও, এটা যথেষ্ট:
export const refreshTokenZodSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// হেডার fallback চাইলে এইটা ব্যবহার করো:
/*
export const refreshTokenZodSchema = z.object({
  cookies: z.object({ refreshToken: z.string().min(1) }).partial(),
  headers: z.object({ authorization: z.string().min(1).optional() }).partial(),
}).refine(
  (v) => Boolean(v.cookies?.refreshToken) || Boolean(v.headers?.authorization),
  { message: 'Refresh token is required (cookie or Authorization header)' }
);
*/

/* ----------------- change password ----------------- */
export const changePasswordZodSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(6, 'Old password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

/* ------------------ forgot password ----------------- */
export const forgotPasswordZodSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

/* -------------------- verify OTP -------------------- */
export const verifyOtpZodSchema = z.object({
  body: z.object({
    email: emailSchema,
    otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  }),
});

/* ------------------- reset password ----------------- */
export const resetPasswordZodSchema = z.object({
  body: z.object({
    token: z.string().min(10, 'Reset token is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});
