// src/app/modules/user/user.validation.ts
import { z } from "zod";
import { UserRole } from "./user.interface";

/* ---------- shared: client/device info ---------- */
const clientInfoSchema = z.object({
  device: z.enum(["pc", "mobile"]),
  browser: z.string().min(1, "Browser is required"),
  ipAddress: z.string().min(3, "IP address is required"),
  pcName: z.string().optional(),
  os: z.string().optional(),
  userAgent: z.string().optional(),
});

/* ---------- create/register user ---------- */
/** Matches RegisterDTO used in user.service.ts */
const createUserZodSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.nativeEnum(UserRole),   
    clientInfo: clientInfoSchema,
  }),
});

/* ---------- (optional) update user ---------- */
const updateUserZodSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      role: z.enum(["admin", "employee"]).optional(),
      isActive: z.boolean().optional(),
      clientInfo: clientInfoSchema.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
};
