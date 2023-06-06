import {Request, Response} from "express";
import {CustomError} from "../models/CustomError";
import {Constants} from "../helpers/Constants";
const whitelistedAddress = process.env.WHITE_LIST_ADDRESS;

export function whiteListHandler (req: Request, res: Response, next: Function){
    if (req.socket.localAddress !== whitelistedAddress)
        return next(new CustomError("Forbidden!", 403));
    const userId = req.headers[Constants.PROXY_AUTHORIZED_HEADER] ;
    if (userId == null)
        return next(new CustomError("Committed UserId not provided", 403));
    res.locals.userId = userId;
    next();
}


