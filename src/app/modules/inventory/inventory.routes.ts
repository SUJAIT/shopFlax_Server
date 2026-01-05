import { Router } from "express";
import auth from "../../middleware/auth";
import { UserRole } from "../user/user.interface";
import * as InventoryController from "./inventory.controller";

const router = Router();

router.post(
  "/",
  auth(UserRole.ADMIN),
  InventoryController.createInventory
);

router.patch(
  "/:id/publish",
  auth(UserRole.ADMIN),
  InventoryController.publishInventory
);

export const InventoryRoutes = router;
