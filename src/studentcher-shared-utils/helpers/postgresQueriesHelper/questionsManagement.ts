export function getSelectAreQuestionsAccessible() :string{
    return `select count(*) = array_length($1::uuid[], 1) as "IsAccessAllowed" 
            from questions 
            where id = any($1::uuid[]) and created_by = $2 ;`
}

export function getSelectAreQuestionCommentsAccessible() :string{
    return `with combined_comments as (
                select id, created_by from answers 
                    union all 
                select id, created_by from question_comments 
                    union all 
                select id, created_by from answer_comments )
            select count(*) = array_length($1::uuid[], 1) as "IsAccessAllowed" 
            from combined_comments 
            where id = any($1::uuid[]) and created_by = $2 ;`
}

export function getSelectAreQuizzesAccessible() :string{
    return `select count(*) = array_length($1::uuid[], 1) as "IsAccessAllowed" 
            from quizzes 
            where id = any($1::uuid[]) and created_by = $2 ;`
}

export function getIsUserInTestQuery() :string{
    return `select count(*) > 0 as "isUserInTest" 
            from trial_users_quizzes 
            where user_id = $1 and 
            ended_at is null;`
}

