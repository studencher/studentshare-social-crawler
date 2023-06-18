CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE roles (
    id                            uuid PRIMARY KEY DEFAULT uuid_generate_v1(),
    name                          TEXT NOT NULL,
    app_panel_enabled             BOOLEAN DEFAULT FALSE,
    user_management_enabled       BOOLEAN DEFAULT FALSE,
    activity_management_enabled   BOOLEAN DEFAULT FALSE,
    plan_management_enabled       BOOLEAN DEFAULT FALSE,
    activity_tracking_enabled     BOOLEAN DEFAULT FALSE,
    live_subscription             BOOLEAN DEFAULT FALSE,
    quizzes_management_enabled    BOOLEAN DEFAULT FALSE,
    UNIQUE(name)
);
insert into roles (name) VALUES ('Supervisor'), ('Instructor'), ('Teaching Assistant'), ('Student'), ('Admin'), ('Interviewer');
update roles set user_management_enabled = true, activity_management_enabled = true,  plan_management_enabled = true,  quizzes_management_enabled = true where name = 'Admin';
update roles set activity_tracking_enabled = true where name in ('Instructor', 'Student', 'Teaching Assistant');
update roles set live_subscription = true;
update roles set app_panel_enabled = true;

CREATE TABLE roles_hierarchy (
    responsible_role_id          UUID,
    managed_role_id              UUID,
    FOREIGN KEY (responsible_role_id) REFERENCES roles (id)  ON DELETE SET NULL,
    FOREIGN KEY (managed_role_id) REFERENCES roles (id)  ON DELETE SET NULL
);

insert into roles_hierarchy(responsible_role_id, managed_role_id)
values ((select id from roles where name = 'Admin'), (select id from roles where name = 'Supervisor'));
insert into roles_hierarchy(responsible_role_id, managed_role_id)
values ((select id from roles where name = 'Supervisor'), (select id from roles where name = 'Instructor'));
insert into roles_hierarchy(responsible_role_id, managed_role_id)
values ((select id from roles where name = 'Instructor'), (select id from roles where name = 'Teaching Assistant'));
insert into roles_hierarchy(responsible_role_id, managed_role_id)
values ((select id from roles where name = 'Teaching Assistant'), (select id from roles where name = 'Student'));
insert into roles_hierarchy(responsible_role_id, managed_role_id)
values ((select id from roles where name = 'Admin'), (select id from roles where name = 'Interviewer'));

create view roles_data as (
    with role_managed_roles as (
        select responsible_role_id, array_agg(managed_role_id) as managed_roles
        from roles_hierarchy
        group by responsible_role_id )
    select id, name, COALESCE(managed_roles, array[]::uuid[]) as managed_roles
    from roles r
    left join  role_managed_roles rmr on r.id = rmr.responsible_role_id
);


CREATE TABLE users (
    id                           TEXT PRIMARY KEY check(id ~* '\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$'),
    name                         TEXT NOT NULL,
    password                     TEXT NOT NULL,
    phone_number                 TEXT check(phone_number is null or phone_number ~* '\+(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{1,14}$'),
    role_id                      uuid,
    discord_user_id              TEXT NOT NULL,
    date_of_birth                TIMESTAMP NOT NULL DEFAULT '1994-02-17 00:00:00'::timestamp,
    profile_picture_url          TEXT NOT NULL DEFAULT '' ,
    created_at                   TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    updated_at                   TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    FOREIGN KEY (role_id) REFERENCES roles (id)  ON DELETE SET NULL,
    UNIQUE(discord_user_id)
 );
CREATE INDEX ON users(created_at);
CREATE INDEX ON users(discord_user_id);
-- TODO - remove date_of_birth,  profile_picture_url default values;

insert into users (id, name, password, role_id, discord_user_id)
 values('or@hyperactive.co.il', 'Admin', '$2b$12$86uoQLEUFFfgM2bR5FNmLOzmmGBRU5v1Qa00vaiEjS9NIxYQp7ibm', (select id from roles where name = 'Admin'), '1033740711192957018');
-- TODO - speak with Tal about  activity_types  and add FK on activities.type and remove responsible_role_id from activities
-- CREATE TABLE activity_types (
--     id                      UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
--     name                    TEXT NOT NULL,
--     responsible_role_id     UUID,
--     timestamp               TIMESTAMP NOT NULL DEFAULT timezone('UTC'::text, now()),
--     UNIQUE(name)
-- );

CREATE TABLE activities (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
    owner_id                TEXT,
    name                    TEXT NOT NULL,
    src_url                 TEXT CHECK (src_url is null or src_url ~* 'https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,255}\.[a-z]{2,9}\y([-a-zA-Z0-9@:%_\+.~#?&//=]*)$'),
    max_threshold_in_days   INT CHECK(max_threshold_in_days is null or max_threshold_in_days > 0),
    responsible_role_id     UUID,
    timestamp               TIMESTAMP NOT NULL DEFAULT timezone('UTC'::text, now()),
    UNIQUE(name),
    FOREIGN KEY (owner_id) REFERENCES users (id)  ON DELETE SET NULL,
    FOREIGN KEY (responsible_role_id) REFERENCES roles (id)  ON DELETE SET NULL
);


