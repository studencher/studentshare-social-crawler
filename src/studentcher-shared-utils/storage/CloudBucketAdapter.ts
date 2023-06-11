import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';

import {ManagedUpload} from "aws-sdk/lib/s3/managed_upload";
import {
    CreateMultipartUploadCommand,
    GetObjectCommand, PutObjectCommand,
    S3Client,
    UploadPartCommand
} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {Constants} from "../helpers/Constants";

import {Request} from "express";
import {ApiResponse} from "../models/ApiResponse";
import {ServiceResponse} from "../models/ServiceResponse";
import {PassThrough} from "stream";

import SendData = ManagedUpload.SendData;
import {file} from "../entities/file";
const iv = Buffer.alloc(16, 0);
import * as process from "process";

const getEncryptionKey = ()=>{
    const encryptionKey = process.env.ENCRYPTION_KEY_SECRET;
    if(encryptionKey == null)
        throw new Error("ENCRYPTION_KEY_SECRET is not provided")
    let result = Buffer.from(encryptionKey, 'base64');
    if (result.length !== 32) {
        const padding = Buffer.alloc(32 - result.length, 0);
        result = Buffer.concat([result, padding]);
    }
    return result;
}

const encryptionKey = getEncryptionKey();
const algorithm = 'aes-256-cbc';
const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);


const bucketName = process.env.CLOUD_BUCKET_NAME || ""
const accessKeyId = process.env.CLOUD_BUCKET_ACCESS_KEY || ""
const secretAccessKey = process.env.CLOUD_BUCKET_ACCESS_SECRET || ""
const region = process.env.CLOUD_BUCKET_REGION

const s3 = new S3Client({
    credentials:{
        accessKeyId,
        secretAccessKey
    },
    region
})

const s3v2 = new AWS.S3({
    credentials:{
        accessKeyId,
        secretAccessKey
    }
});
// const costExplorer = new AWS.CostExplorer({ region });

type actionType = "READ" | "WRITE"

export class CloudBucketAdapter{
    s3Client :S3Client;
    s3ClientV2 : AWS.S3;
    static cipher = cipher;

    constructor() {
        this.s3Client = s3
        this.s3ClientV2 = s3v2
    }
    async generateUploadId(fileObj: file){
        const createUploadResponse = await this.s3Client.send( new CreateMultipartUploadCommand({
            Key: fileObj.filename,
            Bucket: bucketName,
            ContentType: fileObj.contentType
        }))
        return createUploadResponse.UploadId;
    }
    async uploadPartialFile(fileObj :file, retry = 1) :Promise<any>{
        try{
            const params = {
                Key: fileObj.filename,
                Bucket: bucketName,
                Body: fileObj.body,
                UploadId: fileObj.uploadId,
                PartNumber: fileObj.uploadIndex
            };
            const command = new UploadPartCommand(params)

            return await this.s3Client.send(command);
        }catch (err){
            if(retry < 5)
                return await this.uploadPartialFile(fileObj, ++retry)
            throw err
        }
    }

