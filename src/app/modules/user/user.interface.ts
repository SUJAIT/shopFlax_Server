/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
import { Document, Model } from "mongoose";


export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee'
}

// User Schema Definition
export interface IUser extends Document {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  clientInfo: {
    device: 'pc' | 'mobile'; // Device type
    browser: string; // Browser name
    ipAddress: string; // User IP address
    pcName?: string; // Optional PC name
    os?: string; // Optional OS name (Windows, MacOS, etc.)
    userAgent?: string; // Optional user agent string
  };
  lastLogin: Date;
  isActive: boolean;
  otpToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type RegisterDTO = {
  name: string;
  email: string;
  password: string;
  role: UserRole;          // 'admin' | 'employee'
  clientInfo?: IUser["clientInfo"];
};

export type CreatedUser = Omit<
  IUser,
  "password" | "comparePassword" | "hasRole"
> & { _id: any }; // return-safe shape (no password)

export interface UserModel extends Model<IUser> {
  //instance methods for checking if passwords are matched
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
  isUserExistsByEmail(id: string): Promise<IUser>;
  checkUserExist(userId: string): Promise<IUser>;
}