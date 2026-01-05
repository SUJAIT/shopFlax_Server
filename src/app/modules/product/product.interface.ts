import { Types } from "mongoose";

export interface IProduct {
  inventoryId: Types.ObjectId;   // 🔗 Inventory reference

  title: string;                 // "Toyota Axio 2020"
  slug: string;                  // "toyota-axio-2020"

  shortDescription?: string;
  description?: string;

  price: number;                 // sellingPrice snapshot
  images: string[];

  categoryId: Types.ObjectId;

  isLive: boolean;               // 👈 e-commerce control

  createdAt?: Date;
  updatedAt?: Date;
}
