import {IEntity, Entity} from "./entity"

export interface IPlan extends IEntity{
    name: string,
    ownerId: string | undefined,
    srcUrl: string | undefined,
    responsibleRoleId: string | undefined,
    activities: string[] | undefined
}

export  class Plan extends Entity implements IPlan{
    name: string;
    ownerId: string | undefined;
    srcUrl: string | undefined;
    responsibleRoleId: string | undefined;
    activities: string[] | undefined;

    constructor(id: string, createdAt: Date, updatedAt: Date, name: string) {
        super(id, createdAt, updatedAt);
        this.name = name;
    }



}
