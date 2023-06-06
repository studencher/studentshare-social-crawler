import * as uuid from "uuid";
import {QuizzesRepository} from "../repositories/QuizzesRepository";
import {IQuiz, IUserQuiz} from "../entities/quiz";
import {AuthorizationService} from "./AuthorizationService";
import {IClientRequestData} from "../models/ClientRequestData";
import {CustomError} from "../models/CustomError";
import {ServiceResponse} from "../models/ServiceResponse";
import {Validations} from "../helpers/Validations";
import {ApiResponse} from "../models/ApiResponse";

export interface IQuizzesService {
    getQuizzes(data: IClientRequestData): Promise<ServiceResponse<{ quizzes: IQuiz[] }>>;
    addQuiz(data: IClientRequestData): Promise<ServiceResponse<{ quiz: IQuiz }>>;
    editQuiz(data: IClientRequestData): Promise<ServiceResponse<{ quiz: IQuiz }>>;
    deleteQuizzes(data: IClientRequestData): Promise<ServiceResponse<{quizzes: IQuiz[]}>>;
    getQuiz(data: IClientRequestData): Promise<ServiceResponse<{ quiz: IQuiz }>>;
    startUserQuiz(data: IClientRequestData): Promise<ServiceResponse<{ userQuiz: IUserQuiz }>>;
    endUserQuiz(data: IClientRequestData): Promise<ServiceResponse<{ userQuiz: IUserQuiz }>>;
    getOptionalQuizzes(data: IClientRequestData): Promise<ServiceResponse<{ quizzes: IQuiz[] }>>;
}

export class QuizzesService implements IQuizzesService{
    static idGenerator = uuid.v1;
    private quizzesRepository: QuizzesRepository;
    private authorizationService: AuthorizationService;

    constructor(authorizationService, quizzesRepository) {
        this.quizzesRepository = quizzesRepository;
        this.authorizationService = authorizationService;
    }
    static validateQuizFields(data: IClientRequestData):void{
          if(data.passingPercentageGradeInDec != null){
              if(!(data.passingPercentageGradeInDec >= 0 && data.passingPercentageGradeInDec <=1))
                  throw new CustomError("passingPercentageGradeInDec must be number equal ot greater then 0 and equal or less then 1");
          }
          if(data.categories != null){
              if(!Array.isArray(data.categories))
                  throw new CustomError("Invalid value for categories");
          }
    }

    static clearSecretsFromQuiz(quiz: IQuiz): void{
        delete quiz.questionsResponsesHistoryEnabled;
        delete quiz.questionsFeedbackEnabled;
        delete quiz.shuffleQuestionsEnabled;

        if(quiz.categories == null)
            return;
        for(let i = 0; i < quiz.categories.length; i++ ){
            const category = quiz.categories[i];
            for(let j =0; j< category.questions.length; j++){
                const question = category.questions[j];
                for(let k = 0; k < question.answers.length; k++){
                    const answer = question.answers[k];
                    delete answer.description;
                    delete answer.isCorrect;
                }
            }
        }
    }
    async addQuiz(data: IClientRequestData): Promise<ServiceResponse>{
        try{
            const {result, message} = Validations.areFieldsProvided(["name", "passingPercentageGradeInDec", "timeToCompleteInSec",
                "allowedAttemptNumber","shuffleQuestionsEnabled", "questionsResponsesHistoryEnabled", "questionsFeedbackEnabled", "createdBy"], data);
            if(!result)
                return {err: new CustomError(message)};

            QuizzesService.validateQuizFields(data);
            for(let i = 0; i <  data.categories.length; i++){
                const category = data.categories[i];
                const {result, message} = Validations.areFieldsProvided(["name", "description", "questions"], category);
                if(!result)
                    return {err: new CustomError(`${message} in category: ${category.name}`)} ;
                category.id = QuizzesService.idGenerator();
                if(!Array.isArray(category.questions))
                    return {err: new CustomError("Invalid value for category.questions")};

                for(let j = 0; j < category.questions.length; j++){
                    const question = category.questions[j];
                    const {result, message} = Validations.areFieldsProvided(["name", "typeId"], question);
                    if(!result)
                        return {err: new CustomError(`${message} in question: ${question.name}, which is in category: ${category.name}`)};
                    question.id = QuizzesService.idGenerator();

                    for(let k = 0; k < question.answers.length ; k++){
                        const answer =  question.answers[k];
                        const {result, message} = Validations.areFieldsProvided(["content", "isCorrect"], answer);
                        if(!result)
                            return {err: new CustomError(`${message} in answer: ${answer.content}, which is  in category: ${category.name}.`)}
                        answer.id = QuizzesService.idGenerator();
                        if(answer.description == null)
                            continue;
                        if(answer.description.correctMessage == null || answer.description.inCorrectMessage == null)
                            return {err: new CustomError(`${message} in the description of answer: ${answer.content}, which is  in category: ${category.name}.`)}
                    }
                }
            }
            data.id = QuizzesService.idGenerator();
            const quiz :IQuiz = await this.quizzesRepository.insertOne(data);
            return {response: new ApiResponse(true, {quiz})};
        }catch (err){
            if(err.constraint === "quizzes_name_key")
                return {err: new CustomError("There is already a quiz with this name registered in the system.")};
            return {err};
        }
    }
    async editQuiz(data: IClientRequestData): Promise<ServiceResponse>{
        try{
            const {result, message} = Validations.areFieldsProvided(["id"], data);
            if(!result)
                return {err: new CustomError(message)};
            QuizzesService.validateQuizFields(data);

            await this.authorizationService.verifyAccessToQuizzes([data.id], data.userId);
            const quiz :IQuiz = await this.quizzesRepository.editOne(data);
            return {response: new ApiResponse(true, {quiz})};
        }catch (err){
            if(err.constraint === "quizzes_name_key")
                return {err: new CustomError("There is already a quiz with this name registered in the system.")};
            return {err};
        }
    }
    async getQuizzes(data: IClientRequestData): Promise<ServiceResponse>{
        try{
            const quizzes :IQuiz[] = await this.quizzesRepository.findMany(data);
            return {response: new ApiResponse(true, {quizzes})};
        }catch (err){
            if(err.constraint === "quizzes_name_key")
                return {err: new CustomError("There is already a quiz with this name registered in the system.")};
            return {err};
        }
    }
    async getQuiz(data: IClientRequestData) : Promise<ServiceResponse>{
        try{
            const {result, message} = Validations.areFieldsProvided(["id"], data);
            if(!result)
                return {err: new CustomError(message)};
            const quiz :IQuiz = await this.quizzesRepository.findOne(data.id);
            if(quiz == null)
                return {err: new CustomError("Quiz not found.")};
             return {response: new ApiResponse(true, {quiz})};
        }catch (err){
            return {err};
        }
    }
    async deleteQuizzes(data: IClientRequestData): Promise<ServiceResponse>{
       try{
            const {result, message} = Validations.areFieldsProvided(["ids"], data);
            if(!result)
                return {err: new CustomError(message)};
           await this.authorizationService.verifyAccessToQuizzes(data.ids, data.userId);
            const quizzes :IQuiz[] = await this.quizzesRepository.deleteMany(data);
            if(quizzes.length === 0)
                return {err: new CustomError("Quizzes not found.")}
            return {response: new ApiResponse(true, {quizzes})};
        }catch (err){
            if(err.constraint === "quizzes_name_key")
                return {err: new CustomError("There is already a quiz with this name registered in the system.")};
            return {err};
        }
    }

