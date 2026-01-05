import { Request, Response } from "express";
 
import * as InventoryService from "./inventory.service";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

export const createInventory = catchAsync(
  async (req: Request, res: Response) => {
    const data = await InventoryService.createInventory(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Inventory created",
      data,
    });
  }
);

export const publishInventory = catchAsync(
  async (req: Request, res: Response) => {
    const data = await InventoryService.publishInventory(req.params.id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Inventory published",
      data,
    });
  }
);