CREATE TABLE activity_videos(
    activity_id         UUID NOT NULL,
    index               INT NOT NULL,
    title               TEXT,
    file_name           TEXT,
    FOREIGN KEY (activity_id) REFERENCES activities (id)  ON DELETE CASCADE,
    PRIMARY KEY(activity_id, index),
    UNIQUE(activity_id, file_name)
);
CREATE INDEX ON activity_videos (activity_id);
CREATE INDEX ON activity_videos (index);

CREATE VIEW activity_video_list as (
with activity_video_data as (
                select activity_id,
                json_build_object(  'title', title,
                                    'index', index,
                                    'fileName', file_name ) as video_data
                from activity_videos )
select activity_id, array_agg(video_data) as list
from  activity_video_data
group by activity_id
);

CREATE TABLE plans(
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
    name                    TEXT NOT NULL,
    timestamp               TIMESTAMP NOT NULL DEFAULT timezone('UTC'::text, now()),
    UNIQUE(name)
);


CREATE TABLE plan_activities  (
    plan_id                 UUID NOT NULL,
    activity_id             UUID NOT NULL,
    index                   INT CHECK(index > 0),
    PRIMARY KEY(plan_id, activity_id),
    FOREIGN KEY (plan_id) REFERENCES plans (id)  ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities (id)  ON DELETE CASCADE,
    UNIQUE(plan_id, index)
);
CREATE INDEX ON plan_activities (plan_id);
CREATE INDEX ON plan_activities (activity_id);
CREATE INDEX ON plan_activities (index);


CREATE VIEW plan_activities_list as (
with plan_activities_data as (
                select plan_id,
                json_build_object(  'activityId', pa.activity_id,
                                    'name', name,
                                    'index', index,
                                    'responsibleRoleId', responsible_role_id,
                                    'maxThresholdInDays', max_threshold_in_days,
                                    'videos', COALESCE(avl.list, array[]::json[]) ) as activity_data
                from plan_activities pa
                join activities a on  a.id = pa.activity_id
                left join activity_video_list avl on avl.activity_id = pa.activity_id )
select plan_id, array_agg(activity_data) as list
from  plan_activities_data
group by plan_id
);

CREATE TABLE user_plans (
    user_id                 TEXT NOT NULL,
    plan_id                 UUID NOT NULL,
    started_at              TIMESTAMP NOT NULL DEFAULT timezone('UTC'::text, now()),
    ended_at                TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)  ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES  plans (id)  ON DELETE CASCADE,
    PRIMARY KEY(user_id, plan_id)
);
CREATE INDEX ON user_plans (started_at);


CREATE TABLE user_activity_history (
    user_id                 TEXT NOT NULL,
    plan_id                 UUID NOT NULL,
    activity_id             UUID NOT NULL,
    started_at              TIMESTAMP NOT NULL DEFAULT timezone('UTC'::text, now()),
    ended_at                TIMESTAMP,
    FOREIGN KEY (user_id, plan_id) REFERENCES user_plans (user_id, plan_id)  ON DELETE CASCADE,
    FOREIGN KEY (plan_id, activity_id) REFERENCES  plan_activities (plan_id, activity_id)  ON DELETE CASCADE,
    PRIMARY KEY(user_id, plan_id, activity_id)
);
CREATE INDEX ON user_activity_history (started_at);

create or replace view user_current_activity as (
    with user_max_activity_index as (
        select distinct on (up.user_id) up.plan_id as plan_id, up.user_id, COALESCE(index, 1) as max_index,
        uah.started_at, uah.ended_at, pa.activity_id
        from user_plans up
        left join user_activity_history uah on up.user_id = uah.user_id and up.plan_id = uah.plan_id
        left join plan_activities pa on pa.plan_id = uah.plan_id and pa.activity_id = uah.activity_id
        order by up.user_id, started_at DESC  ),
    user_last_activity_meta_data_ts as (
        select user_id, max(timestamp) as max_timestamp
        from user_activity_meta_data
        group by user_id ),
    user_last_activity_seen as (
        select uam.user_id, plan_id, activity_id, video_index, (meta_data->>'timestamp')::float as timestamp
        from user_last_activity_meta_data_ts ula
        join user_activity_meta_data uam on ula.user_id = uam.user_id and ula.max_timestamp = uam.timestamp   )
    select umi.user_id, umi.plan_id, (max_index = array_length(list, 1) and  umi.ended_at  is not null) as is_plan_finished,
    CASE when  (umi.ended_at  is null or max_index = array_length(list, 1) ) then  list[max_index] else  list[max_index+1]  END as current_activity,
    json_build_object('index', COALESCE(ula.video_index, 1) - 1,
                      'timestamp', COALESCE(ula.timestamp, 0) ) as last_video_seen
    from user_max_activity_index umi
    join plan_activities_list pal on umi.plan_id = pal.plan_id
    left join user_last_activity_seen ula on
        umi.user_id = ula.user_id and
        umi.plan_id = ula.plan_id and
        umi.activity_id = ula.activity_id
);



