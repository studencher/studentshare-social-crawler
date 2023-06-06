import * as uuid from "uuid";
import {IQuizQuestionType} from "../entities/quiz";
import {ServiceResponse} from "../models/ServiceResponse";
import {ApiResponse} from "../models/ApiResponse";
import {QuizQuestionTypesRepository} from "../repositories/QuizQuestionTypesRepository";

export interface IQuizQuestionTypesService {
    getQuizQuestionsTypes(): Promise<ServiceResponse<{ quizQuestionsTypes: IQuizQuestionType[] }>>;
}
export class QuizQuestionTypesService implements IQuizQuestionTypesService{
    static idGenerator = uuid.v1;
    private quizQuestionTypesRepository: QuizQuestionTypesRepository;

    constructor(authorizationService, quizQuestionTypesRepository) {
        this.quizQuestionTypesRepository = quizQuestionTypesRepository;
    }

    async getQuizQuestionsTypes() : Promise<ServiceResponse>{
        try{
            const quizQuestionsTypes: IQuizQuestionType[] = await this.quizQuestionTypesRepository.findMany();
            return {response: new ApiResponse(true, {quizQuestionsTypes})};
        }catch (err){
            return {err}
        }
    }
}
