/* eslint-disable no-unused-vars */


// src/app/modules/user/user.interface.ts
import { Document, Model } from 'mongoose';

/** ---- Enums & helper types ---- */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  EMPLOYEE = 'employee',
}

export type DeviceType = 'pc' | 'mobile' | 'tablet';

export interface ClientInfo {
  device: DeviceType;       // Device type
  browser?: string;         // Browser name
  ipAddress?: string;       // User IP address
  pcName?: string;          // Optional PC name
  os?: string;              // Optional OS name (Windows, macOS, etc.)
  userAgent?: string;       // Optional user agent string
}

/** ---- Document (instance) shape + instance methods ----
 *  NOTE: email/phone দুটোই রাখা হলো; runtime validation এ ensure করবে
 *  কমপক্ষে ১টা থাকতেই হবে (schema বা zod/class-validator এ).
 */
export interface IUser extends Document {
  email?: string;           // Optional if using phone
  phone?: string;           // Optional if using email
  password?: string;
  name: string;
  role: UserRole;
  hasShop: boolean;

  clientInfo?: ClientInfo;

  lastLogin?: Date | null;
  isActive: boolean;
  otpToken?: string | null;

  // If you enable mongoose timestamps, these come from Mongoose
  createdAt?: Date;
  updatedAt?: Date;

  /** Instance method: compare a plaintext password with the stored hash on this doc */
  comparePassword(plainTextPassword: string): Promise<boolean>;
}

/** ---- Model statics (class-level helpers) ---- */
export interface UserModel extends Model<IUser> {
  /**
   * Find a user by email or phone.
   * Pass either/both; returns null if not found.
   */
  isUserExistsByEmailOrPhone(
    email?: string,
    phone?: string
  ): Promise<IUser | null>;

  /** Quick existence check by id (returns full doc or null) */
  checkUserExistsById(userId: string): Promise<IUser | null>;
}
