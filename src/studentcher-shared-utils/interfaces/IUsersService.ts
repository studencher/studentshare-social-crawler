import { IClientRequestData } from "../models/ClientRequestData";
import { ServiceResponse } from "../models/ServiceResponse";
import { Role } from "../entities/roles";
import { IUserDTO } from "../entities/user";
import { IUserPrivateZone } from "../entities/userPrivateZone";
import { ApiResponse } from "../models/ApiResponse";

export interface IUsersService {
    getUsers(data: IClientRequestData): Promise<ServiceResponse<ApiResponse<{ users: IUserDTO[]; roles: Role[] }>>>;
    getUser(data: IClientRequestData): Promise<ServiceResponse<ApiResponse<IUserDTO>>>;
    addUser(data: IClientRequestData): Promise<ServiceResponse<ApiResponse<{ user: IUserDTO }>>>;
    editUser(data: IClientRequestData): Promise<ServiceResponse<ApiResponse<{ user: IUserDTO }>>>;
    deleteUsers(data: IClientRequestData): Promise<ServiceResponse<ApiResponse<{ users: IUserDTO[] }>>>;
    getPersonalZone(data: IClientRequestData): Promise<ServiceResponse<ApiResponse<{ privateZone: IUserPrivateZone }>>>;
    addUserActivity(data: IClientRequestData): Promise<ServiceResponse<ApiResponse<{}>>>;
    getUsersCloudUsage(): Promise<ServiceResponse<ApiResponse<{ userCloudUsages: any, billing: any }>>>;
}

