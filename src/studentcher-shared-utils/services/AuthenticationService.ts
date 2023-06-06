import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {NextFunction, Request, Response} from "express";
import {Logger} from "../helpers/Logger";
import {Constants} from "../helpers/Constants";
import {CustomError} from "../models/CustomError";
import {PostgresAdapter} from "../storage/PostgresAdapter";

export class AuthenticationService{
    private dbClient : PostgresAdapter;
    private logger: Logger;
    private secret: string
    constructor(dbClient, logger, secret) {
        this.dbClient = dbClient;
        this.logger = logger;
        this.secret = secret;
    }
    extractDecodedFromToken = (token): any=>{
        return  jwt.verify(token, this.secret);
    }
    verify = async (req: Request, res: Response, next: NextFunction)=>{
        try{
            const token = req.header( "x-authorization").replace("JWT ", "")
            const decoded = this.extractDecodedFromToken(token);
            res.locals.userId = decoded.userId;
            next();
        }catch (err){
            this.logger.error(err.message);
            next(new CustomError(Constants.AUTHENTICATION_FAILED_MESSAGE));
        }
    }
    authenticate = async (req: Request, res: Response, next: NextFunction)=>{
        const username = req.body.username;
        const password = req.body.password;
        try {
            if (!username || !password) {
                return next(new CustomError(Constants.AUTHENTICATION_MISSING_PARAMS_MESSAGE));
            }
            const user = await this.getUserHashedPassword(username);
            const validPassword = await bcrypt.compare(password, user.hashedPassword);
            if (!validPassword)
                return next(Constants.AUTHENTICATION_FAILED_MESSAGE);
            res.locals.userId = user.id;
            next();
        }catch (err){
            return next(err);
        }
    }
    getUserHashedPassword = async (username): Promise<{id: string, hashedPassword: string}>=>{
        const sqlQuery = 'select id, password as "hashedPassword" from users where id = $1';
        const response = await this.dbClient.callDbCmd(sqlQuery, [username]);
        if (response.rowCount !== 1) {
            throw new CustomError(Constants.AUTHENTICATION_FAILED_MESSAGE);
        }
        return response.rows[0];
    }
    generateControlPanelToken = (userId)=>{
        const sessionInfo ={userId};
        return 'JWT ' + jwt.sign(sessionInfo, this.secret, {
            expiresIn: Constants.TOKEN_EXPIRES_IN_NUMBER_OF_SECONDS
        });
    }
}


