import { Types } from "mongoose";

export interface IInventory {
    sku: string;

    name: string;
    description?: string;

    categoryId: Types.ObjectId;
    modelCode: string;
    quantity: number;
    reservedQuantity: number;

    costPrice: number;
    sellingPrice: number;

    supplier?: {
        name?: string;
        contact?: string;
    };

    images: string[]; // ImageBB URLs

    isActive: boolean;      // inventory usable?
    isPublished: boolean;  // ecommerce live?

    createdAt?: Date;
    updatedAt?: Date;
}
