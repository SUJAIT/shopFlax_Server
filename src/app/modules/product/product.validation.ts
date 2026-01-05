import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    categoryId: z.string(),
    price: z.number(),
    discountPrice: z.number().optional(),
    images: z.array(z.string()).min(1),
    inventoryId: z.string(),
  }),
});
