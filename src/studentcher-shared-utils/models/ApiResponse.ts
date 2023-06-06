export interface IApiResponse<T> {
    success: boolean,
    data: T
}

interface IEmpty {}

export class ApiResponse<T extends IEmpty> implements IApiResponse<T> {
    success: boolean;
    data: T;

    constructor(success: boolean, data: T = {} as T) {
        this.success = success;
        this.data = data;
    }
}
