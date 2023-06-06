import {EntityRepository} from "./EntityRepository";
import * as userTrackingQueries from "../helpers/postgresQueriesHelper/userTracking";
import {PostgresAdapter} from "../storage/PostgresAdapter";
import {UserTrackingType} from "../entities/userTrackingType";
import {DiscordChannelDataType} from "../entities/discordChannelDataType";
import {UserDiscordLastTrack} from "../entities/userDiscordLastTrack";

type UserDiscordDataType = {
    userId: string,
    discordUserId: string
}

export class DiscordRepository extends EntityRepository{
    private pgClient : PostgresAdapter;

    constructor(pgClient) {
        super();
        this.pgClient = pgClient
    }

    async getUsersDiscordData(): Promise<UserDiscordDataType[]>{
        const selectUsersDiscordDataQuery = userTrackingQueries.getSelectUsersDiscordDataQuery();
        const values: any = [];
        const response = await this.pgClient.callDbCmd(selectUsersDiscordDataQuery, values);
        return response.rows as UserDiscordDataType[]
    }
    async addUsersTracking(usersTrackingList: UserTrackingType[]): Promise<UserTrackingType[]>{
        const insertUserTrackingQueriesBucket :string[] = [];
        const insertUserTrackingValuesBucket : any[] = [];

        const insertUserTrackingQuery = userTrackingQueries.getInsertUserTrackingQuery();
        usersTrackingList.forEach((data)=>{
            insertUserTrackingQueriesBucket.push(insertUserTrackingQuery);
            insertUserTrackingValuesBucket.push([data.userId, data.discordChannelId, data.status, data.meetingId]);
        })

        const response = await this.pgClient.callDbTransaction(insertUserTrackingQueriesBucket, insertUserTrackingValuesBucket);
        const addedUsersTracking: UserTrackingType[] = [];
        for(let i = 0; i<insertUserTrackingQueriesBucket.length; i++)
            if(response[i].rowCount > 0)
                addedUsersTracking.push(response[i].rows[0])
        return addedUsersTracking;
    }

    async getUsersDiscordLastTrack(userIds: string[] | null = null): Promise<UserDiscordLastTrack[]>{
        const selectUsersDiscordLastTrackQuery = userTrackingQueries.getSelectDiscordUserLastTrackQuery();
        const values: any = [userIds];
        const response = await this.pgClient.callDbCmd(selectUsersDiscordLastTrackQuery, values);
        return response.rows as UserDiscordLastTrack[]
    }

    async findUsersTrackPreMeeting(meetingId: string) : Promise<UserTrackingType[]>{
        const selectUsersDiscordLastTrackQuery = userTrackingQueries.getSelectPreMeetingUserTrackQuery();
        const values: string[] = [meetingId];
        const response = await this.pgClient.callDbCmd(selectUsersDiscordLastTrackQuery, values);
        return response.rows as UserTrackingType[]
    }
    async findChannels(): Promise<DiscordChannelDataType[]>{
        const SelectDiscordChannelsDataQuery = userTrackingQueries.getSelectDiscordChannelsQuery();
        const values: any = [];
        const response = await this.pgClient.callDbCmd(SelectDiscordChannelsDataQuery, values);
        return response.rows as DiscordChannelDataType[]
    }
}
