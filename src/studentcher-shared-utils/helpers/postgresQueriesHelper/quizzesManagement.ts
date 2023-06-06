export function getSelectQuizQuery(): string{
    return `select id, name, passing_percentage_grade_in_dec as "passingPercentageGradeInDec", 
            allowed_attempt_number as "allowedAttemptNumber", time_to_complete_in_sec as "timeToCompleteInSec",  
            shuffle_questions_enabled as "shuffleQuestionsEnabled",
            questions_responses_history_enabled as "questionsResponsesHistoryEnabled", 
            questions_feedback_enabled as "questionsFeedbackEnabled", 
            created_by as "createdBy",  extract(epoch from created_at)::float as "createdAt",
            extract(epoch from updated_at)::float as "updatedAt"
            from quizzes`;
}

export function getInsertQuizQuery(): string{
    return `insert into quizzes (id, name, passing_percentage_grade_in_dec, allowed_attempt_number, time_to_complete_in_sec,
            shuffle_questions_enabled, questions_feedback_enabled, questions_responses_history_enabled, created_by) 
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)  
            RETURNING id, name, passing_percentage_grade_in_dec as "passingPercentageGradeInDec", 
            allowed_attempt_number as "allowedAttemptNumber", time_to_complete_in_sec as "timeToCompleteInSec",  
            shuffle_questions_enabled as "shuffleQuestionsEnabled",
            questions_responses_history_enabled as "questionsResponsesHistoryEnabled", 
            questions_feedback_enabled as "questionsFeedbackEnabled", 
            created_by as "createdBy", array[]::json[] as categories, 
            extract(epoch from created_at)::float as "createdAt",
            extract(epoch from updated_at)::float as "updatedAt"; `;
}

export function getInsertQuizCategoryQuery(): string{
    return `insert into quiz_categories (id, quiz_id, name, description) VALUES ($1, $2, $3, $4)  
            RETURNING id, name, description, extract(epoch from created_at)::float as "createdAt",
            extract(epoch from updated_at)::float as "updatedAt"; `;
}

export function getUpdateQuizQuery(): string{
    return `update quizzes set 
            name                                    = COALESCE($2, name), 
            passing_percentage_grade_in_dec         = COALESCE($3, passing_percentage_grade_in_dec), 
            allowed_attempt_number                  = COALESCE($4, allowed_attempt_number), 
            time_to_complete_in_sec                 = COALESCE($5, time_to_complete_in_sec),
            shuffle_questions_enabled               = COALESCE($6, shuffle_questions_enabled), 
            questions_feedback_enabled              = COALESCE($7, questions_feedback_enabled), 
            questions_responses_history_enabled     = COALESCE($8, questions_responses_history_enabled), 
            updated_at                              = timezone('UTC'::TEXT, NOW()) 
            where id = $1
            RETURNING id, name, passing_percentage_grade_in_dec as "passingPercentageGradeInDec", 
            allowed_attempt_number as "allowedAttemptNumber", time_to_complete_in_sec as "timeToCompleteInSec",  
            shuffle_questions_enabled as "shuffleQuestionsEnabled",
            questions_responses_history_enabled as "questionsResponsesHistoryEnabled", 
            questions_feedback_enabled as "questionsFeedbackEnabled", 
            created_by as "createdBy",  
            extract(epoch from created_at)::float as "createdAt",
            extract(epoch from updated_at)::float as "updatedAt"; `;
}

export function getDeleteQuizzesQuery(): string{
    return `delete from quizzes 
            where id = any($1)
            RETURNING id, name, passing_percentage_grade_in_dec as "passingPercentageGradeInDec", 
            allowed_attempt_number as "allowedAttemptNumber", time_to_complete_in_sec as "timeToCompleteInSec",  
            shuffle_questions_enabled as "shuffleQuestionsEnabled",
            questions_responses_history_enabled as "questionsResponsesHistoryEnabled", 
            questions_feedback_enabled as "questionsFeedbackEnabled", 
            created_by as "createdBy",  extract(epoch from created_at)::float as "createdAt",
            extract(epoch from updated_at)::float as "updatedAt"`;
}

export function getInsertQuizQuestionQuery(): string{
    return `insert into quiz_questions (id, type_id, quiz_category_id, name) 
            VALUES($1, $2, $3, $4)  
            RETURNING id, type_id as "typeId", quiz_category_id as "quizCategoryId", name, array[]::json[] as answers, 
            extract(epoch from created_at)::float as "createdAt",
            extract(epoch from updated_at)::float as "updatedAt"; `;
}

export function getInsertQuizQuestionAnswerQuery(): string{
    return `insert into quiz_question_answers (id, quiz_question_id, content, is_correct) 
            VALUES($1, $2, $3, $4)  
            RETURNING id, quiz_question_id as "quizQuestionId", content, 
            is_correct as "isCorrect", '{}'::json as description, 
            extract(epoch from created_at)::float as "createdAt",
            extract(epoch from updated_at)::float as "updatedAt"; `;
}

export function getInsertQuizQuestionAnswerDescriptionQuery(): string{
    return `insert into quiz_question_answer_description (answer_id, correct_message, in_correct_message) 
            VALUES($1, $2, $3)  
            RETURNING answer_id as "answerId", correct_message as "correctMessage", in_correct_message as "inCorrectMessage" `;
}

export function getSelectQuizFullData(): string{
    return `select sq.id, sq.name, sq.passing_percentage_grade_in_dec as "passingPercentageGradeInDec", 
            sq.allowed_attempt_number as "allowedAttemptNumber", sq.time_to_complete_in_sec as "timeToCompleteInSec",  
            sq.shuffle_questions_enabled as "shuffleQuestionsEnabled",
            sq.questions_responses_history_enabled as "questionsResponsesHistoryEnabled", 
            sq.questions_feedback_enabled as "questionsFeedbackEnabled", 
            sq.created_by as "createdBy", sq.categories,
            extract(epoch from sq.created_at)::float as "createdAt",
            extract(epoch from sq.updated_at)::float as "updatedAt"
            from quiz_full_data($1) sq  ;`
}

export function getInsertUserQuizQuery():string{
    return `insert into trial_users_quizzes (user_id, quiz_id) VALUES ($1, $2)
            RETURNING id, user_id as "userId", quiz_id as "quizId", grade_in_dec as "gradeInDec", 
            extract(epoch from ended_at)::float as "endedAt",
            extract(epoch from created_at)::float as "createdAt"; `;
}

export function getUpdateUserQuizQuery(): string{
    return `update trial_users_quizzes set 
            ended_at     = CASE WHEN $2 = true THEN timezone('UTC'::TEXT, NOW()) ELSE ended_at END,
            grade_in_dec = CASE WHEN $2 = true THEN calculate_user_quiz_grade(id) ELSE grade_in_dec END
            WHERE id = $1 
            RETURNING id, user_id as "userId", quiz_id as "quizId", grade_in_dec as "gradeInDec", 
            extract(epoch from ended_at)::float as "endedAt",
            extract(epoch from created_at)::float as "createdAt";`
}

// users_quizzes
export function getInsertUserQuizQuestionsAnswersQuery():string{
    return `insert into trial_questions_answers (trial_id, quiz_question_id, quiz_question_answer_id) 
            VALUES ($1, $2, $3)
            RETURNING trial_id as "trialId", quiz_question_id as "quizQuestionId", quiz_question_answer_id as "quizQuestionAnswerId",
            extract(epoch from updated_at)::float as "updatedAt",
            extract(epoch from created_at)::float as "createdAt"; `;
}
