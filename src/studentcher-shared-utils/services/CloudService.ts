import * as uuid from "uuid";
import {CloudBucketAdapter} from "../storage/CloudBucketAdapter";
import {ServiceResponse} from "../models/ServiceResponse";
import {IClientRequestData} from "../models/ClientRequestData";
import {Validations} from "../helpers/Validations";
import {CustomError} from "../models/CustomError";
import {ApiResponse} from "../models/ApiResponse";
import {Constants} from "../helpers/Constants";
import * as process from "process";

export  interface ICloudService {
    generatePreSignUrl(data: IClientRequestData): Promise<ServiceResponse<{preSignedUrl: string, fileName: string}>>;
    getBucketBilling(): Promise<number>;
}
export class CloudService implements  ICloudService{
    private static idGenerator = uuid.v1;
    private static directoriesIndex: Record<string, string> = {
        questions: "stack-overflow-module/questions",
        answers: "stack-overflow-module/answers",
        activities: Constants.CLOUD_ACTIVITIES_VIDEOS_BUCKET_PREFIX,
        interviewQuestions: 'interviewer-module/questions',
        interviewAnswers: 'interviewer-module/answers'
    };
    private static signedUrlActionsIndex: Record<string, boolean> = {
        [Constants.CLOUD_STORAGE_PRE_SIGNED_URL_READ_ACTION]: true,
        [Constants.CLOUD_STORAGE_PRE_SIGNED_URL_WRITE_ACTION]: true
    };
    private static filesExtensionIndex: Record<string, boolean> = {
        "mp4": true,
        "webm": true
    };

    private cloudBucketAdapter: CloudBucketAdapter;
    constructor(cloudBucketAdapter) {
        this.cloudBucketAdapter = cloudBucketAdapter;
    }

    async generatePreSignUrl(data: IClientRequestData): Promise<ServiceResponse>{
        try{
            const {result, message} = Validations.areFieldsProvided(["fileName", "action"], data);
            if(!result)
                return {err: new CustomError(message)};
            if(CloudService.signedUrlActionsIndex[data.action] == null)
                return {err: new CustomError(`Invalid action: ${data.action}`)};

            if(data.directory != null && (CloudService.directoriesIndex[data.directory] == null))
                return {err: new CustomError(`Invalid directory ${data.directory}`)}

            if(data.action === Constants.CLOUD_STORAGE_PRE_SIGNED_URL_WRITE_ACTION) {
                if(typeof data.fileName !== "string" || data.fileName.indexOf(".") === -1 )
                    return {err: new CustomError("Invalid file name")};
                const fileExtension = data.fileName.split('.').pop();
                if(CloudService.filesExtensionIndex[fileExtension] == null)
                    return {err: new CustomError(`File extension ${fileExtension} is forbidden.`)};

                data.fileName = `${data.fileName.split('.')[0]}_${CloudService.idGenerator()}.${fileExtension}`;
            }
            const fileName = data.directory == null ? data.fileName : `${CloudService.directoriesIndex[data.directory]}/${data.fileName}`;

            const preSignedUrl: string = await this.cloudBucketAdapter.getSignedUrl(fileName, data.action);
            return { response: new ApiResponse(true, {preSignedUrl, fileName}) }
        }catch (err){
            return {err};
        }
    }

    async getBucketBilling(){
        const region = process.env.CLOUD_BUCKET_REGION;
        const billing : number =  await this.cloudBucketAdapter.getBucketBilling(region);
        return billing;
    }

    async getActivitiesVideosOnCloud(){
        return this.cloudBucketAdapter.getFileNamesFromBucketByPrefix(Constants.CLOUD_ACTIVITIES_VIDEOS_BUCKET_PREFIX);
    }
}

