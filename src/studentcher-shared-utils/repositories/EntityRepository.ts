import {Entity} from "../entities/entity";
import {IClientRequestData} from "../models/ClientRequestData";

export abstract class EntityRepository{
    async  addOne(_data: IClientRequestData): Promise<Entity> {
        throw new Error("Method not implemented.");
    }

    async  deleteMany(_data: IClientRequestData): Promise<Entity[]> {
        throw new Error("Method not implemented.");
    }

    editOne(_data: IClientRequestData): Promise<Entity> {
        throw new Error("Method not implemented.");
    }

    async findMany(_data: IClientRequestData): Promise<Entity[]> {
        throw new Error("Method not implemented.");
    }

}
