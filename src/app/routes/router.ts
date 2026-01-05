import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes";

import { userRoute } from "../modules/user/user.router";

import { CategoryRoutes } from "../modules/category/category.router";
import { InventoryRoutes } from "../modules/inventory/inventory.routes";



const router = Router();

const moduleRoutes = [
    {
        path: '/users',
        route:userRoute,
    },
    {
        path: '/auth',
        route: AuthRoutes,
    },
    {
        path: '/categories',
        route: CategoryRoutes,
    },
    {
        path: '/inventory',
        route: InventoryRoutes,
    }
]

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;