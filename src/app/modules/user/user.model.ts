/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/modules/user/user.model.ts
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";

import config from "../../config";
import AppError from "../../errors/appError";
import { IUser, UserModel, UserRole } from "./user.interface";

/* ─────────────────────────────
 * User Schema
 * ───────────────────────────── */
const userSchema = new Schema<IUser, UserModel>(
  {
    // Human-friendly ID (A00001 / E00001)
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Never return password by default
    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: [UserRole.ADMIN, UserRole.EMPLOYEE],
      required: true,
      default: UserRole.EMPLOYEE,
    },

    clientInfo: {
      device: {
        type: String,
        enum: ["pc", "mobile"],
        required: true,
      },
      browser: { type: String, required: true },
      ipAddress: { type: String, required: true },
      pcName: { type: String },
      os: { type: String },
      userAgent: { type: String },
    },

    lastLogin: {
      type: Date,
      default: Date.now,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    otpToken: {
      type: String,
      default: null,
    },

    // optional, useful for revoking refresh tokens globally
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  }
);

/* ─────────────────────────────
 * Hooks
 * ───────────────────────────── */

// Hash only when password is new/changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds || 12)
  );
  next();
});

// After save, make sure password is never leaked if it gets selected manually
userSchema.post("save", function (doc, next) {
  (doc as any).password = undefined;
  next();
});

// Ensure JSON serialization never exposes password
userSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, any>) => {
    delete ret.password;
    return ret;
  },
});

/* ─────────────────────────────
 * Statics (Model methods)
 * ───────────────────────────── */

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword: string,
  hashedPassword: string
) {
  return bcrypt.compare(plainTextPassword, hashedPassword);
};

userSchema.statics.isUserExistsByEmail = async function (email: string) {
  const doc = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );
  return doc as unknown as IUser | null;
};

userSchema.statics.checkUserExist = async function (userId: string) {
  const existingUser = await this.findById(userId);

  if (!existingUser) {
    throw new AppError(StatusCodes.NOT_ACCEPTABLE, "User does not exist!");
  }
  if (!existingUser.isActive) {
    throw new AppError(StatusCodes.NOT_ACCEPTABLE, "User is not active!");
  }

  return existingUser;
};

/* ─────────────────────────────
 * Model
 * ───────────────────────────── */
export const User = mongoose.model<IUser, UserModel>("User", userSchema);
export default User;
