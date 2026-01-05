import { Schema, model, Model } from "mongoose";
import { IInventory } from "./inventory.interface";

export interface InventoryModel extends Model<IInventory> {
    generateSKU(): Promise<string>;
}

const InventorySchema = new Schema<IInventory, InventoryModel>(
    {
        sku: { type: String, unique: true, index: true },

        name: { type: String, required: true, trim: true },
        description: { type: String },

        modelCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            unique: true,
        },

        categoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true,
        },

        quantity: { type: Number, required: true, min: 0 },
        reservedQuantity: { type: Number, default: 0 },

        costPrice: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },

        supplier: {
            name: String,
            contact: String,
        },

        images: [{ type: String }],

        isActive: { type: Boolean, default: true },
        isPublished: { type: Boolean, default: false },
    },
    { timestamps: true, versionKey: false }
);

/* Static SKU generator */
InventorySchema.statics.generateSKU = async function () {
    const count = await this.countDocuments();
    return `SKU-${Date.now()}-${count + 1}`;
};

export const Inventory = model<IInventory, InventoryModel>(
    "Inventory",
    InventorySchema
);
