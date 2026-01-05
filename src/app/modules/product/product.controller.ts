import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import * as ProductService from "./product.service";


export const createProduct = catchAsync(
  async (req: Request, res: Response) => {
    const data = await ProductService.createProduct(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Product created",
      data,
    });
  }
);


export const publishProduct = catchAsync(
  async (req: Request, res: Response) => {
    const data = await ProductService.publishProduct(req.params.id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Product published successfully",
      data,
    });
  }
);




export const getPublicProducts = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ProductService.getPublicProducts(req.query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Products fetched successfully",
      data: result,  
    });
  }
);

