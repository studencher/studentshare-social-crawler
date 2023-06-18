import {ApiResponse, IApiResponse} from "./ApiResponse"

interface ICustomerErrorDTO{
    message: string,
    code: string
}
export class CustomError extends Error implements ICustomerErrorDTO{
    code: string;
    status: number;
    extra: unknown | undefined;

    constructor(message: string, status = 400, code = "000000") {
        super();
        this.name = "CustomError";
        this.message = message;
        this.code = code;
        this.status = status;
        this.extra = {};
    }

    serialize(): IApiResponse<{ err: ICustomerErrorDTO }> {
        return new ApiResponse (false, {err: {message: this.message, code: this.code}})
    }

}

