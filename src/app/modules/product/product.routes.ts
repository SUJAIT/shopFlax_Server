import { Router } from "express";
import auth from "../../middleware/auth";
import { UserRole } from "../user/user.interface";
import * as ProductController from "./product.controller";
import validateRequest from "../../middleware/validateRequest";
import { createProductSchema } from "./product.validation";

const router = Router();

router.post(
  "/",
  auth(UserRole.ADMIN),
  validateRequest(createProductSchema),
  ProductController.createProduct
);

router.patch(
  "/:id/publish",
  auth(UserRole.ADMIN),
  ProductController.publishProduct
);

router.get(
  "/",
  ProductController.getPublicProducts
);


export const ProductRoutes = router;
