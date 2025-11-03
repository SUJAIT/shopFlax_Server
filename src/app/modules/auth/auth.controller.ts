// src/app/modules/auth/auth.controller.ts

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { AuthService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import config from "../../config";

/* ----------------------------- LOGIN ----------------------------- */
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = await AuthService.loginUser(req.body);

  // Set refresh token in httpOnly cookie (access token stays in response body)
  res.cookie("refreshToken", refreshToken, {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "none",               // if using cross-site admin panel
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged in successfully!",
    data: { accessToken },
  });
});

/* -------------------------- REFRESH TOKEN ------------------------- */
// Prefer reading from cookie; fallback to Authorization header if provided
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const tokenFromCookie = req.cookies?.refreshToken as string | undefined;
  const tokenFromHeader = (req.headers.authorization || "") as string | undefined;
  const token = tokenFromCookie ?? tokenFromHeader;

  const result = await AuthService.refreshToken(token as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Access token refreshed successfully!",
    data: result, // { accessToken }
  });
});

/* -------------------------- CHANGE PASSWORD ----------------------- */
// const changePassword = catchAsync(async (req: Request, res: Response) => {
//   await AuthService.changePassword(req.user as any, req.body);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Password changed successfully!",
//     data: null,
//   });
// });

/* --------------------------- FORGOT PASSWORD ---------------------- */
// const forgotPassword = catchAsync(async (req: Request, res: Response) => {
//   await AuthService.forgotPassword(req.body);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Check your email to reset your password.",
//     data: null,
//   });
// });

/* ----------------------------- VERIFY OTP ------------------------- */
// const verifyOTP = catchAsync(async (req: Request, res: Response) => {
//   const result = await AuthService.verifyOTP(req.body); // { resetToken }

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "OTP verified successfully.",
//     data: result,
//   });
// });

/* ---------------------------- RESET PASSWORD ---------------------- */
// const resetPassword = catchAsync(async (req: Request, res: Response) => {
//   const result = await AuthService.resetPassword(req.body);

//   sendResponse(res, {
//     statusCode: StatusCodes.OK,
//     success: true,
//     message: "Password reset successfully!",
//     data: result,
//   });
// });

export const AuthController = {
  loginUser,
  refreshToken,
//   changePassword,
//   forgotPassword,
//   verifyOTP,
//   resetPassword,
};
