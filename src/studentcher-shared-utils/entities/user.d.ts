import { IEntity, Entity } from "./entity";
export interface IUser extends IEntity {
    name: string;
    hashedPassword: string;
    phoneNumber: string | undefined;
    roleId: string | undefined;
}
export declare class User extends Entity implements IUser {
    name: string;
    hashedPassword: string;
    phoneNumber: string | undefined;
    roleId: string | undefined;
    constructor(id: string, createdAt: Date, updatedAt: Date, name: string, hashedPassword: string, phoneNumber: string, roleId: string);
}
export interface IUserDTO extends IEntity {
    name: string;
    phoneNumber: string | undefined;
    roleId: string | undefined;
}
