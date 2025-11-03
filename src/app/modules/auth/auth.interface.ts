
// src/app/modules/auth/auth.interface.ts

import { UserRole } from "../user/user.interface";

/* ============ Client / Device ============ */
export type DeviceType = "pc" | "mobile";

export interface IClientInfo {
  device: DeviceType;   // Device category
  browser: string;      // Browser name (e.g., Chrome)
  ipAddress: string;    // Extract server-side from proxy headers
  pcName?: string;
  os?: string;          // OS name/version (e.g., Windows 11)
  userAgent?: string;   // Raw UA string (store only on server)
}

/* ============ Auth DTOs ============ */
export interface IAuth {
  email: string;
  password: string;
  clientInfo: IClientInfo;
}

/* ============ JWT Payloads ============ */
// Short-lived access token claims
export interface IJwtPayload {
  userId: string;       // MongoDB _id as string (set in service)
  name: string;
  email: string;
  role: UserRole;       // 'admin' | 'employee'
  isActive: boolean;

  // session hygiene
  sid: string;          // server-side session id (UUID)
  tokenVersion: number; // bump to revoke old tokens

  // standard JWT times (optional)
  iat?: number;
  exp?: number;
}

// Longer-lived refresh token claims
export interface IRefreshPayload {
  userId: string;
  sid: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

/* ============ Auth Results ============ */
export interface ITokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSec?: number;
  refreshTokenExpiresInSec?: number;
}

export interface IAuthUser {
  id: string;           // human id (A00001/E00001) or your chosen display id
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface IAuthResult {
  user: IAuthUser;
  tokens: ITokens;
}
