import {IBase, IEntity} from "./entity";
type QuizAnswerDescriptionType = {
    correctMessage: string,
    inCorrectMessage: string
}

export interface IQuizAnswer extends IEntity{
    id: string,
    content: string,
    isCorrect: boolean,
    description: QuizAnswerDescriptionType | undefined
}

export interface IQuizQuestionType extends IEntity{
    name: string,
    multiChoicesEnabled: boolean,
    multiAnswersEnabled: boolean,
    textInputEnabled: boolean,
    numberInputEnabled: boolean,

}

export interface IQuizQuestion extends IEntity{
    type: IQuizQuestionType,
    name: string,
    answers: IQuizAnswer[] | undefined
}

export interface IQuizCategory extends IEntity{
    name: string,
    description: string,
    questions: IQuizQuestion[]

}

export interface IQuiz extends IEntity{
    name: string,
    passingPercentageGradeInDec: number,
    timeToCompleteInSec: number,
    createdBy: string
    activityId: string | undefined,
    categories: IQuizCategory[],
    allowedAttemptNumber: number | undefined,
    shuffleQuestionsEnabled: boolean | undefined,
    questionsResponsesHistoryEnabled: boolean | undefined,
    questionsFeedbackEnabled: boolean | undefined,
}

export interface IUserQuiz extends IBase{
    userId: string
    quizId: string,
    quiz: IQuiz
}

export interface IUserQuizQuestionAnswer{
    questionId: string,
    answerId: string
}
