import {IBase, IEntity} from "./entity";

export interface IMeeting  extends IEntity{
    createdBy: string,
    discordChannelId: string,
    endedAt?: Date | undefined,

}

export interface IUserMeeting extends IBase{
    userId: string,
    meetingId: string,
    note: string,
    rate: number
}
