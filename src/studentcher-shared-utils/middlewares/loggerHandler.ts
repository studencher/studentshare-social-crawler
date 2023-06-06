import {NextFunction, Request, Response} from "express";
import {Logger} from "../helpers/Logger";

export function logReceivingMiddleware (logger: Logger){
    return (req: Request, res: Response, next: NextFunction) =>{
        logger.info(`Rout: ${decodeURI(req.url)} (${req.method}), body: ${req.body}, query params: ${req.query.params}`);
        next();
    }
}

export function logFinishMiddleware(logger: Logger){
    return (req: Request, res: Response, next: NextFunction) => {
        res.on("finish", function() {
            logger.info(`${req.method}, ${decodeURI(req.url)}, ${res.statusCode}, ${res.statusMessage}`);
        });
        next();
    }
}
