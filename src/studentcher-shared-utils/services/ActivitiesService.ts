import * as uuid from "uuid";
import {ActivitiesRepository} from "../repositories/ActivitiesRepository";
import {CustomError} from "../models/CustomError";
import {Validations} from "../helpers/Validations";
import {ServiceResponse} from "../models/ServiceResponse";
import {IClientRequestData} from "../models/ClientRequestData";
import {UsersRepository} from "../repositories/UsersRepository";
import {RolesRepository} from "../repositories/RolesRepository";
import {Activity, IActivity} from "../entities/activity";
import {IUserDTO} from "../entities/user";
import {Role} from "../entities/roles";
import {ApiResponse} from "../models/ApiResponse";
import {AuthorizationService} from "./AuthorizationService";

export interface IActivitiesService {
    getActivities(data: IClientRequestData):    Promise<ServiceResponse<{ activities: IActivity[],users: IUserDTO[]; roles: Role[] }>>;
    addActivity(data: IClientRequestData):      Promise<ServiceResponse<{ activity: IActivity }>>;
    editActivity(data: IClientRequestData):     Promise<ServiceResponse<{ activity: IActivity }>>;
    deleteActivities(data: IClientRequestData): Promise<ServiceResponse<{ activities: IActivity[] }>>;
    addActivityMetaData(data: IClientRequestData): Promise<ServiceResponse<{}>>;
}
export class ActivitiesService implements IActivitiesService{
    static idGenerator = uuid.v1;

    authorizationService: AuthorizationService;
    usersRepository: UsersRepository;
    activitiesRepository: ActivitiesRepository;
    rolesRepository: RolesRepository;

    constructor(authorizationService, activitiesRepository, usersRepository, rolesRepository) {
        this.authorizationService = authorizationService;
        this.activitiesRepository = activitiesRepository;
        this.usersRepository = usersRepository;
        this.rolesRepository = rolesRepository;
    }
    async getActivities(data: IClientRequestData) :Promise<ServiceResponse> {
        try{
            const activities: Activity[] = await this.activitiesRepository.findMany({});
            const users: IUserDTO[] = await this.usersRepository.findMany(data);
            const roles: Role[] = await this.rolesRepository.findMany(data);
            return { response: new ApiResponse(true, {activities, users, roles}) }

        }catch(err){
            return {err};
        }
    }

    static validatedActivityFields(data: IClientRequestData){
        if(data.videos != null){
            data.videos.forEach((video)=>{
                const {result, message} = Validations.areFieldsProvided(["title", "fileName"], video);
                if(!result)
                    throw new CustomError(message);
            })
        }
        if(data.srcUrl != null){
            const {result, message} = Validations.isUrlValid(data.srcUrl);
            if(!result)
                throw new CustomError(message)
        }
        if(data.videos != null &&  !Array.isArray(data.videos))
            throw new CustomError("Activity's videos must be an array.")
    }
    async validatedActivityFields(data: IClientRequestData) : Promise<void>{
        ActivitiesService.validatedActivityFields(data);
        if(!Array.isArray(data.videos))
            return;
        const fileNamesVerifications = data.videos.map(({fileName})=> this.authorizationService.verifyAccessToFileOnCloud(fileName));
        await Promise.all(fileNamesVerifications);
    }

    async addActivity (data: IClientRequestData) :Promise<ServiceResponse> {
        try{
            const {result, message} = Validations.areFieldsProvided(["name", "videos"], data);
            if(!result)
                return {err: new CustomError(message)};

            await this.validatedActivityFields(data);
            data.activityId = ActivitiesService.idGenerator();
            const activity = await this.activitiesRepository.addOne(data);
            return { response: new ApiResponse(true, {activity}) }
        }catch(err){
            switch (err.constraint){
                case "activities_name_key":
                    return {err: new CustomError("Name already taken and must be unique")}
                case "activities_created_by_fkey":
                    return {err: new CustomError("User id is invalid")}
                default:
                    return {err};
            }
        }
    }

    async editActivity (data: IClientRequestData) :Promise<ServiceResponse> {
        try{
            if(data.activityId == null)
                return {err: new CustomError("Activity's id must be provided")};
            await this.validatedActivityFields(data);
            const activity: Activity = await this.activitiesRepository.editOne(data);
            return { response: new ApiResponse(true, {activity}) }
        }catch(err){
            switch (err.constraint){
                case "activities_name_key":
                    return {err: new CustomError("Name already taken and must be unique")}
                case "activities_created_by_fkey":
                    return {err: new CustomError("User id is invalid")}
                case "activity_videos_src_url_check":
                    return {err: new CustomError("One of the activities' src url is invalid")}
                default:
                    return {err};
            }
        }
    }

    async deleteActivities  (data: IClientRequestData) :Promise<ServiceResponse> {
        try{
            if(data.activityIds.length === 0 )
                return {err: new CustomError("Activities' ids must be provided") };
            const activities = await this.activitiesRepository.deleteMany(data);
            return { response: new ApiResponse(true, {activities}) }
        }catch (err){
            return {err}
        }
    }
    async addActivityMetaData  (data: IClientRequestData) :Promise<ServiceResponse>{
        try{
            if(data.activityId == null )
                return {err: new CustomError("Activity' id must be provided") };
            if(data.metaData == null )
                return {err: new CustomError("Activity' meta data must be provided") };
            await this.activitiesRepository.addMetaData(data);
            return {response: new ApiResponse(true, {})}
        }catch(err){
            if(err.constraint === "activity_user_meta_data")
                return {err: new Error("Invalid data provided - (user's id, plan's id, activity's id, index) is not mention in User's activity history")}
            if(err.constraint === "user_activity_meta_data_meta_data_check")
                return {err: new CustomError("Invalid data for activity's meta data.")}
            return {err}
        }
    }
}
