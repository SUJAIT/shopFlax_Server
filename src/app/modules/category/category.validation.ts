// src/app/modules/category/category.validation.ts
import { z } from "zod";

/** 24-hex ObjectId checker */
const objectId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");

/** slug: lowercase letters, numbers, hyphen */
const slugStr = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug");

/** nullable string helper */
const nullableString = z.string().min(1).optional().nullable();

/* =========================
   Create Category
   ========================= */
const createCategoryBody = z.object({
  name: z.string().min(1, "Name is required"),
  slug: slugStr.optional(),                 // না দিলে model hook normalize করবে
  icon: nullableString,                     // হেল্পার ইউজ করা হল
  image: nullableString,                    // যদি URL লাগত, z.string().url().optional() দাও
  parentId: z.union([objectId, z.null()]).optional(),
  sortOrder: z.number().int().nonnegative().optional().nullable(),
  isActive: z.boolean().optional(),
  metaTitle: nullableString,
  metaDescription: nullableString,
});
export const createCategorySchema = z.object({ body: createCategoryBody });

/* =========================
   Update Category
   ========================= */
const updateCategoryBody = z
  .object({
    name: z.string().min(1).optional(),
    slug: slugStr.optional(),
    icon: nullableString,
    image: nullableString,
    parentId: z.union([objectId, z.null()]).optional(),
    sortOrder: z.number().int().nonnegative().optional().nullable(),
    isActive: z.boolean().optional(),
    metaTitle: nullableString,
    metaDescription: nullableString,
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: "At least one field must be provided",
  });
export const updateCategorySchema = z.object({
  params: z.object({ id: objectId }),
  body: updateCategoryBody,
});

/* =========================
   Get by id OR slug
   ========================= */
export const getByIdOrSlugSchema = z.object({
  params: z.object({
    idOrSlug: z.union([objectId, slugStr]),
  }),
});

/* =========================
   List (query params)
   ========================= */
export const listCategoriesSchema = z.object({
  query: z.object({
    parentId: z.union([objectId, z.null()]).optional(),
    q: z.string().optional(),
    isActive: z
      .union([z.literal("true"), z.literal("false")])
      .transform((v) => v === "true")
      .optional(),
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional(),
    sort: z.enum(["name", "-name", "sortOrder", "-sortOrder"]).optional(),
  }),
});

/* =========================
   Delete (soft/hard)
   ========================= */
export const deleteCategorySchema = z.object({
  params: z.object({ id: objectId }),
  query: z.object({
    hard: z.enum(["true", "false"]).optional(),
  }),
});

/* (optional) Types */
export type CreateCategoryBody = z.infer<typeof createCategoryBody>;
export type UpdateCategoryBody = z.infer<typeof updateCategoryBody>;