CREATE TABLE user_activity_meta_data (
    user_id                 TEXT NOT NULL,
    plan_id                 UUID NOT NULL,
    activity_id             UUID NOT NULL,
    video_index             INT CHECK(video_index > 0),
    meta_data               JSONB NOT NULL,
    timestamp               TIMESTAMP DEFAULT timezone('UTC'::text, now()),
    FOREIGN KEY(activity_id, video_index) REFERENCES activity_videos (activity_id, index) ON DELETE SET NULL,
    FOREIGN KEY (user_id, plan_id, activity_id) REFERENCES user_activity_history (user_id, plan_id, activity_id)  ON DELETE SET NULL
);

CREATE INDEX ON user_activity_meta_data (user_id);
CREATE INDEX ON user_activity_meta_data (activity_id);
CREATE INDEX ON user_activity_meta_data (video_index);
CREATE INDEX ON user_activity_meta_data (timestamp);

CREATE TABLE user_activity_video_status_history (
    user_id                 TEXT NOT NULL,
    plan_id                 UUID NOT NULL,
    activity_id             UUID NOT NULL,
    video_index             INT CHECK(video_index > 0),
    is_completed            BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp               TIMESTAMP DEFAULT timezone('UTC'::text, now()),
    FOREIGN KEY(activity_id, video_index) REFERENCES activity_videos (activity_id, index) ON DELETE SET NULL,
    FOREIGN KEY (user_id, plan_id, activity_id) REFERENCES user_activity_history (user_id, plan_id, activity_id)  ON DELETE SET NULL
);

CREATE INDEX ON user_activity_video_status_history (user_id);
CREATE INDEX ON user_activity_video_status_history (activity_id);
CREATE INDEX ON user_activity_video_status_history (video_index);
CREATE INDEX ON user_activity_video_status_history (timestamp);
CREATE INDEX ON user_activity_video_status_history (is_completed);


CREATE TABLE discord_channels(
    id          TEXT,
    name        TEXT NOT NULL,
    is_class    BOOLEAN DEFAULT FALSE,
    updated_at  TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    created_at  TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    owner_id    TEXT,
    FOREIGN KEY(owner_id) REFERENCES users (id) ON DELETE SET NULL,
    PRIMARY KEY(id)
);
CREATE INDEX ON discord_channels (created_at);

insert into discord_channels(id, name, is_class) values
('1051504935696609330', 'Classroom', true),
('1051504565779976333', 'Or', false),
('1051504751314997249', 'Zur', false),
('1051504774958305310', 'Udi', false),
('1051504791701950506', 'Tal', false),
('1051504988221882500', 'Conference room', false);

CREATE TABLE meetings(
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
    created_by          TEXT NOT NULL,
    discord_channel_id  TEXT not null,
    created_at          TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    updated_at          TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    ended_at            TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)  ON DELETE CASCADE,
    FOREIGN KEY (discord_channel_id) REFERENCES discord_channels (id)  ON DELETE SET NULL
);
CREATE INDEX ON meetings (discord_channel_id);

CREATE TABLE user_meetings(
    user_id             TEXT NOT NULL,
    meeting_id          UUID NOT NULL,
    note                TEXT,
    rate                INT,
    created_at          TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    updated_at          TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    PRIMARY KEY (user_id, meeting_id),
    FOREIGN KEY (user_id) REFERENCES users (id)  ON DELETE SET NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings (id)  ON DELETE SET NULL
);
CREATE INDEX ON user_meetings (user_id);
CREATE INDEX ON user_meetings (meeting_id);
CREATE INDEX ON user_meetings (created_at);

CREATE TABLE user_tracking_history(
    user_id             TEXT NOT NULL,
    discord_channel_id  TEXT,
    status              TEXT NOT NULL,
    meeting_id          UUID,
    created_at          TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    updated_at          TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    FOREIGN KEY (user_id) REFERENCES users (id)  ON DELETE SET NULL,
    FOREIGN KEY (discord_channel_id) REFERENCES discord_channels (id)  ON DELETE SET NULL
);

CREATE INDEX ON user_tracking_history (user_id);
CREATE INDEX ON user_tracking_history (discord_channel_id);
CREATE INDEX ON user_tracking_history (status);
CREATE INDEX ON user_tracking_history (created_at);

CREATE OR REPLACE VIEW user_last_track as (
     select distinct on (u.id) u.id, discord_channel_id, status, uth.created_at as last_seen_at, meeting_id
     from users u
     left join user_tracking_history uth on u.id = uth.user_id
     order by u.id, uth.created_at desc
);

CREATE OR REPLACE VIEW user_pre_meeting_last_track as (
     select distinct on (u.id) u.id, discord_channel_id, status
     from users u
     left join user_tracking_history uth on u.id = uth.user_id
     where meeting_id is null
     order by u.id, uth.created_at desc
);

CREATE VIEW discord_channel_data as (
    with channels_users_list as (
        select discord_channel_id as id,
        array_agg(json_build_object( 'id', ult.id,
                                     'userName', u.name,
                                     'status', status,
                                     'lastSeenAt', extract(epoch from last_seen_at)::float,
                                      'roleName', r.name )) as users_list
        from user_last_track ult
        join users u on u.id = ult.id
        join roles r on r.id = u.role_id
        group by discord_channel_id )
    select dc.id, name, is_class, owner_id, COALESCE(users_list, array[]::json[]) as users_list
    from discord_channels dc
    left join channels_users_list cul on dc.id = cul.id
);


