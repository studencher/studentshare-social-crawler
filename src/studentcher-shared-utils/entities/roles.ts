import {Entity, IEntity} from "./entity";

interface IRole extends IEntity{
    name: string
}

export  class Role extends Entity implements IRole{
    name: string;
    ownerId: string | undefined;
    srcUrl: string | undefined;
    responsibleRoleId: string | undefined;

    constructor(id: string, createdAt: Date, updatedAt: Date, name: string) {
        super(id, createdAt, updatedAt);
        this.name = name;
    }


}
