export function getInsertUserTrackingQuery(){
    return `with user_dto as (
                select u.name as user_name, r.name as role_name
                from users u 
                join roles r on u.id = $1 and u.role_id = r.id )
            insert into user_tracking_history (user_id, discord_channel_id, status, meeting_id) 
            select $1, COALESCE($2::text, discord_channel_id), COALESCE($3::text, status, 'active'), 
            CASE when COALESCE($3::text, status, 'active') = 'active' then null else COALESCE($4, meeting_id) END
            from users u 
            join user_last_track ult on u.id = $1 and u.id = ult.id
            RETURNING user_id as id, discord_channel_id as "discordChannelId", status, meeting_id as "meetingId",
            extract(epoch from created_at)::float as "lastSeenAt",
            (select user_name from user_dto) as "userName",
            (select role_name from user_dto) as "roleName";`
}

export function getSelectUsersDiscordDataQuery(){
    return `select id as "userId", discord_user_id as "discordUserId" from users`
}

export function getSelectDiscordUserLastTrackQuery(){
    return `select  ult.id, u.name as "userName", r.name as "roleName", discord_channel_id as 
            "discordChannelId", status, extract(epoch from last_seen_at)::float as "lastSeenAt",
             meeting_id as "meetingId"
            from  user_last_track ult 
            join users u on u.id = ult.id 
            join roles r on r.id = u.role_id
            where 
            CASE 
                WHEN $1::text[] is null THEN true 
                ELSE  ult.id = any($1::text[]) 
            END`
}

export function getSelectDiscordChannelsQuery(){
    return `select  id, name, is_class as "isClass", owner_id as "ownerId", 
            extract(epoch from created_at)::float as "createdAt",
            extract(epoch from updated_at)::float as "updatedAt",
            array[]::text[] as "loggedUsers"
            from  discord_channels
            order by name;`
}

export function getSelectPreMeetingUserTrackQuery(){
    return `with users_on_meeting as (
                select id from user_last_track where meeting_id = $1 )
            select  upm.id as "userId", discord_channel_id as "discordChannelId", status
            from  user_pre_meeting_last_track  upm
            join users_on_meeting uom on uom.id = upm.id `
}