CREATE TABLE user_activity_monitoring (
    userId          TEXT NOT NULL,
    route           TEXT NOT NULL,
    request_values  JSON,
    timestamp       timestamp NOT NULL default NOW()
);
CREATE INDEX ON user_activity_monitoring(userId);
CREATE INDEX ON user_activity_monitoring(route);
CREATE INDEX ON user_activity_monitoring(timestamp);


CREATE TABLE questions(
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
    title               TEXT NOT NULL,
    content             TEXT NOT NULL,
    votes_sum           INT NOT NULL DEFAULT 0,
    created_by          TEXT NOT NULL,
    video_file_name     TEXT,
    created_at          TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    updated_at          TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    FOREIGN KEY (created_by) REFERENCES users (id)  ON DELETE SET NULL,
    UNIQUE(title)
);
CREATE INDEX ON questions(created_by);
CREATE INDEX ON questions(title);
CREATE INDEX ON questions(created_at);
CREATE INDEX ON questions(votes_sum);

CREATE TABLE question_comments(
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
    question_id     UUID NOT NULL,
    content         TEXT NOT NULL,
    votes_sum       INT NOT NULL DEFAULT 0,
    created_by      TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    updated_at      TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    FOREIGN KEY (question_id) REFERENCES questions (id)  ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users (id)  ON DELETE SET NULL,
    UNIQUE(question_id, content)
);
CREATE INDEX ON question_comments(question_id);
CREATE INDEX ON question_comments(created_by);
CREATE INDEX ON question_comments(votes_sum);
CREATE INDEX ON question_comments(updated_at);


CREATE TABLE answers(
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
    question_id         UUID NOT NULL,
    content             TEXT NOT NULL,
    created_by          TEXT NOT NULL,
    votes_sum           INT NOT NULL DEFAULT 0,
    video_file_name     TEXT,
    created_at          TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    updated_at          TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    FOREIGN KEY (created_by) REFERENCES users (id)  ON DELETE SET NULL,
    FOREIGN KEY (question_id) REFERENCES questions (id)  ON DELETE SET NULL,
    UNIQUE(question_id, content)
);

CREATE INDEX ON answers(question_id);
CREATE INDEX ON answers(updated_at);
CREATE INDEX ON answers(votes_sum);
CREATE INDEX ON answers(votes_sum);


CREATE TABLE answer_comments(
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
    answer_id       UUID NOT NULL,
    content         TEXT NOT NULL,
    votes_sum       INT NOT NULL DEFAULT 0,
    created_by      TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    updated_at      TIMESTAMP DEFAULT timezone('UTC'::text, NOW()),
    FOREIGN KEY (answer_id) REFERENCES answers (id)  ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users (id)  ON DELETE SET NULL,
    UNIQUE(answer_id, content)
);
CREATE INDEX ON answer_comments(votes_sum);
CREATE INDEX ON answer_comments(answer_id);
CREATE INDEX ON answer_comments(updated_at);


CREATE OR REPLACE FUNCTION questions_full_data(IDS UUID[])
    RETURNS TABLE (
            id              UUID,
            title           TEXT,
            content         TEXT,
            votes_sum       INT,
            created_by      TEXT,
            video_file_name TEXT,
            created_at      TIMESTAMP,
            updated_at      TIMESTAMP,
            answers         JSON[],
            comments        JSON[]
    )
    AS $$
    BEGIN
        RETURN QUERY
       with searched_questions as (
               select q.id, q.title, q.content, q.created_by, q.created_at, q.updated_at, q.votes_sum, q.video_file_name
               from questions q
               where q.id = any(IDS) ),
          answer_comments_list as (
               select ac.answer_id,
               array_agg(json_build_object('id', ac.id, 'content', ac.content,'votesSum', ac.votes_sum,'createdBy',
               ac.created_by, 'createdAt', extract(epoch from ac.created_at)::float,
               'updatedAt', extract(epoch from ac.updated_at)::float) ) as list
               from answer_comments ac
               join answers a on a.id = ac.answer_id
               join searched_questions sq on a.question_id = sq.id
               group by ac.answer_id ),
          question_answers as (
                     select a.question_id,
                     array_agg(json_build_object('id', a.id,
                                                 'content', a.content,
                                                 'votesSum', a.votes_sum,
                                                 'createdBy',a.created_by,
                                                 'videoFileName', a.video_file_name,
                                                 'createdAt', extract(epoch from a.created_at)::float ,
                                                 'updatedAt', extract(epoch from a.updated_at)::float,
                                                 'comments', COALESCE(acl.list, array[]::json[])) ) as list
                     from answers a
                     join searched_questions sq on a.question_id = sq.id
                     left join answer_comments_list acl on a.id = acl.answer_id
                     group by question_id  ) ,
          question_comments_list as (
               select qc.question_id, array_agg(json_build_object('id', qc.id, 'content', qc.content, 'votesSum',
               qc.votes_sum, 'createdBy', qc.created_by,
               'createdAt', extract(epoch from qc.created_at)::float,
               'updatedAt', extract(epoch from qc.updated_at)::float ) ) as list
               from question_comments qc
               join searched_questions sq on sq.id = qc.question_id
               group by qc.question_id  )
          select sq.id, sq.title, sq.content, sq.votes_sum, sq.created_by, sq.video_file_name, sq.created_at, sq.updated_at,
          COALESCE(qa.list, array[]::json[]) as answers,
          COALESCE(qcl.list, array[]::json[]) as comments
          from searched_questions sq
          left join question_answers qa on sq.id = qa.question_id
          left join question_comments_list qcl on sq.id = qcl.question_id;
    END; $$
    LANGUAGE 'plpgsql';



