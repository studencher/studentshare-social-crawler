export interface IVideoMetaData{
    type: string,
    timestamp: number
}

export interface UserActivityMetaData {
    userId: string,
    planId: string,
    activityId: string,
    videoIndex: number,
    timestamp: number,
    metaData: IVideoMetaData
}
