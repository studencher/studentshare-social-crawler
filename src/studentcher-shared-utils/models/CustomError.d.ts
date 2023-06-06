import { ApiResponse } from "./ApiResponse";
export declare class CustomError extends Error {
    code: string;
    status: number;
    extra: unknown | undefined;
    constructor(message: string, status?: number, code?: string);
    serialize(): ApiResponse;
}