CREATE OR REPLACE FUNCTION user_current_activity(P_USER_IDS TEXT[])
    RETURNS TABLE (
            user_id                   TEXT,
            plan_id                   UUID,
            is_plan_finished          BOOLEAN,
            current_activity          JSON,
            last_video_seen_index     INT
    )
    AS $$
    BEGIN
        RETURN QUERY
         with searched_users as (
               select id
               from users
               where id = any(array[P_USER_IDS]) ),
         user_max_activity_index as (
               select distinct on (up.user_id) up.plan_id as plan_id, up.user_id, COALESCE(pa.index, 1) as max_index,
               uah.started_at, uah.ended_at, pa.activity_id
               from searched_users su
               join user_plans up  on su.id = up.user_id
               left join user_activity_history uah on up.user_id = uah.user_id and up.plan_id = uah.plan_id
               left join plan_activities pa on pa.plan_id = uah.plan_id and pa.activity_id = uah.activity_id
               order by up.user_id, uah.started_at DESC  ),
          user_last_activity_meta_data_meta_data_ts as (
                  select su.id as user_id, umai.plan_id, umai.activity_id, uamd.video_index, max(uamd.timestamp) as max_timestamp
                  from searched_users su
                  join user_max_activity_index umai on su.id = umai.user_id
                  join user_activity_meta_data uamd on
                    umai.user_id = uamd.user_id and
                    umai.plan_id = uamd.plan_id and
                    umai.activity_id = uamd.activity_id
                  group by su.id, umai.plan_id, umai.activity_id,  uamd.video_index ),
          user_last_activity_meta_data_ts as (
                   select ulamd.user_id, ulamd.plan_id, ulamd.activity_id, ulamd.video_index, uamd.meta_data->>'timestamp' as max_timestamp
                   from user_last_activity_meta_data_meta_data_ts ulamd
                   join user_activity_meta_data uamd on
                     uamd.user_id = ulamd.user_id and
                     uamd.plan_id = ulamd.plan_id and
                     uamd.activity_id = ulamd.activity_id and
                     uamd.video_index = ulamd.video_index and
                     uamd.timestamp = ulamd.max_timestamp ),
          searched_users_activity_video_last_status_ts as (
                select su.id as user_id, uavs.plan_id, uavs.activity_id, uavs.video_index, max(uavs.timestamp) as max_timestamp
                from searched_users su
                join user_last_activity_meta_data_meta_data_ts ulam on ulam.user_id = su.id
                join user_activity_video_status_history uavs on
                	su.id = uavs.user_id and
                	uavs.plan_id = ulam.plan_id and
                	uavs.activity_id = ulam.activity_id and
                	uavs.video_index = ulam.video_index
                group by su.id, uavs.plan_id, uavs.activity_id, uavs.video_index ),
          searched_users_activity_video_last_status as (
                select su.id as user_id, uavs.plan_id, uavs.activity_id, uavs.video_index, uavs.is_completed
                from searched_users su
                join searched_users_activity_video_last_status_ts suavls on su.id = suavls.user_id
                join user_activity_video_status_history uavs on
                    su.id = uavs.user_id and
                    suavls.max_timestamp = uavs.timestamp and
                    suavls.plan_id = uavs.plan_id and
                    suavls.activity_id = uavs.activity_id and
                    suavls.video_index = uavs.video_index ),
          searched_users_activities_videos as (
                   select su.id as user_id, up.plan_id, av.activity_id, av.index, av.title, av.file_name
                   from searched_users su
                   join user_plans up on up.user_id = su.id
                   join plan_activities pa on pa.plan_id = up.plan_id
                   join activity_videos av on av.activity_id = pa.activity_id
                   order by su.id, up.plan_id, av.activity_id, av.index  ),
          searched_users_activity_video_data as (
                select suav.user_id, suav.plan_id, suav.activity_id,
                array_agg(json_build_object(  'title', suav.title,
                                    'index', suav.index,
                                    'fileName', suav.file_name,
                                    'isCompleted', COALESCE(suavls.is_completed, false),
                                    'lastStoppedAt', COALESCE(ulam.max_timestamp::float, 0))) as video_data_list
                from searched_users_activities_videos suav
                left join searched_users_activity_video_last_status suavls on
                	suavls.activity_id = suav.activity_id and
                	suavls.video_index = suav.index
                left join user_last_activity_meta_data_ts ulam on
                    ulam.user_id = suav.user_id and
                    ulam.plan_id = suav.plan_id and
                    ulam.activity_id = suav.activity_id and
                    ulam.video_index = suav.index
                 group by suav.user_id, suav.plan_id, suav.activity_id ),
          searched_users_plan_activities_data as (
                select suav.plan_id,
                array_agg(json_build_object(  'activityId', suav.activity_id,
                                    'name', a.name,
                                    'index', pa.index,
                                    'responsibleRoleId', a.responsible_role_id,
                                    'maxThresholdInDays', a.max_threshold_in_days,
                                    'videos', COALESCE(suav.video_data_list, array[]::json[]) ) ) as user_plan_activities_list_data
                from searched_users_activity_video_data suav
                join activities a on a.id = suav.activity_id
                join plan_activities pa on pa.plan_id = suav.plan_id and pa.activity_id = suav.activity_id
                group by suav.plan_id   ),
          user_last_activity_seen as (
                 select distinct on (su.id) uam.user_id, uam.plan_id, uam.activity_id, uam.video_index
                 from searched_users su
                 join user_activity_meta_data uam on su.id = uam.user_id
                 order by su.id, uam.timestamp DESC )
          select umi.user_id, umi.plan_id, (max_index = array_length(user_plan_activities_list_data, 1) and  umi.ended_at  is not null) as is_plan_finished,
          CASE when  (umi.ended_at  is null or max_index = array_length(user_plan_activities_list_data, 1) )
            then  user_plan_activities_list_data[max_index]
            else  user_plan_activities_list_data[max_index+1]
          END as current_activity,
          COALESCE(ula.video_index, 1) - 1 as last_video_seen_index
          from user_max_activity_index umi
          join searched_users_plan_activities_data supa on umi.plan_id = supa.plan_id
          left join user_last_activity_seen ula on
              umi.user_id = ula.user_id and
              umi.plan_id = ula.plan_id and
              umi.activity_id = ula.activity_id;
    END; $$
    LANGUAGE 'plpgsql';

