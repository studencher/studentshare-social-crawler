import { Entity } from "../entities/entity";
import { IClientRequestData } from "../models/ClientRequestData";
export declare abstract class EntityRepository {
    static addOne(_data: IClientRequestData): Promise<Entity>;
    static deleteMany(_data: IClientRequestData): Promise<Entity[]>;
    static editOne(_data: IClientRequestData): Promise<Entity>;
    static findMany(_data: IClientRequestData): Promise<Entity[]>;
}
