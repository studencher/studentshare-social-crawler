import {IActivityVideo, IUserActivityVideo} from "./activity";

interface IUserCurrentActivityBase{
    activityId: string,
    name: string,
    index: number,
    responsibleRoleId: string,
    maxThresholdInDays: string,
}

export interface IUserCurrentActivity extends IUserCurrentActivityBase{
    videos: IActivityVideo[]
}

export interface IUserCurrentActivityDTO extends IUserCurrentActivityBase{
    videos: IUserActivityVideo[]
}

export interface IUserPrivateZoneBase{
    userId: string,
    userName: string,
    roleName: string,
    planeName: string,
    planId: string
}
export interface IUserPrivateZone extends IUserPrivateZoneBase{
    currentActivity: IUserCurrentActivity
}

export interface IUserPrivateZoneDTO extends IUserPrivateZoneBase{
    currentActivity: IUserCurrentActivityDTO
}
