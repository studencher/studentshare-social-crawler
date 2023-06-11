import {RolesRepository} from "../repositories/RolesRepository";
import * as bcrypt from "bcrypt";

import {UsersRepository} from "../repositories/UsersRepository";
import {IUserDTO} from "../entities/user";
import {CustomError} from "../models/CustomError";
import {IClientRequestData} from "../models/ClientRequestData";
import {ApiResponse} from "../models/ApiResponse";
import {Validations} from "../helpers/Validations";
import {ServiceResponse} from "../models/ServiceResponse";
import {Role} from "../entities/roles";
import {IUserPrivateZone} from "../entities/userPrivateZone";
import {ICloudService} from "./CloudService";
import {Constants} from "../helpers/Constants";
import {IVideoMetaData, UserActivityMetaData} from "../entities/userActivityMetaData";
import {IUserActivityVideoStatus} from "../entities/userActivityVideoStatus";

export interface IUsersService {
    getUsers(data: IClientRequestData): Promise<ServiceResponse<{ users: IUserDTO[]; roles: Role[] }>>;
    getUser(data: IClientRequestData): Promise<ServiceResponse<IUserDTO>>;
    addUser(data: IClientRequestData): Promise<ServiceResponse<{ user: IUserDTO }>>;
    editUser(data: IClientRequestData): Promise<ServiceResponse<{ user: IUserDTO }>>;
    deleteUsers(data: IClientRequestData): Promise<ServiceResponse<{ users: IUserDTO[] }>>;
    getPersonalZone(data: IClientRequestData): Promise<ServiceResponse<{ privateZone: IUserPrivateZone }>>;
    addUserActivity(data: IClientRequestData): Promise<ServiceResponse<{}>>;
    getUsersCloudUsage(): Promise<ServiceResponse<{ userCloudUsages: any, billing: any }>>;
    addUserActivityVideoStatus(data: IClientRequestData): Promise<ServiceResponse<{ userActivityVideoStatus: IUserActivityVideoStatus }>>;
}
export class UsersService implements IUsersService{

    static encryptionHandler = bcrypt
    userRepository: UsersRepository;
    rolesRepository: RolesRepository;
    cloudService: ICloudService;

    constructor(userRepository, rolesRepository, cloudService) {
        this.userRepository = userRepository;
        this.rolesRepository = rolesRepository;
        this.cloudService = cloudService;
    }
    private static validateUserFields(data: IClientRequestData){
        if(data.id == null)
            throw new CustomError("User's id must be provided.")
        if(data.password != null) {
            const {result, message} = Validations.isPasswordValid(data.password);
            if(!result)
                throw new CustomError(message)
        }
        if(data.phoneNumber != null){
            const {result, message} = Validations.isPhoneNumberValid(data.phoneNumber);
            if(!result)
                throw new CustomError(message);
        }
    }

    async getUsers (data: IClientRequestData)  :Promise<ServiceResponse> {
        try{
            const users: IUserDTO[] = await this.userRepository.findMany(data);
            const roles: Role[] = await this.rolesRepository.findMany(data);
            return { response: new ApiResponse(true, {users, roles}) }
        }catch(err){
            return {err}
        }
    }

    async getUser(data: IClientRequestData): Promise<ServiceResponse> {
        try{
            const user: IUserDTO = await this.userRepository.findOne(data);
            return { response: new ApiResponse(true, { ...user }) }
        }catch(err){
            return {err}
        }
    }

    async addUser(data: IClientRequestData) :Promise<ServiceResponse> {
        try{
            const {result, message} = Validations.areFieldsProvided(["password", "name", "roleId", "discordUserId"], data);
            if(!result)
                return {err: new CustomError(message)}
            UsersService.validateUserFields(data);
            data.hashedPassword = await UsersService.encryptionHandler.hash(data.password, 12);
            const user: IUserDTO = await this.userRepository.addOne(data);
            return { response: new ApiResponse(true, {user}) }
        }catch (err: any){
            if (err.constraint === "users_pkey")
                return {err: new CustomError("Email already registered in the system.")}
            return {err}
        }
    }

    async editUser(data: IClientRequestData) :Promise<ServiceResponse>{
        try{
            if(data.id == null)
                return {err: new CustomError("User's id must be provided.")};
            UsersService.validateUserFields(data);
            if(data.password != null)
                data.hashedPassword = await UsersService.encryptionHandler.hash(data.password, 12);
            const user: IUserDTO = await this.userRepository.editOne(data);

            return { response: new ApiResponse(true, {user}) }
        }catch(err){
            return {err}
        }
    }

    async deleteUsers(data: IClientRequestData) :Promise<ServiceResponse>{
        try{
            if(data.userIds.length === 0)
                return {err: new CustomError("Users' ids must be provided")};
            if(data.userIds.includes(data.id))
                return {err: new CustomError("User cannot delete itself")};

            const users: IUserDTO[] = await this.userRepository.deleteMany(data)
            return { response: new ApiResponse(true, {users}) }
        }catch(err){
            return {err}
        }
    }

