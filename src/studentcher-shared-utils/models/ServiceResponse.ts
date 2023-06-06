import {ApiResponse} from "./ApiResponse";

export class ServiceResponse<T = any> {
    response?: ApiResponse<T>;
    err?: Error;

    constructor(response?: ApiResponse<T>, err?: Error) {
        if (response) {
            this.response = response;
        }
        if (err) {
            this.err = err;
        }
    }
}