CREATE TABLE quizzes (
    id                                      UUID  PRIMARY KEY DEFAULT uuid_generate_v1(),
    name                                    TEXT NOT NULL,
    passing_percentage_grade_in_dec         FLOAT NOT NULL,
    time_to_complete_in_sec                 FLOAT NOT NULL,
    allowed_attempt_number                  INT NOT NULL DEFAULT 1,
    shuffle_questions_enabled               BOOLEAN NOT NULL DEFAULT FALSE,
    questions_responses_history_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    questions_feedback_enabled              BOOLEAN NOT NULL DEFAULT FALSE,
    created_by                              TEXT NOT NULL,
    activity_id                             UUID,
    created_at                              TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    updated_at                              TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    FOREIGN KEY (created_by) REFERENCES users (id)  ON DELETE SET NULL,
    FOREIGN KEY (activity_id) REFERENCES activities (id)  ON DELETE SET NULL,
    UNIQUE(name)
);
CREATE INDEX ON quizzes(created_at);
CREATE INDEX ON quizzes(activity_id);
CREATE INDEX ON quizzes(created_by);

CREATE TABLE quiz_categories (
    id              UUID  PRIMARY KEY DEFAULT uuid_generate_v1(),
    quiz_id         UUID NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    updated_at      TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    FOREIGN KEY (quiz_id) REFERENCES quizzes (id)  ON DELETE CASCADE
);
CREATE INDEX ON quiz_categories(quiz_id);
CREATE INDEX ON quiz_categories(created_at);

CREATE TABLE quiz_question_types (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
    name                    TEXT NOT NULL,
    multi_choices_enabled   BOOLEAN NOT NULL,
    multi_answers_enabled   BOOLEAN NOT NULL,
    text_input_enabled      BOOLEAN NOT NULL,
    number_input_enabled    BOOLEAN NOT NULL,
    is_supported            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    updated_at              TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    UNIQUE(name)
);
CREATE INDEX ON quiz_question_types(created_at);

insert into quiz_question_types (name, multi_choices_enabled, multi_answers_enabled, text_input_enabled, number_input_enabled )
values ('Multi select with single correct answer', true, false, false, false),
('Multi select with multiple correct answers', true, true, false, false);


CREATE TABLE quiz_questions(
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
    type_id                 UUID NOT NULL,
    quiz_category_id        UUID NOT NULL,
    name                    TEXT NOT NULL,
    created_at              TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    updated_at              TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    FOREIGN KEY (type_id) REFERENCES quiz_question_types (id)  ON DELETE CASCADE,
    FOREIGN KEY (quiz_category_id) REFERENCES quiz_categories (id)  ON DELETE CASCADE
);
CREATE INDEX ON quiz_questions(type_id);
CREATE INDEX ON quiz_questions(quiz_category_id);
CREATE INDEX ON quiz_questions(created_at);

