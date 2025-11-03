// src/shared/ids/counter.model.ts
import { Schema, model, Document } from "mongoose";

/**
 * Counter document – used for atomic numeric sequences per key.
 * Examples:
 *  key: 'USER:ADMIN'     -> A00001, A00002, ...
 *  key: 'USER:EMPLOYEE'  -> E00001, E00002, ...
 *  key: 'ORDER'          -> O00001, O00002, ...
 *  key: `EMPLOYEE:${shopId}` -> per-shop employee codes
 */
export interface ICounter extends Document {
  key: string;        // unique sequence key
  prefix: string;     // e.g., 'A', 'E', 'O'
  padding: number;    // total width for zero padding (e.g., 5 -> 00001)
  nextNumber: number; // next value to be issued (1-based or 0-based as you prefer)
  createdAt: Date;
  updatedAt: Date;
}

const CounterSchema = new Schema<ICounter>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    prefix: {
      type: String,
      required: true,
      trim: true,
      default: "U",
    },
    padding: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      default: 5,
    },
    // You can start from 0 or 1. With findOneAndUpdate {$inc:{nextNumber:1}}
    // and $setOnInsert:{nextNumber:1} you effectively issue 1 on first call.
    nextNumber: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    collection: "counters",
    timestamps: true,
    versionKey: false,
  }
);

// Optional: ensure numeric safety
CounterSchema.path("nextNumber").validate(function (v: number) {
  return Number.isFinite(v) && v >= 0;
}, "nextNumber must be a non-negative finite number.");

export const Counter = model<ICounter>("Counter", CounterSchema);
