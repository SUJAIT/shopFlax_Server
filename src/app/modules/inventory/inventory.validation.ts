import { z } from "zod";
import { objectId } from "../../helpers/objectId";
 
export const createInventorySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),

    categoryId: objectId,
    categoryCode: z.string().min(2).max(5), // CAR
    modelCode: z.string().min(2).max(10),   // AX20

    quantity: z.number().min(0),
    costPrice: z.number().min(0),
    sellingPrice: z.number().min(0),

    images: z.array(z.string().url()).optional(),

    supplier: z
      .object({
        name: z.string().optional(),
        contact: z.string().optional(),
      })
      .optional(),
  }),
});


export const publishInventorySchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
