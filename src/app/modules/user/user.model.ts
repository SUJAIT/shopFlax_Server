/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/modules/user/user.model.ts
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../../config';
import AppError from '../../errors/appError';
import { StatusCodes } from 'http-status-codes';
import { IUser, UserModel, UserRole } from './usre.interface';


/** ---------------- Schema ---------------- */
const clientInfoSchema = new Schema(
  {
    device: { type: String, enum: ['pc', 'mobile', 'tablet'] },
    browser: { type: String },
    ipAddress: { type: String },
    pcName: { type: String },
    os: { type: String },
    userAgent: { type: String },
  },
  { _id: false }
);

const userSchema = new Schema<IUser, UserModel>(
  {
    name: { type: String, required: true, trim: true },

    // email OR phone — at least one required (validator নিচে আছে)
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      sparse: true, // allow multiple docs with null/undefined
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
      unique: true,
    },

    password: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
    },

    hasShop: { type: Boolean, default: false },

    clientInfo: { type: clientInfoSchema, required: false },

    lastLogin: { type: Date, default: null },
    isActive: { type: Boolean, default: true },

    otpToken: { type: String, default: null },
  },
  { timestamps: true }
);

/** At least one of email/phone must be present */
userSchema.pre('validate', function (next) {
  if (!this.email && !this.phone) {
    return next(
      new AppError(
        StatusCodes.BAD_REQUEST,
        'Either email or phone is required.'
      )
    );
  }
  next();
});

/** Hash password when newly set or modified */
userSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcrypt_salt_rounds || 10)
    );
  }
});

/** Hash if password updated via findOneAndUpdate */
/** Hash if password updated via findOneAndUpdate */
userSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() as any;
  const pwd =
    update?.password ??
    update?.$set?.password ??
    (update?.$setOnInsert && update.$setOnInsert.password);
  if (pwd) {
    const hashed = await bcrypt.hash(
      pwd,
      Number(config.bcrypt_salt_rounds || 10)
    );
    if (update.password) update.password = hashed;
    if (update.$set) update.$set.password = hashed;
    if (update.$setOnInsert) update.$setOnInsert.password = hashed;
  }
});
/** Hide password in JSON outputs */
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

/** -------- Instance Methods -------- */
userSchema.methods.comparePassword = async function (
  plainTextPassword: string
): Promise<boolean> {
  // `this.password` might be undefined (because select:false). Ensure loaded.
  const current =
    (this as any).password ??
    (await (User as any)
      .findById(this._id)
      .select('+password')
      .lean()
      .then((u: any) => u?.password));
  if (!current) return false;
  return bcrypt.compare(plainTextPassword, current);
};

/** -------- Static Methods -------- */
userSchema.statics.isUserExistsByEmailOrPhone = async function (
  email?: string,
  phone?: string
): Promise<IUser | null> {
  const query: any[] = [];
  if (email) query.push({ email });
  if (phone) query.push({ phone });
  if (!query.length) return null;
  return this.findOne({ $or: query }).select('+password');
};

userSchema.statics.checkUserExistsById = async function (
  userId: string
): Promise<IUser | null> {
  const existingUser = await this.findById(userId);
  if (!existingUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User does not exist!');
  }
  if (!existingUser.isActive) {
    throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'User is not active!');
  }
  return existingUser;
};

const User = mongoose.model<IUser, UserModel>('User', userSchema);
export default User;
