// src/app/modules/category/category.controller.ts


import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

import { CategoryService, CreateCategoryDTO, UpdateCategoryDTO } from "./category.services";

import { isValidObjectId } from "mongoose";
import { buildListQuery } from "./categor.helper";

/* ============ Create ============ */
export const createCategory = catchAsync(async (req: Request, res: Response) => {
  // body already validated by zod/joi middleware
  const payload = req.body as CreateCategoryDTO;

  const data = await CategoryService.createCategory(payload);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Category created successfully",
    data,
  });
});

/* ============ Update (name/parent/sortOrder/isActive) ============ */
export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body as UpdateCategoryDTO;

  const data = await CategoryService.updateCategory(id, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category updated successfully",
    data,
  });
});

/* ============ Get (by id OR slug) ============ */
export const getCategoryByIdOrSlug = catchAsync(async (req: Request, res: Response) => {
  const { idOrSlug } = req.params;

  const data = isValidObjectId(idOrSlug)
    ? await CategoryService.getCategoryById(idOrSlug)
    : await CategoryService.getCategoryBySlug(idOrSlug);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category fetched successfully",
    data,
  });
});

/* ============ List (flat) ============ */
export const listCategories = catchAsync(async (req: Request, res: Response) => {
  // helper থেকে টাইপ-সেইফ কনভার্সন (parentId/search/isActive/page/limit/sort)
  const query = buildListQuery(req.query);

  const result = await CategoryService.listCategories(query);
  // result shape: { page, limit, total, items }

  const meta = {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPage: Math.ceil(result.total / (result.limit || 1)),
  };

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Categories fetched successfully",
    data: result.items,
    meta,
  });
});

/* ============ Delete (soft by default) ============ */
export const removeCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  // চাইলে ?hard=true কুইরি দিলে হার্ড ডিলিট
  const hard = String(req.query.hard ?? "").toLowerCase() === "true";

  await CategoryService.removeCategory(id, hard);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category deleted successfully",
    data: null,
  });
});





/* ============ Controller export ============ */
export const CategoryController = {
  createCategory,
  updateCategory,
  getCategoryByIdOrSlug,
  listCategories,
  removeCategory,
};