    async getPersonalZone(data: IClientRequestData) :Promise<ServiceResponse>{
        try{
            const privateZoneData: IUserPrivateZone = await this.userRepository.getPrivateZone(data);
            const totalVideos = privateZoneData?.currentActivity?.videos.length || 0;
            const signedVideos = [];
            for(let i =0; i < totalVideos; i++){
                const videoData = privateZoneData.currentActivity.videos[i];
                const {response, err} = await this.cloudService.generatePreSignUrl({fileName: videoData.fileName, action: Constants.CLOUD_STORAGE_PRE_SIGNED_URL_READ_ACTION});
                if(err != null)
                    return {err}
                delete videoData.fileName;
                signedVideos.push({...videoData, srcUrl: response.data.preSignedUrl});
            }
            privateZoneData.currentActivity = {...privateZoneData.currentActivity, videos: signedVideos};
            return { response: new ApiResponse(true, {privateZone: privateZoneData}) }
        }catch(err){
            return {err}
        }
    }

    async addUserActivity(data: IClientRequestData) : Promise<ServiceResponse>{
        try{
            const {result, message} = Validations.areFieldsProvided(["userId", "planId", "activityId"], data);
            if(!result)
                return {err: new CustomError(message)}
            await this.userRepository.addUserActivity(data);
           return { response: new ApiResponse(true, {}) }
        }catch (err: any){
            if(err.constraint === "user_activity_history_pkey")
                return {err: new CustomError("(user_id, plan_id, activity_id) already monitored in the system")}
            return{err}
        }
    }

    async addUserActivityVideoStatus(data: IClientRequestData) : Promise<ServiceResponse>{
        try{
            const {result, message} = Validations.areFieldsProvided(["userId", "planId", "activityId", "videoIndex"], data);
            if(!result)
                return {err: new CustomError(message)}
            const userActivityVideoStatus: IUserActivityVideoStatus = await this.userRepository.addUserActivityVideo(data);
            return { response: new ApiResponse(true, {userActivityVideoStatus}) }
        }catch (err: any){
            if(err.constraint === "user_activity_history_pkey")
                return {err: new CustomError("(user_id, plan_id, activity_id) already monitored in the system")}
            return{err}
        }
    }
    private getUsersEventsByUsersMetaDataList(userActivityMetaDataList:  UserActivityMetaData[]) : Record<string, IVideoMetaData[]>{
        const eventsByUserActivity: Record<string, IVideoMetaData[]> = {};

        for (const activityMetaData of userActivityMetaDataList) {
            const { userId, planId, activityId, metaData, timestamp, videoIndex } = activityMetaData;

            if (metaData.type === 'play' ||metaData.type === 'pause') {
                const key = `${userId}-${planId}-${activityId}-${videoIndex}`;
                if (!eventsByUserActivity[key]) {
                    eventsByUserActivity[key] = [];
                }
                eventsByUserActivity[key].push({
                    type: metaData.type,
                    timestamp
                });
            }
        }

        return eventsByUserActivity;
    }

    private analyzeAndExtractUsersEvents(usersEventsIndex: Record<string, IVideoMetaData[]>){
        const usersUsageIndex: Record<string, any> = {}
        let allUsersTotalDuration = 0;
        let allUsersEventsCounter = 0;
        for (const key of Object.keys(usersEventsIndex)) {
            const events = usersEventsIndex[key];
            const [userId, _planId, _activityId, _videoIndex] = key.split('-');
            let userEventsCounter = 0;
            let userPlayDuration = 0;
            for (let i = 0; i < events.length - 1; i++) {
                userEventsCounter++;

                if (events[i].type === 'play' && events[i + 1].type === 'pause') {
                    const duration = events[i + 1].timestamp - events[i].timestamp;
                    userPlayDuration += duration;
                }
            }
            if (usersUsageIndex[userId] == null)
                usersUsageIndex[userId] = {
                    userPlayDuration: 0,
                    userEventsNum: 0
                }
            usersUsageIndex[userId].userPlayDuration += userPlayDuration;
            usersUsageIndex[userId].userEventsNum += userEventsCounter;
            allUsersTotalDuration += userPlayDuration;
            allUsersEventsCounter += userEventsCounter;
        }
        return {usersUsageIndex, allUsersTotalDuration, allUsersEventsCounter}

    }

    private getCalculatedUsersUsage(usersEventsIndex: Record<string, IVideoMetaData[]>): IUserCloudUsage[]{
        const userUsages: IUserCloudUsage[] = [];
        const { usersUsageIndex, allUsersTotalDuration ,allUsersEventsCounter} = this.analyzeAndExtractUsersEvents(usersEventsIndex);
        for (const userId in usersUsageIndex){
            const {userPlayDuration, userEventsNum} = usersUsageIndex[userId];
            const playPercentage = allUsersTotalDuration ? userPlayDuration / allUsersTotalDuration : 0;

            const userUsage: IUserCloudUsage = {
                userId,
                playPercentage,
                eventsPercentage: userEventsNum / allUsersEventsCounter,
            };

            userUsages.push(userUsage);
        }
        return userUsages;
    }
    async getUsersCloudUsage(): Promise<ServiceResponse> {
        try {


            const userActivityMetaDataList = await this.userRepository.finDUsersMetaData();
            const usersEventsIndex: Record<string, IVideoMetaData[]> = this.getUsersEventsByUsersMetaDataList(userActivityMetaDataList);
            const userCloudUsages: IUserCloudUsage[] = this.getCalculatedUsersUsage(usersEventsIndex);

            const billing: number = await this.cloudService.getBucketBilling();

            return { response: new ApiResponse(true, { userCloudUsages, billing }) };
        } catch (err) {
            return { err };
        }
    }


}