    async startUserQuiz(data: IClientRequestData): Promise<ServiceResponse>{
        try{
           const {result, message} = Validations.areFieldsProvided(["id", "userId"], data);
            if(!result)
                return {err: new CustomError(message)};
            await this.authorizationService.verifyAccessToStartQuiz(data.userId);
            const userQuiz = await this.quizzesRepository.insertUserQuiz(data.id, data.userId);
            QuizzesService.clearSecretsFromQuiz(userQuiz.quiz);
            return {response: new ApiResponse(true, {userQuiz})};
        }catch (err){
            if(err.constraint === "users_quizzes_user_id_quiz_id_key")
                return {err: new CustomError("User cannot do the same quiz more then once.")}
            return {err}
        }
    }

    async endUserQuiz(data: IClientRequestData) : Promise<ServiceResponse>{
        try{
            const {result, message} = Validations.areFieldsProvided(["id", "trialId", "userId", "questionsAnswers"], data);
            if(!result)
                return {err: new CustomError(message)};
            const questionsAnswers = data.questionsAnswers;
            if(!Array.isArray(questionsAnswers))
                return {err: new CustomError("Invalid value for questionsAnswers")};
            const answerIdsIndex = {};
            for(let i = 0; i < questionsAnswers.length; i++){
                const questionAnswer = questionsAnswers[i];
                const {result, message} = Validations.areFieldsProvided(["questionId", "answerId"], questionAnswer);
                if(!result)
                    return {err: new CustomError(message)};
                if(answerIdsIndex[questionAnswer.answerId] != null )
                    return {err: new CustomError(`Answers must be unique, answer - ${questionAnswer.answerId} sent more then once`)};
                answerIdsIndex[questionAnswer.answerId] = questionAnswer.answerId;
            }
            await this.authorizationService.verifyAccessToEndQuiz(data.userId);
            const userQuiz = await this.quizzesRepository.updateUserQuiz(data.id, data.trialId, questionsAnswers);
            return {response: new ApiResponse(true, {userQuiz})};
        }catch (err){
            return {err};
        }
    }

    async getOptionalQuizzes(data: IClientRequestData) : Promise<ServiceResponse>{
        try{
            const quizzes :IQuiz[] = await this.quizzesRepository.findMany(data);
            for(let i = 0; i < quizzes.length; i++)
                QuizzesService.clearSecretsFromQuiz(quizzes[i]);
            return {response: new ApiResponse(true, {quizzes})};
        }catch (err){
            if(err.constraint === "quizzes_name_key")
                return {err: new CustomError("There is already a quiz with this name registered in the system.")};
            return {err};
        }
    }
}
