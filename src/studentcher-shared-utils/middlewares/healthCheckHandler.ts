import {Request, Response} from "express";

export function healthCheckMiddleware (req: Request, res: Response, _next: Function){
    return res.status(200).send("ok");
}


