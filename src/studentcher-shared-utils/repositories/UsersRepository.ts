import {EntityRepository} from "./EntityRepository";
import {IClientRequestData} from "../models/ClientRequestData";
import {IUserDTO} from "../entities/user";
import {PostgresAdapter} from "../storage/PostgresAdapter";
import * as userManagementQueries from "../helpers/postgresQueriesHelper/userManagement"
import {CustomError} from "../models/CustomError";
import {IUserPrivateZone} from "../entities/userPrivateZone";
import {DdCommand} from "../storage/DdCommand";
import {UserActivityMetaData} from "../entities/userActivityMetaData";
import {IUserActivityVideoStatus} from "../entities/userActivityVideoStatus";

export class UsersRepository extends EntityRepository{
    private pgClient : PostgresAdapter;

    constructor(pgClient) {
        super();
        this.pgClient = pgClient
    }
    async addOne(data: IClientRequestData): Promise<IUserDTO> {
        const insertUserQuery = userManagementQueries.getInsertUserQuery();
        const insertUserValues = [data.id, data.name, data.hashedPassword, data.phoneNumber, data.roleId, data.discordUserId];
        const response = await this.pgClient.callDbCmd(insertUserQuery, insertUserValues);
        return response.rows[0];
    }

    async deleteMany(data: IClientRequestData): Promise<IUserDTO[]> {
        const updateUserQuery = userManagementQueries.getDeleteUsersQuery();
        const updateUserValues = [data.userIds];
        const response = await this.pgClient.callDbCmd(updateUserQuery, updateUserValues);
        if(response.rowCount === 0)
            throw new CustomError("Users not found.");
        return response.rows;
    }

    async editOne(data: IClientRequestData): Promise<IUserDTO> {
        const updateUserQuery = userManagementQueries.getUpdateUserQuery();
        const updateUserValues = [data.id, data.phoneNumber, data.name, data.roleId, data.hashedPassword, data.discordUserId];
        const response = await this.pgClient.callDbCmd(updateUserQuery, updateUserValues);
        if(response.rowCount === 0)
            throw new CustomError("User not found.");
        return response.rows[0];
    }

    async findMany(data: IClientRequestData): Promise<IUserDTO[]> {
        const selectUsersQuery: string = userManagementQueries.getSelectUsersQuery();
        const selectUsersValues: string[] = [data.userId];
        const response = await this.pgClient.callDbCmd(selectUsersQuery, selectUsersValues);
        return response.rows;
    }

    async getPrivateZone(data: IClientRequestData): Promise<IUserPrivateZone> {
        const selectPersonalZoneQuery = userManagementQueries.getSelectPersonalZoneQuery();
        const selectPersonalZoneValues = [data.userId];
        const response = await this.pgClient.callDbCmd(selectPersonalZoneQuery, selectPersonalZoneValues);
        const privateZone = response.rows[0];
        if(privateZone == null)
            throw new CustomError("Personal zone not found.");
        return privateZone as IUserPrivateZone;
    }

    async findOne(data: IClientRequestData): Promise<IUserDTO>{
        const selectUserDataQuery: string = userManagementQueries.getSelectUserDataQuery();
        const values = [data.userId];
        const response = await this.pgClient.callDbCmd(selectUserDataQuery, values);
        return response.rows[0];
    }

    async addUserActivity(data :IClientRequestData) : Promise<void>{
        const insertUserActivity: string = userManagementQueries.getInsertUserActivityQuery();
        const values = [data.userId, data.planId, data.activityId, data.isEnded];
        await this.pgClient.callDbCmd(insertUserActivity, values);
    }

    async addUserActivityVideo(data :IClientRequestData) : Promise<IUserActivityVideoStatus>{
        const insertUserActivity: string = userManagementQueries.getInsertUserActivityVideoStatusQuery();
        const values = [data.userId, data.planId, data.activityId, data.videoIndex, data.isCompleted];
        const response = await this.pgClient.callDbCmd(insertUserActivity, values);
        return response.rows[0] as IUserActivityVideoStatus;
    }

    async finDUsersMetaData(): Promise<UserActivityMetaData[]>{
        const selectUserMetaDataCmd = new DdCommand(userManagementQueries.getSelectUserMetaData(), [])
        const response = await this.pgClient.callDb(selectUserMetaDataCmd);
        return response.rows as UserActivityMetaData[];
    }
}
