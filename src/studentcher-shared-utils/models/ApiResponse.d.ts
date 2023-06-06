export interface IApiResponse<T> {
    success: boolean;
    data: T;
}
export declare class ApiResponse implements IApiResponse<any> {
    success: boolean;
    data: unknown;
    constructor(success: boolean, data?: {});
}
