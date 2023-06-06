
export function getSelectActivitiesQuery(): string{
    return `select id, owner_id as "ownerId", name, src_url as "srcUrl", 
           max_threshold_in_days as "maxThresholdInDays", responsible_role_id as "responsibleRoleId",
           extract(epoch from timestamp)::float as "createdAt",
           COALESCE(avda.list, array[]::json[]) as videos 
           from activities a 
           left join activity_video_list avda on avda.activity_id = a.id ;  `
}

export function getInsertActivityQuery(): string{
    return `insert into activities ( id, owner_id, name, src_url, max_threshold_in_days, responsible_role_id ) 
            VALUES ( $1, $2, $3, $4, $5, $6 )
            RETURNING id, owner_id as "ownerId", name, src_url as "srcUrl", 
            max_threshold_in_days as "maxThresholdInDays", responsible_role_id as "responsibleRoleId", 
            extract(epoch from timestamp)::float as "createdAt",
            array[]::json[] as videos ;`;
}

export function getInsertVideoQuery() :string{
    return `insert into activity_videos ( activity_id, index, title, file_name ) VALUES ( $1, $2, $3, $4 )
            RETURNING activity_id as "activityId", index, title, file_name as "fileName"`;
}

export function getUpdateActivityQuery() :string{
    return `update activities set 
            owner_id              = COALESCE($2, owner_id), 
            name                  = COALESCE($3, name), 
            src_url               = $4,
            max_threshold_in_days = COALESCE($5, max_threshold_in_days), 
            responsible_role_id   = COALESCE($6, responsible_role_id)
            where id = $1
            RETURNING id, owner_id as "ownerId", name, src_url as "srcUrl", 
            extract(epoch from timestamp)::float as "createdAt",
            max_threshold_in_days as "maxThresholdInDays", responsible_role_id as "responsibleRoleId", array[]::json[] as videos ;`;
}

export function getDeleteActivityVideosQuery() :string{
    return `delete from activity_videos where activity_id = $1`
}

export function getDeleteActivitiesQuery() :string{
    return `delete from activities where id = any($1)
            RETURNING id, owner_id as "ownerId", name, src_url as "srcUrl",
            max_threshold_in_days as "maxThresholdInDays", responsible_role_id as "responsibleRoleId",
            extract(epoch from timestamp)::float as "createdAt";   `
}

export function getInsertActivityMetaDataQuery() :string{
    return `insert into user_activity_meta_data ( plan_id, activity_id, video_index, user_id, meta_data ) 
            VALUES ($1, $2, $3, $4, $5);     `
}