CREATE TABLE quiz_question_answers(
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v1(),
    quiz_question_id    UUID NOT NULL,
    content             TEXT NOT NULL,
    is_correct          BOOLEAN NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    updated_at          TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    FOREIGN KEY (quiz_question_id) REFERENCES quiz_questions (id)  ON DELETE CASCADE,
    UNIQUE(quiz_question_id, content)
);
CREATE INDEX ON quiz_question_answers(quiz_question_id);

CREATE TABLE quiz_question_answer_description(
    answer_id           UUID NOT NULL,
    correct_message     TEXT NOT NULL,
    in_correct_message  TEXT,
    FOREIGN KEY (answer_id) REFERENCES quiz_question_answers (id)  ON DELETE CASCADE
);
CREATE INDEX ON quiz_question_answer_description(answer_id);


CREATE OR REPLACE FUNCTION quiz_full_data(P_QUIZ_IDS UUID[])
    RETURNS TABLE (
            id                                      UUID,
            name                                    TEXT,
            passing_percentage_grade_in_dec         FLOAT,
            allowed_attempt_number                  INT,
            time_to_complete_in_sec                 FLOAT,
            shuffle_questions_enabled               BOOLEAN,
            questions_responses_history_enabled     BOOLEAN,
            questions_feedback_enabled              BOOLEAN,
            created_by                              TEXT,
            categories                              JSON[],
            created_at                              TIMESTAMP,
            updated_at                              TIMESTAMP
    )
    AS $$
    BEGIN
        RETURN QUERY
         with searched_quizzes as (
             select q.id, q.name, q.passing_percentage_grade_in_dec, q.time_to_complete_in_sec,
             q.allowed_attempt_number, q.shuffle_questions_enabled, q.questions_responses_history_enabled,
             q.questions_feedback_enabled, q.created_by, q.activity_id, q.created_at, q.updated_at
             from quizzes q
             where q.id = any(P_QUIZ_IDS) ),
          searched_quiz_categories as (
              select qc.id, qc.quiz_id, qc.name, qc.description, qc.created_at, qc.updated_at
              from searched_quizzes sq
              join  quiz_categories qc on qc.quiz_id = sq.id),
          searched_quiz_questions as (
              select qq.id, qq.quiz_category_id, qq.name, qq.created_at, qq.updated_at,
              json_build_object('name', qqt.name,
                                'multiChoicesEnabled', qqt.multi_choices_enabled,
                                'multiAnswersEnabled', qqt.multi_answers_enabled,
                                'textInputEnabled', qqt.text_input_enabled,
                                'numberInputEnabled', qqt.number_input_enabled ) as type
              from searched_quiz_categories sqc
              join quiz_questions qq on qq.quiz_category_id = sqc.id
              join quiz_question_types qqt on qqt.id = qq.type_id  ),
          searched_quiz_question_answers_list as (
              select  qqa.quiz_question_id,
              array_agg(json_build_object('id', qqa.id,
                                'content', qqa.content,
                                'isCorrect', qqa.is_correct,
                                'description',  CASE when qqad.answer_id is null then null
                                                else json_build_object('correctMessage', qqad.correct_message,
                                                            'inCorrectMessage', qqad.in_correct_message ) END)) as answers
               from searched_quiz_questions sqq
               join quiz_question_answers qqa on qqa.quiz_question_id = sqq.id
               left join  quiz_question_answer_description qqad on qqa.id = qqad.answer_id
               group by qqa.quiz_question_id) ,
         searched_quiz_categories_questions_list as (
           select sqq.quiz_category_id, array_agg(json_build_object('id', sqq.id,
              'name', sqq.name,
              'type', sqq.type,
              'createdAt',  extract(epoch from sqq.created_at)::float,
              'updatedAt',  extract(epoch from sqq.updated_at)::float,
              'answers', sqqal.answers )) as questions
           from searched_quiz_questions sqq
           join searched_quiz_question_answers_list sqqal on sqqal.quiz_question_id = sqq.id
           group by sqq.quiz_category_id ),
           searched_quiz_categories_list as (
               select sqc.quiz_id,
               array_agg(json_build_object('id', sqc.id,
                                           'name', sqc.name,
                                           'description', sqc.description,
                                           'createdAt',  extract(epoch from sqc.created_at)::float,
                                           'updatedAt',  extract(epoch from sqc.updated_at)::float,
                                           'questions', sqcql.questions)) as categories
               from searched_quiz_categories sqc
               join searched_quiz_categories_questions_list sqcql on sqcql.quiz_category_id = sqc.id
               group by sqc.quiz_id )
           select sq.id, sq.name, sq.passing_percentage_grade_in_dec,
          sq.allowed_attempt_number, sq.time_to_complete_in_sec,
          sq.shuffle_questions_enabled, sq.questions_responses_history_enabled,
          sq.questions_feedback_enabled,  sq.created_by, sqcl.categories, sq.created_at, sq.updated_at
           from searched_quizzes sq
           join searched_quiz_categories_list sqcl on sqcl.quiz_id = sq.id ;
    END; $$
    LANGUAGE 'plpgsql';


