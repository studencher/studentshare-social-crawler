export abstract class Constants {
    public static PROXY_AUTHORIZED_HEADER = "proxy-auth"
    public static DISCORD_MEMBER_ACTIVE_STATUS : string = "active";
    public static DISCORD_MEMBER_BUSY_STATUS : string = "busy";
    public static DISCORD_MEMBER_BREAK_STATUS : string = "break";
    public static DISCORD_MEMBER_LEFT_STATUS : string = "left";
    public static CREATE_NEW_CHANNEL_MSG : string = "$create";
    public static MOVE_MEMBER_MSG : string = "$move";

    public static DISCORD_VOICE_CHANNEL_TYPE : string = "GuildVoice";
    public static DISCORD_VOICE_CHANNEL_INDEX_TYPE : number = 2;
    public static AUTHENTICATION_FAILED_MESSAGE : string = "Access denied";
    public static TOKEN_EXPIRES_IN_NUMBER_OF_SECONDS : number = 12 * 60 * 60 ;
    public static TEMP_TOKEN_EXPIRES_IN_NUMBER_OF_SECONDS : number = 1 * 60 * 60 ;
    public static AUTHENTICATION_PASSWORD_FAILED_MESSAGE : string = 'Your login details could not be verified. Please try again.';
    public static AUTHENTICATION_MISSING_PARAMS_MESSAGE : string = "missing params - username + password. ";
    public static permissions : Permission = {
        userManagement: "user_management_enabled",
        activityManagementEnabled: "activity_management_enabled",
        studyPlanManagement: "plan_management_enabled",
        roleManagement: "role_management_enabled",
        activityTrackingEnabled: "activity_tracking_enabled",
        liveSubscription: "live_subscription",
        appPanelEnabled: "app_panel_enabled",
        quizzesManagementEnabled: "quizzes_management_enabled"
    }

    public static STUDY_CHANNELS_SUBSCRIPTION : string = "study_channels_subscription";
    public static FACEBOOK_CRAWL_JOB_QUEUE : string = "social_media_facebook_crawler_jobs_queue";
    public static TIKTOK_CRAWL_JOB_QUEUE : string = "social_media_tiktok_crawler_jobs_queue";
    public static INSTAGRAM_CRAWL_JOB_QUEUE : string = "social_media_instagram_crawler_jobs_queue";
    public static CRAWLERS_HASH : string = "social_media_crawlers_hash";
    public static STUDENT_NOTIFIER = 'student_notifier';
    public static votesSumDeltaAllowValues = [1, -1];

    public static CLOUD_STORAGE_PRE_SIGNED_URL_READ_ACTION = "READ";
    public static CLOUD_STORAGE_PRE_SIGNED_URL_WRITE_ACTION = "WRITE";

    public static CLOUD_ACTIVITIES_VIDEOS_BUCKET_PREFIX = "studentcher-module/activities"
}

declare class Permission{
    userManagement: string;
    activityManagementEnabled: string;
    studyPlanManagement: string;
    roleManagement: string;
    activityTrackingEnabled: string;
    liveSubscription : string;
    appPanelEnabled: string;
    quizzesManagementEnabled: string;
}
