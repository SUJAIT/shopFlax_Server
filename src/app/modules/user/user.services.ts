// src/app/modules/user/user.services.ts
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { CreatedUser, RegisterDTO } from "./user.interface";
import { generateUserId } from "./user.id";
import { User } from "./user.model"; // ⬅️ named import
import AppError from "../../errors/appError";

const registerUser = async (payload: RegisterDTO): Promise<CreatedUser> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, password, role, clientInfo } = payload;

    if (!name || !email || !password || !role) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Missing required fields (name, email, password, role)."
      );
    }
    if (!clientInfo) {
      throw new AppError(StatusCodes.BAD_REQUEST, "clientInfo is required.");
    }

    const emailNorm = email.trim().toLowerCase();

    const existing = await User.findOne({ email: emailNorm })
      .session(session)
      .select("_id");
    if (existing) {
      throw new AppError(StatusCodes.CONFLICT, "Email already registered.");
    }

    const humanId = await generateUserId.getNextCustomId(role, session);

    const [created] = await User.create(
      [
        {
          id: humanId,
          name,
          email: emailNorm,
          password,              // plain; model pre('save') will hash
          role,
          clientInfo,
          isActive: true,
        },
      ],
      { session, validateBeforeSave: true }
    );

    await session.commitTransaction();

    const result: CreatedUser = {
      _id: created._id,
      id: created.id,
      email: created.email,
      name: created.name,
      role: created.role,
      clientInfo: created.clientInfo,
      lastLogin: created.lastLogin,
      isActive: created.isActive,
      otpToken: created.otpToken,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };

    return result;
  } catch (err: any) {
    await session.abortTransaction();

    if (err?.code === 11000 && err?.keyPattern?.email) {
      throw new AppError(StatusCodes.CONFLICT, "Email already registered.");
    }

    if (err instanceof AppError) throw err;
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      err?.message || "Failed to register user."
    );
  } finally {
    session.endSession();
  }
};

export const UserService = { registerUser };
