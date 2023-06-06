export function getSelectQuizQuestionTypes():string{
    return `select  id, name, multi_choices_enabled as "multiChoicesEnabled", multi_answers_enabled as "multiAnswersEnabled", 
            text_input_enabled as "textInputEnabled", number_input_enabled as "numberInputEnabled",
            extract(epoch from updated_at)::float as "updatedAt",
            extract(epoch from created_at)::float as "createdAt" 
            from quiz_question_types 
            where is_supported = true ; `
}
