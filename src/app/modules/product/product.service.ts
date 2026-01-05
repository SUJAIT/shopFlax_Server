/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { Product } from "./product.model";


export async function createProduct(payload: any) {
  const product = await Product.create({
    ...payload,
    isLive: false, // initially NOT live
  });

  return product;
}


export async function publishProduct(productId: string) {
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, "Product not found");
  }

  if (product.isLive) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Product already live"
    );
  }

  product.isLive = true;
  await product.save();

  return product;
}


// get-all-products

export async function getPublicProducts(query: any) {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    sort = "latest",
    page = 1,
    limit = 10,
  } = query;

  const filter: any = {
    isLive: true,
  };

  if (category) {
    filter.categoryId = category;
  }

  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  let sortQuery: any = { createdAt: -1 };

  if (sort === "price_asc") sortQuery = { price: 1 };
  if (sort === "price_desc") sortQuery = { price: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  const products = await Product.find(filter)
    .sort(sortQuery)
    .skip(skip)
    .limit(Number(limit))
    .populate("categoryId", "name slug")
    .lean();

  const total = await Product.countDocuments(filter);

  return {
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
    },
    data: products,
  };
}

