/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errors/appError";
import { Inventory } from "./inventory.model";
 
import { StatusCodes } from "http-status-codes";
import { generateSKU } from "./inventory.utils";

export async function createInventory(payload: any) {
  if (!payload.name || !payload.modelCode) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Product name and modelCode are required"
    );
  }

  const sku = generateSKU(payload.name, payload.modelCode);

  return Inventory.create({
    ...payload,
    sku,
    reservedQuantity: 0,
    isPublished: false,
  });
}


export async function publishInventory(id: string) {
  const item = await Inventory.findById(id);
  if (!item)
    throw new AppError(StatusCodes.NOT_FOUND, "Inventory not found");

  item.isPublished = true;
  await item.save();

  return item;
}

export async function listInventory(query: any) {
  return Inventory.find(query).sort({ createdAt: -1 });
}
