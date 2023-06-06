import {IEntity} from "./entity";

export interface IQuestion  extends IEntity{
    createdBy: string,
    title: string,
    content: string,
    votesSum: number,
    videoFileName: string | undefined,
    videoSrcUrl: string | undefined,

}

interface IComment extends IEntity{
    createdBy: string,
    content: string,
    votesSum: number
}

export interface IQuestionComment  extends IComment{
    questionId: string,
}

export interface IAnswerComment  extends IComment{
    answerId: string,
}
export interface IAnswer  extends IEntity{
    questionId: string,
    createdBy: string,
    content: string,
    votesSum: number,
    videoFileName: string | undefined,
    videoSrcUrl: string | undefined,
    comments: IAnswerComment[] | undefined
}

export interface IQuestionFullData  extends IQuestion{
    comments: IQuestionComment[],
    answers: IAnswer[]

}
