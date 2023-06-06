import * as queries from "../helpers/postgresQueriesHelper/activityManagement";
import {EntityRepository} from "./EntityRepository";
import {PostgresAdapter} from "../storage/PostgresAdapter";
import {IClientRequestData} from "../models/ClientRequestData";
import {Activity} from "../entities/activity";
import {CustomError} from "../models/CustomError";


export class ActivitiesRepository extends EntityRepository{
    static queries = queries;
    private pgClient : PostgresAdapter;

    constructor(pgClient) {
        super();
        this.pgClient = pgClient;
    }
    async findMany(_data: IClientRequestData): Promise<Activity[]>{
        const selectActivitiesQuery: string = ActivitiesRepository.queries.getSelectActivitiesQuery();
        const selectActivitiesValues: any = [];
        const response = await this.pgClient.callDbCmd(selectActivitiesQuery, selectActivitiesValues);

        return response.rows;
    }

    async addOne(data: IClientRequestData) :Promise<Activity>{
        const insertActivityQuery: string = ActivitiesRepository.queries.getInsertActivityQuery();
        const insertActivityValues: any = [data.activityId, data.ownerId, data.name, data.srcUrl, data.maxThresholdInDays, data.responsibleRoleId];

        const insertVideoQuery: string = ActivitiesRepository.queries.getInsertVideoQuery();

        const insertVideoQueriesBucket: string[] = [];
        const insertVideoValuesBucket: any[] = [];
        data.videos.forEach((video, index)=>{
            insertVideoQueriesBucket.push(insertVideoQuery);
            insertVideoValuesBucket.push([data.activityId, index + 1, video.title, video.fileName]);
        })
        const sqlQueries: string[] = [insertActivityQuery, ...insertVideoQueriesBucket];
        const sqlValues: any[] = [insertActivityValues, ...insertVideoValuesBucket];

        const response: unknown = await this.pgClient.callDbTransaction(sqlQueries, sqlValues);
        const activity: Activity = response[0].rows[0];
        for(let i = 1; i < sqlQueries.length; i++)
            activity.videos.push(response[i].rows[0]);

        return activity;
    }

    async editOne(data: IClientRequestData) : Promise<Activity>{
        const updateActivityQuery: string = ActivitiesRepository.queries.getUpdateActivityQuery();
        const updateActivityValues: any = [data.activityId, data.ownerId, data.name, data.srcUrl, data.maxThresholdInDays, data.responsibleRoleId];

        const deleteActivityVideosQuery: string = ActivitiesRepository.queries.getDeleteActivityVideosQuery();
        const deleteActivityVideosValues: any = [data.activityId];
        const insertVideoQuery: string = ActivitiesRepository.queries.getInsertVideoQuery();

        const insertVideoQueriesBucket: string[] = [];
        const insertVideoValuesBucket: any[] = [];
        data.videos.forEach((video, index)=>{
            insertVideoQueriesBucket.push(insertVideoQuery);
            insertVideoValuesBucket.push([data.activityId, index + 1, video.title, video.fileName]);
        })
        const sqlQueries: string[] = [updateActivityQuery,  deleteActivityVideosQuery, ...insertVideoQueriesBucket];
        const sqlValues: any[] = [ updateActivityValues, deleteActivityVideosValues, ...insertVideoValuesBucket];

        const response: unknown = await this.pgClient.callDbTransaction(sqlQueries, sqlValues);
        const activity: Activity = response[0].rows[0];
        for(let i = 2; i < sqlQueries.length; i++)
            activity.videos.push(response[i].rows[0]);
        return activity;
    }

    async deleteMany(data: IClientRequestData) :Promise<Activity[]>{
        const deleteActivitiesQuery: string = ActivitiesRepository.queries.getDeleteActivitiesQuery();
        const deleteActivitiesValues: any = [data.activityIds];
        const response: any = await this.pgClient.callDbCmd(deleteActivitiesQuery, deleteActivitiesValues);
        if(response.rowCount === 0 )
            throw new CustomError("Activities not found", 404) ;
        return response.rows;
    }

    async addMetaData(data: IClientRequestData) :Promise<void>{
        const insertActivityMetaDataQuery: string  = ActivitiesRepository.queries.getInsertActivityMetaDataQuery();
        const insertActivityMetaDataValues: any[]  = [data.planId, data.activityId, data.videoIndex, data.userId, data.metaData];
        await this.pgClient.callDbCmd(insertActivityMetaDataQuery, insertActivityMetaDataValues);
    }
}
