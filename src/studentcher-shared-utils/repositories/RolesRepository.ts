import {EntityRepository} from "./EntityRepository";
import {IClientRequestData} from "../models/ClientRequestData";
import {Role} from "../entities/roles";
import * as userManagementQueries from "../helpers/postgresQueriesHelper/userManagement";
import * as questionsManagementQueries from "../helpers/postgresQueriesHelper/questionsManagement";
import {PostgresAdapter} from "../storage/PostgresAdapter";
import {CustomError} from "../models/CustomError";
import {IUserPermissions} from "../entities/userPermissions";

export class RolesRepository extends EntityRepository{
    private dbClient : PostgresAdapter;

    constructor(pgClient) {
        super();
        this.dbClient = pgClient
    }
    async findMany(data: IClientRequestData): Promise<Role[]>{
        const selectRolesDataQuery: string = userManagementQueries.getSelectRolesDataQuery();
        const selectRolesDataValues: string[] = [data.userId];
        const response = await this.dbClient.callDbCmd(selectRolesDataQuery, selectRolesDataValues)
        return response.rows
    }

    async isRoleAccessible(data: IClientRequestData): Promise<boolean>{
        const response = await this.dbClient.callDbCmd(userManagementQueries.getSelectIsRoleIdValid(), [data.userId, data.roleId]);
        if(response.rows[0].count === 0)
            throw new CustomError("User not having needed permissions, access denied");
        return response.rows[0].isRoleAccessible
    }

    async isUserPermissionAllowed(data: IClientRequestData): Promise<boolean>{
        const sqlQuery = userManagementQueries.getSelectIsUserPermissionAllowedQuery(data.permissionField);
        const values = [data.userId];
        const response = await this.dbClient.callDbCmd(sqlQuery, values);
        return response.rows[0].isUserPermissionAllowed;
    }

    async findUserPermissions(data: IClientRequestData) :Promise<IUserPermissions>{
        const selectUserPermissionsQuery: string = userManagementQueries.getSelectUserPermissionsQuery();
        const values = [data.userId];
        const response = await this.dbClient.callDbCmd(selectUserPermissionsQuery, values);
        return response.rows[0].userPermissions;
    }

    async isQuestionsAccessible(data: IClientRequestData): Promise<boolean>{
        const response = await this.dbClient.callDbCmd(questionsManagementQueries.getSelectAreQuestionsAccessible(), [data.questionIds, data.userId]);
        if(!response.rows[0].IsAccessAllowed)
            throw new CustomError("User not having needed permissions to access this question");
        return response.rows[0].IsAccessAllowed
    }
    async isQuestionCommentsAccessible(commentIds: string[], userId): Promise<boolean>{
        const response = await this.dbClient.callDbCmd(questionsManagementQueries.getSelectAreQuestionCommentsAccessible(), [commentIds, userId]);
        return response.rows[0].IsAccessAllowed as boolean
    }

    async areQuizzesAccessible(quizzesIds: string[], userId): Promise<boolean>{
        const response = await this.dbClient.callDbCmd(questionsManagementQueries.getSelectAreQuizzesAccessible(), [quizzesIds, userId]);
        return response.rows[0].IsAccessAllowed as boolean;
    }

    async isUserInTest({userId}): Promise<boolean>{
        const response = await this.dbClient.callDbCmd(questionsManagementQueries.getIsUserInTestQuery(), [userId]);
        return response.rows[0].isUserInTest as boolean;
    }


    static async  addOne(_data: IClientRequestData): Promise<Role> {
        throw new Error("Method not implemented.");
    }

    static async  deleteMany(_data: IClientRequestData): Promise<Role[]> {
        throw new Error("Method not implemented.");
    }

    static editOne(_data: IClientRequestData): Promise<Role> {
        throw new Error("Method not implemented.");
    }
}
