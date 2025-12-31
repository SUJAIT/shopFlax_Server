import { Router } from "express";
import { AuthController } from "./auth.controller";
// import auth from "../../middleware/auth";
// import { UserRole } from "../user/user.interface";



const router = Router();


router.post('/login', AuthController.loginUser); 

router.post('/refresh-token', AuthController.refreshToken);

export const AuthRoutes = router;

