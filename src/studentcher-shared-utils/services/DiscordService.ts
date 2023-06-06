import { IClientRequestData } from "../models/ClientRequestData";
import { CustomError } from "../models/CustomError";
import { ServiceResponse } from "../models/ServiceResponse";
import {DiscordRepository} from "../repositories/DiscordRepository";
import {validationResponse, Validations} from "../helpers/Validations";
import { ApiResponse } from "../models/ApiResponse";
import {UserTrackingType} from "../entities/userTrackingType";
import {Constants} from "../helpers/Constants";
import {DiscordChannelDataType} from "../entities/discordChannelDataType";

export interface IDiscordService {
    getUsersDiscordDataIndex(): Promise<ServiceResponse<{usersIndex: Record<string, string>}>>;
    addUsersTracking(data: IClientRequestData): Promise<ServiceResponse<{usersTracking: UserTrackingType[]}>>;
    getDiscordChannelsData(): Promise<ServiceResponse<{discordChannelsData: DiscordChannelDataType[]}>>;
    areUsersValid(data: IClientRequestData): Promise<ServiceResponse<{areUsersValid: boolean}>>;
    getUsersPreMeetingTracking(meetingId: string): Promise<ServiceResponse<{usersTracking: UserTrackingType[]}>>;
    getUserLastDiscordTrack(): Promise<ServiceResponse<{usersLastTrack: UserTrackingType[]}>>
}
export class DiscordService implements IDiscordService{
    discordRepository: DiscordRepository;

    constructor(discordRepository) {
        this.discordRepository = discordRepository;
    }
    static isUserStatusValid(status: string | undefined): boolean{
        if(status == null)
            return false;
        const optionalStatuses = [Constants.DISCORD_MEMBER_ACTIVE_STATUS, Constants.DISCORD_MEMBER_BREAK_STATUS,
            Constants.DISCORD_MEMBER_BUSY_STATUS, Constants.DISCORD_MEMBER_LEFT_STATUS];
        return optionalStatuses.includes(status);
    }

    static areUserTrackingInputsValid(usersTracking: any): validationResponse{
        const errorMessages: string[] = []
        if(usersTracking == null || !Array.isArray(usersTracking) || usersTracking.length === 0)
            return {result: false, message: `usersTracking: ${usersTracking} field must be provided as an array`}
        for(let i = 0; i <usersTracking.length  ; i++){
            const userTracking = usersTracking[i];
            const {result, message} = Validations.areFieldsProvided(["userId"], userTracking);
            if(userTracking.status != null && !DiscordService.isUserStatusValid(userTracking.status))
                errorMessages.push("Invalid status provided.");
            if(!result)
                errorMessages.push(message)
        }
        const successResponse = {result: true, message: ""};
        const failedResponse = {result: false, message: errorMessages.join()};
        return errorMessages.length === 0 ? successResponse : failedResponse;
    }
    async getUsersDiscordDataIndex() : Promise<ServiceResponse>{
        try {
            const usersData = await this.discordRepository.getUsersDiscordData();
            const usersIndex :Record<string, string> = usersData.filter(({discordUserId})=> discordUserId != null)
                .reduce((allUsers, {userId, discordUserId})=>{
                return {
                    ...allUsers,
                    [userId]: discordUserId,
                }
            }, {})
            return {response: new ApiResponse(true, {usersIndex})}
        }catch (err){
            return {err}
        }
    }
    async addUsersTracking(data: IClientRequestData) : Promise<ServiceResponse>{
        try {
            const usersTracking = data.usersTracking;
            const {result, message} = DiscordService.areUserTrackingInputsValid(usersTracking);
            if(!result)
                return {err: new CustomError(message)}
            const addedUsersTracking = await this.discordRepository.addUsersTracking(usersTracking);
            return {response: new ApiResponse(true, {usersTracking: addedUsersTracking})}
        }catch (err){
            return {err}
        }
    }

    async getUserLastDiscordTrack() : Promise<ServiceResponse>{
        try {
            const usersLastTrack = await this.discordRepository.getUsersDiscordLastTrack();
            return {response: new ApiResponse(true, {usersLastTrack})}
        }catch (err){
            return {err}
        }
    }

    async getDiscordChannelsData() : Promise<ServiceResponse>{
        try {
            const discordChannelsData = await this.discordRepository.findChannels();
            return {response: new ApiResponse(true, {discordChannelsData})}
        }catch (err){
            return {err}
        }
    }
    async areUsersValid(userIds: string[]) : Promise<ServiceResponse>{
        try{
            if(userIds.length === 0)
                return {err: new CustomError("Invalid value for userIds.")};
            const userLastTrackRows = await this.discordRepository.getUsersDiscordLastTrack(userIds);
            if(userLastTrackRows == null || userLastTrackRows.length !== userIds.length)
                return {err: new CustomError("User not found.")};
            const invalidUsers = userLastTrackRows.filter(({status})=> status !==  Constants.DISCORD_MEMBER_ACTIVE_STATUS)
            if(invalidUsers.length !== 0)
                return {err: new CustomError(`Invalid users: ${invalidUsers.map(({id, status})=> `[${id}: ${status}]`).join()}`)};
            return {response: new ApiResponse(true,  {areUsersValid: true})};
        }catch (err){
            return {err}
        }
    }

    async getUsersPreMeetingTracking(meetingId : string) : Promise<ServiceResponse>{
        try{
            if(meetingId == null)
                return {err: new CustomError("Meeting id must be provided")};
            const usersTracking : UserTrackingType[] = await this.discordRepository.findUsersTrackPreMeeting(meetingId);
            return {response: new ApiResponse(true, {usersTracking})}
        }catch (err){
            return {err}
        }
    }
}

