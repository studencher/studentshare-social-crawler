import {CustomError} from "../models/CustomError";
import {Request, Response} from "express";
import {Logger} from "../helpers/Logger";

export function errorsHandler(logger: Logger){
    return (error: CustomError, req: Request, res: Response, _next: Function)=>{
        logger.error(error.message);
        const err = error.constructor.name === "CustomError" ? error : new CustomError("Error");
        return res.status(err.status).json(err.serialize());
    }
}
