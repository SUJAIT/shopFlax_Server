// src/app/modules/user/user.id.ts
import mongoose from "mongoose";
import { Counter } from "../../shared/ids/counter.model";
import { UserRole } from "./user.interface";

// Map role → prefix (A00001 / E00001)
const ROLE_PREFIX: Record<UserRole, string> = {
  [UserRole.ADMIN]: "A",
  [UserRole.EMPLOYEE]: "E",
};

// Atomic sequence generator for custom human IDs
async function getNextCustomId(
  role: UserRole,
  session: mongoose.ClientSession
): Promise<string> {
  const prefix = ROLE_PREFIX[role] ?? "U";
  const key = `USER:${String(role).toUpperCase()}`; // e.g., USER:ADMIN

  // Important: do NOT set nextNumber in $setOnInsert to avoid conflicts
  const doc = await Counter.findOneAndUpdate(
    { key },
    {
      $inc: { nextNumber: 1 },           // increment atomically
      $setOnInsert: { prefix, padding: 5 }, // set once on first insert
    },
    { new: true, upsert: true, session }
  );

  // safety: doc should exist due to upsert:true
  const num = doc!.nextNumber;
  const pad = doc!.padding ?? 5;

  return `${prefix}${String(num).padStart(pad, "0")}`; // e.g., A00001
}

export const generateUserId = {
  getNextCustomId,
};