    async getSignedUrl(fileName :string, action: actionType = "READ"): Promise<string>{
        const VALID_DURATION_IN_SEC = 600;
        if(action === Constants.CLOUD_STORAGE_PRE_SIGNED_URL_READ_ACTION)
            return await getSignedUrl(
            this.s3Client,
            new GetObjectCommand({
                Bucket: bucketName,
                Key: fileName
            }),
            { expiresIn: VALID_DURATION_IN_SEC })
        if(action === Constants.CLOUD_STORAGE_PRE_SIGNED_URL_WRITE_ACTION)
            return await getSignedUrl(
                this.s3Client,
                new PutObjectCommand({
                    Bucket: bucketName,
                    Key: fileName
                }),
                { expiresIn: VALID_DURATION_IN_SEC }
            )
        throw new Error("Invalid action provided.")

    }
    // TODO - test it. due to lack of network connections I was not able to test it propperly.
    async uploadFile(req : Request) : Promise<ServiceResponse>{
        const passThrough = new PassThrough();
        const params = {
            Bucket: bucketName,
            Key: "test200MB.zip",
            Body: passThrough,
            ContentEncoding: "base64"
        };

        req.pipe(CloudBucketAdapter.cipher).pipe(passThrough);
        const upload = this.s3ClientV2.upload(params);

        upload.on('httpUploadProgress', (progress) => {
            // Log progress events
            console.log(`Upload progress: ${progress.loaded}/${progress.total}`);
        });

        try{
           const data :SendData = await new Promise((resolve, reject)=>{
               upload.send((err, data: SendData) => {
                   if (err)
                       reject(err)
                   else
                       resolve(data);
               });
           })
            // Upload succeeded
            console.log(`File successfully uploaded to ${data.Location}`);
            return {response: new ApiResponse(true, {})}
        }catch (err){
            return {err}
        }

    }

    async  checkIfFileExists(fileName: string): Promise<boolean>{
        const params: AWS.S3.Types.HeadObjectRequest = {
            Bucket: bucketName,
            Key: `${fileName}`,
        };

        try {
            const res = await this.s3ClientV2.headObject(params).promise();
            return res != null;
        } catch (error) {
            if (['Forbidden', 'NotFound'].includes(error.code)) {
                return false;
            }
            throw error;
        }
    }

    // async  checkIfFilesExist(fileNamesList: string[]): Promise<void> {
    //     const params: AWS.S3.Types.HeadObjectRequest[] = fileNamesList.map((fileName) => ({
    //         Bucket: bucketName,
    //         Key: fileName,
    //     }));
    //     const responses = await Promise.all(
    //         params.map((param) => s3v2.headObject(param).promise())
    //     );
    //
    //     const allFilesExist = responses.every((res) => res != null);
    //
    //     if (!allFilesExist) {
    //         const missingFiles = fileNamesList.filter((fileName, index) => responses[index] == null);
    //         throw new CustomError(`The following files do not exist in S3: ${missingFiles.join(', ')}`);
    //     }
    // }

    static getBucketBillingParams(startDate :Date, endDate: Date){
        return {
            Granularity: 'MONTHLY',
            Metrics: ['UnblendedCost'],
            TimePeriod: {
                Start: startDate.toISOString().slice(0, 10),
                End: endDate.toISOString().slice(0, 10),
            },
            Filter: {
                And: [
                    {
                        Dimensions: {
                            Key: 'USAGE_TYPE',
                            Values: ['S3 Object Transition-Infrequent Access'],
                        },
                    },
                    {
                        Dimensions: {
                            Key: 'SERVICE',
                            Values: ['Amazon Simple Storage Service'],
                        },
                    },
                    {
                        Dimensions: {
                            Key: 'LINKED_ACCOUNT',
                            Values: [process.env.CLOUD_AWS_ACCOUNT_ID],
                        },
                    },
                ],
            },
            GroupBy: [
                {
                    Type: 'DIMENSION',
                    Key: 'USAGE_TYPE'
                }
            ]
        }
    }
    async getBucketBilling(regionName: string): Promise<number> {

        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const params = CloudBucketAdapter.getBucketBillingParams(start, end)
        const costExplorer = new AWS.CostExplorer({
            region: regionName,
            credentials:{
                accessKeyId,
                secretAccessKey
            }
        });


        const response = await costExplorer.getCostAndUsage(params).promise();
        const cost = response.ResultsByTime[0].Total.UnblendedCost.Amount;
        return Number(cost);
    }
    async getFileNamesFromBucketByPrefix(prefix) :Promise<string[]>{
        const objects = await this.s3ClientV2.listObjectsV2({
            Bucket: bucketName,
            Prefix: prefix + '/'
        }).promise();
        return objects.Contents.map(({ Key }) => Key);
    }
}
