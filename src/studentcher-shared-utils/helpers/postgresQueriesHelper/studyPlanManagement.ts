export function getInsertStudyPlanQuery(){
    return `insert into plans (id, name) values ($1, $2) 
            RETURNING id, name, extract(epoch from timestamp)::float as "createdAt", array[]::uuid[] as activities `
}

export function getInsertStudyPlanActivityQuery(){
    return `insert into plan_activities (plan_id, activity_id, index) values ($1, $2, $3) 
            RETURNING plan_id as "planId", activity_id as "activityId" , index `
}

export function getUpdateStudyPlanQuery(){
    return `update plans set name = COALESCE($2, name)
            where id = $1
            RETURNING id, name, extract(epoch from timestamp)::float as "createdAt", array[]::uuid[] as activities `
}
export function getSelectStudyPlansQuery(){
    return `with plan_activities_list as (
                select p.id, array_agg(activity_id) as activities 
                from plans p 
                join plan_activities pa on p.id = pa.plan_id
                group by p.id)
            select p.id, name,  COALESCE(activities, array[]::uuid[]) as activities 
            from plans p 
            left join plan_activities_list pal on pal.id = p.id    `
}

export function getDeleteStudyPlanActivitiesQuery(){
    return `delete from plan_activities 
            where plan_id = $1`
}

export function getDeleteStudyPlansQuery(){
    return `delete from plans where id = any($1)
            RETURNING id, name, extract(epoch from timestamp)::float as "createdAt"`
}

export function getDeleteUserPlansQuery(){
    return `delete from user_plans where plan_id = $1 and not user_id = any ($2)`
}

export function getInsertUserPlansQuery(){
    return  ` with un_nested_users as (
                 select unnest($2::text[]) as user_id ),
               registered_users as (
                 select array_agg(user_id) as list from user_plans where plan_id = $1 )
              insert into user_plans (user_id, plan_id) 
              select unu.user_id, $1 
              from un_nested_users unu, registered_users ru
              where not unu.user_id = any(COALESCE(ru.list, array[]::text[]))
              RETURNING user_id as "userId";`;
}
