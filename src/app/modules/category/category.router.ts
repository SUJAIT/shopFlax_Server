// Express router here

import { Router } from "express";
import { CategoryController } from "./category.controller";



const router = Router()

// Create
router.post(
  "/",
  // validateRequest(createCategorySchema),ok
  CategoryController.createCategory
);

// Update
router.patch(
  "/:id",
  // validateRequest(updateCategorySchema),ok
  CategoryController.updateCategory
);

// Get by id OR slug (একটাই এন্ডপয়েন্ট)
router.get("/:idOrSlug", CategoryController.getCategoryByIdOrSlug);

// List (query: parentId, q, isActive, page, limit, sort)
router.get("/", CategoryController.listCategories);

// Delete (soft by default; ?hard=true দিলে হার্ড ডিলিট ট্রাই করবে)
router.delete("/:id", CategoryController.removeCategory);

export const CategoryRoutes = router;
