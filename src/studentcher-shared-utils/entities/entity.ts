export interface IBase{
    createdAt: Date,
    updatedAt: Date
}

export interface IEntity extends IBase{
    id: string
}

export class Entity implements IEntity{
    id: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(id: string, createdAt: Date, updatedAt: Date) {
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

