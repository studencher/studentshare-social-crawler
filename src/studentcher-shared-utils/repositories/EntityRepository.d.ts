import { IEntity } from "../entities/entity";
import { IClientRequestData } from "../models/ClientRequestData";
export declare abstract class EntityRepository {
    static addOne(_data: IClientRequestData): Promise<IEntity>;
    static deleteMany(_data: IClientRequestData): Promise<IEntity[]>;
    static editOne(_data: IClientRequestData): Promise<IEntity>;
    static findMany(_data: IClientRequestData): Promise<IEntity[]>;
}
