import {IEntity, Entity} from "./entity"

export interface IUser extends IEntity{
    name: string,
    hashedPassword: string,
    phoneNumber: string | undefined,
    roleId: string | undefined,
    dateOfBirth: Date,
    profilePictureUrl: string
}

export class User extends Entity implements IUser{
    name: string;
    hashedPassword: string;
    discordUserId: string;
    phoneNumber: string | undefined;
    roleId: string | undefined;
    dateOfBirth: Date;
    profilePictureUrl: string;

    constructor(id: string, createdAt: Date, updatedAt: Date, name: string,
                hashedPassword: string, phoneNumber: string, roleId: string, discordUserId: string,
                dateOfBirth: Date, profilePictureUrl: string ) {
        super(id, createdAt, updatedAt);
        this.name = name;
        this.hashedPassword = hashedPassword;
        this.discordUserId = discordUserId;
        this.roleId = roleId;
        this.dateOfBirth = dateOfBirth;
        this.profilePictureUrl = profilePictureUrl;
    }
}
export interface IUserDTO extends IEntity{
    name: string,
    phoneNumber: string | undefined
    roleId: string | undefined
    discordUserId: string;
    dateOfBirth: Date;
    profilePictureUrl: string;
}


