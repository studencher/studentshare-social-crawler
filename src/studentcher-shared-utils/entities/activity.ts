import {IEntity, Entity} from "./entity"

interface IActivityVideoBase{
    title: string,
    index: number,
    srcUrl: string,
}
export interface IUserActivityVideo extends IActivityVideoBase{
    isViewed: boolean
}

export interface IActivityVideo extends IActivityVideoBase{
    fileName: string
}

export interface IActivity extends IEntity{
    name: string,
    ownerId: string | undefined,
    srcUrl: string | undefined,
    responsibleRoleId: string | undefined;
    videos: IActivityVideo[];
}

export class Activity extends Entity implements IActivity{
    name: string;
    ownerId: string | undefined;
    srcUrl: string | undefined;
    responsibleRoleId: string | undefined;
    videos: any[];

    constructor(id: string, createdAt: Date, updatedAt: Date, name: string,
                ownerId: string, phoneNumber: string, srcUrl: string, responsibleRoleId: string, videos: any[]= []) {
        super(id, createdAt, updatedAt);
        this.name = name;
        this.ownerId = ownerId;
        this.srcUrl = srcUrl;
        this.responsibleRoleId = responsibleRoleId;
        this.videos = videos
    }

}
