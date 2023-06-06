export interface IEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Entity implements IEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    constructor(id: string, createdAt: Date, updatedAt: Date);
}
