import {ApiResponse} from "./ApiResponse";

export interface IServiceResponse<T> {
    data?: T;
    err?: Error;
}

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
//
// const test: IServiceResponse<{test: any[]}> = {
//     data: {
//         test: []
//     }
// }