CREATE TABLE trial_users_quizzes (
    id              UUID PRIMARY KEY DEFAULT  uuid_generate_v1(),
    user_id         TEXT,
    quiz_id         UUID NOT NULL,
    grade_in_dec    FLOAT,
    ended_at        TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    FOREIGN KEY (quiz_id) REFERENCES quizzes (id)  ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)  ON DELETE SET NULL
);
CREATE INDEX ON trial_users_quizzes(user_id);
CREATE INDEX ON trial_users_quizzes(quiz_id);
CREATE INDEX ON trial_users_quizzes(grade_in_dec);
CREATE INDEX ON trial_users_quizzes(created_at);

CREATE TABLE trial_questions_answers(
    trial_id                    UUID,
    quiz_question_id            UUID NOT NULL,
    quiz_question_answer_id     UUID,
    created_at                  TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    updated_at                  TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    FOREIGN KEY (trial_id) REFERENCES trial_users_quizzes (id)  ON DELETE SET NULL,
    FOREIGN KEY (quiz_question_id) REFERENCES quiz_questions (id)  ON DELETE CASCADE,
    FOREIGN KEY (quiz_question_answer_id) REFERENCES quiz_question_answers (id)  ON DELETE CASCADE,
    UNIQUE(trial_id, quiz_question_id, quiz_question_answer_id)
);
CREATE INDEX ON trial_questions_answers(trial_id);
CREATE INDEX ON trial_questions_answers(quiz_question_id);
CREATE INDEX ON trial_questions_answers(quiz_question_answer_id);
CREATE INDEX ON trial_questions_answers(created_at);




CREATE OR REPLACE FUNCTION calculate_user_quiz_grade(P_TRIAL_ID UUID)
RETURNS FLOAT
language plpgsql
 as
 $$
 declare
    calculated_grade FLOAT;
 begin
     with current_trial as (
        select id, quiz_id, user_id
        from trial_users_quizzes
        where id = P_TRIAL_ID ),
     current_quiz_questions as (
        select qq.id
        from current_trial ct
        join quiz_categories qc on qc.quiz_id = ct.quiz_id
        join quiz_questions qq on qq.quiz_category_id = qc.id ),
     current_quiz_questions_answers_correct as (
        select qqa.id as quiz_question_answer_id, qqa.quiz_question_id
        from current_quiz_questions cqq
        join quiz_question_answers qqa on
            qqa.quiz_question_id = cqq.id and
            qqa.is_correct = true ),
     current_quiz_questions_answers_correct_count as (
        select count(*)
        from current_quiz_questions_answers_correct  ),
     user_current_quiz_questions_correct_answers as (
        select count(tqa.trial_id)
        from trial_questions_answers tqa
        join current_quiz_questions cqq  on tqa.trial_id = P_TRIAL_ID and
            cqq.id = tqa.quiz_question_id
        join current_quiz_questions_answers_correct cqqa on
            cqqa.quiz_question_id = tqa.quiz_question_id and
            cqqa.quiz_question_answer_id = tqa.quiz_question_answer_id )
     select CASE WHEN COALESCE(cqqac.count, 0) = 0 then 0 ELSE  COALESCE(ucqca.count, 0)::float / cqqac.count::float  END
     into calculated_grade
     from current_quiz_questions_answers_correct_count cqqac
     cross join user_current_quiz_questions_correct_answers ucqca ;
     return calculated_grade;
 end;
 $$;

create table crawler_comments (
    id              UUID PRIMARY KEY DEFAULT  uuid_generate_v1(),
    comment         TEXT,
    description     TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW())
);

create table crawler_user_accounts (
    id                              UUID PRIMARY KEY DEFAULT  uuid_generate_v1(),
    description                     TEXT,
    username                        TEXT,
    password                        TEXT,
    posts_collection_to_save_in     TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW())
);

create table crawler_searches(
    id                              UUID PRIMARY KEY DEFAULT  uuid_generate_v1(),
    description                     TEXT,
    keywords                        TEXT[],
    created_at                      TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW())
);


create table crawlers(
    id                              UUID PRIMARY KEY DEFAULT  uuid_generate_v1(),
    description                     TEXT,
    user_account_id                 UUID,
    search_id                       UUID,
    comment_id                      UUID,
    created_at                      TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    FOREIGN KEY (user_account_id) REFERENCES crawler_user_accounts (id)  ON DELETE SET NULL,
    FOREIGN KEY (search_id) REFERENCES crawler_searches (id)  ON DELETE SET NULL,
    FOREIGN KEY (comment_id) REFERENCES crawler_comments (id)  ON DELETE SET NULL
);

create table crawler_statuses(
    crawler_id                UUID NOT NULL,
    created_at                TIMESTAMP NOT NULL DEFAULT timezone('UTC'::TEXT, NOW()),
    ended_at                  TIMESTAMP,
    FOREIGN KEY (crawler_id) REFERENCES crawlers (id)  ON DELETE SET NULL
);

create or replace view crawler_last_status as (
    with crawler_max_created_at as (
        select crawler_id, max(created_at) as timestamp
        from crawler_statuses
        group by
        crawler_id  )
    select cs.crawler_id, cs.created_at, cs.ended_at
    from crawler_statuses cs
    join crawler_max_created_at cmsa on
        cmsa.crawler_id = cs.crawler_id and
        cmsa.timestamp = cs.created_at
);
