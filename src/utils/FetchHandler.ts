import axios from 'axios';

export interface IFetchHandler {
    get(url: string): Promise<any>;
    post(url: string, data: any): Promise<any>;
    put(url: string, data: any): Promise<any>;
    patch(url: string, data: any): Promise<any>;
    delete(url: string): Promise<any>;
}

export class FetchHandler implements IFetchHandler{
    constructor() {}

    async get(url: string) {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            throw new Error(this.extractErrorMessage(error));
        }
    }

    async post(url: string, data: any) {
        try {
            const response = await axios.post(url, data);
            return response.data;
        } catch (error) {
            throw new Error(this.extractErrorMessage(error));
        }
    }

    async put(url: string, data: any) {
        const response = await axios.put(url, data);
        return response.data;
    }

    async patch(url: string, data: any) {
        try {
            const response = await axios.patch(url, data);
            return response.data;
        } catch (error) {
            throw new Error(this.extractErrorMessage(error));
        }
    }

    async delete(url: string) {
        try {
            const response = await axios.delete(url);
            return response.data;
        } catch (error) {
            throw new Error(this.extractErrorMessage(error));
        }
    }

    extractErrorMessage(error: any) {
        if(error?.response?.data?.message != null) {
            return error.response.data.message;
        }
        return error.message;
    }

}

export default new FetchHandler();
