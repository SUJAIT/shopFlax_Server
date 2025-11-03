import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import { UserService } from "./user.services";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";




const registerUser = catchAsync(async (req: Request, res: Response)=>{
    const result = await UserService.registerUser(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'User registered successfully',
        data: result,
    })
})


export const UserController = {
    registerUser,
}