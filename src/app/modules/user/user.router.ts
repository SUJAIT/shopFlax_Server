import { Router } from "express";
import { UserController } from "./user.controller";




const router = Router();


router.post('/sign-up', UserController.registerUser); 



export const userRoute = router;

