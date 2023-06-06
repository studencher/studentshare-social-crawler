import { IDbResponse } from "../models/DbResponse";
export declare class PostgresAdapter {
    private pgPool;
    constructor({ host, database, user, password, max, min, connectionTimeoutMillis }: {
        host: string;
        database: string;
        user: string;
        password: string;
        max: number;
        min: number;
        connectionTimeoutMillis: number;
    });
    callDbCmd(sqlQuery: string, values?: any[]): Promise<any>;
    callDbTransaction(queriesArr: string[], valuesArr: any[][]): Promise<IDbResponse>;
}
