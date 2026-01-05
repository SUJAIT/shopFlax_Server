import { Schema, model } from "mongoose";
import { IProduct } from "./product.interface";

const ProductSchema = new Schema<IProduct>(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      unique: true, // 1 inventory = 1 product
    },

    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },

    shortDescription: String,
    description: String,

    price: { type: Number, required: true },

    images: [{ type: String }],

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    isLive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Product = model<IProduct>("Product", ProductSchema);
