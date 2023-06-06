import * as queries from "../helpers/postgresQueriesHelper/quizzesManagement";
import {EntityRepository} from "./EntityRepository";
import {PostgresAdapter} from "../storage/PostgresAdapter";
import {IClientRequestData} from "../models/ClientRequestData";
import {IQuiz, IUserQuiz, IUserQuizQuestionAnswer} from "../entities/quiz";
import {DdCommand} from "../storage/DdCommand";

export class QuizzesRepository extends EntityRepository{
    private dbClient : PostgresAdapter;
    constructor(pgClient) {
        super();
        this.dbClient = pgClient;
    }

    async findMany(_data: IClientRequestData): Promise<IQuiz[]>{
        const selectQuizzesQuery: string = queries.getSelectQuizQuery();
        const selectQuizzesValues = [];
        const response: any = await this.dbClient.callDbCmd(selectQuizzesQuery, selectQuizzesValues);
        return response.rows as IQuiz[];
    }
    async findOne(id: string) : Promise<IQuiz>{
        const selectQuizFullDataQuery = queries.getSelectQuizFullData();
        const selectQuizFullDataCommand = new DdCommand(selectQuizFullDataQuery, [[id]]);
        const response: any = await this.dbClient.callDb(selectQuizFullDataCommand);
        return response.rows[0] as IQuiz;

    }
    async insertOne(data: IClientRequestData) :Promise<IQuiz>{
        const sqlCommands :DdCommand[] = [];
        const insertQuizQuery: string = queries.getInsertQuizQuery();
        const insertQuizValues: any = [data.id, data.name, data.passingPercentageGradeInDec, data.allowedAttemptNumber,
            data.timeToCompleteInSec, data.shuffleQuestionsEnabled, data.questionsResponsesHistoryEnabled,
            data.questionsFeedbackEnabled ,data.createdBy];
        const insertQuizCommand = new DdCommand(insertQuizQuery, insertQuizValues);

        const insertQuizCategoryQuery: string = queries.getInsertQuizCategoryQuery();
        const insertQuizQuestionCommandsBucket: DdCommand[] = [];

        const insertQuizQuestionQuery: string = queries.getInsertQuizQuestionQuery();
        const insertQuizCategoryCommandsBucket: DdCommand[] = [];

        const insertQuizAnswerQuery: string = queries.getInsertQuizQuestionAnswerQuery();
        const insertQuizAnswerCommandsBucket: DdCommand[] = [];

        const insertQuizAnswerDescriptionQuery: string = queries.getInsertQuizQuestionAnswerDescriptionQuery();
        const insertQuizAnswerDescriptionCommandsBucket: DdCommand[] = [];

        const selectQuizFullDataQuery = queries.getSelectQuizFullData();
        const selectQuizFullDataCommand = new DdCommand(selectQuizFullDataQuery, [[data.id]]);
        const categoriesDataList = data.categories;
        for(let i = 0; i < categoriesDataList.length; i++){
            const categoryData = categoriesDataList[i];
            insertQuizCategoryCommandsBucket.push(new DdCommand(insertQuizCategoryQuery, [ categoryData.id, data.id, categoryData.name, categoryData.description]));
            const questionsDataList = categoryData.questions;
            for(let j = 0; j < questionsDataList.length; j++){
                const questionData = questionsDataList[j];
                insertQuizQuestionCommandsBucket.push(new DdCommand(insertQuizQuestionQuery, [questionData.id, questionData.typeId, categoryData.id, questionData.name]));

                const answersList = questionData.answers;
                for(let k=0; k<answersList.length; k++){
                    const answerData = answersList[k];
                    insertQuizAnswerCommandsBucket.push(new DdCommand(insertQuizAnswerQuery, [answerData.id, questionData.id, answerData.content, answerData.isCorrect]));
                    if (answerData.description == null)
                        continue;
                    insertQuizAnswerDescriptionCommandsBucket.push(new DdCommand(insertQuizAnswerDescriptionQuery, [answerData.id, answerData.description.correctMessage, answerData.description.inCorrectMessage]))
                }
            }
        }

        sqlCommands.push(insertQuizCommand, ...insertQuizCategoryCommandsBucket,
            ...insertQuizQuestionCommandsBucket, ...insertQuizAnswerCommandsBucket,
            ...insertQuizAnswerDescriptionCommandsBucket, selectQuizFullDataCommand);

        const response: any = await this.dbClient.callDbTransactionCmd(sqlCommands);
        const transactionLastIndex = sqlCommands.length - 1;
        return response[transactionLastIndex].rows[0] as IQuiz;
    }

    async editOne(data: IClientRequestData) :Promise<IQuiz>{
        const updateQuizQuery: string = queries.getUpdateQuizQuery();
        const updateQuizValues: any = [data.id, data.name, data.passingPercentageGradeInDec, data.allowedAttemptNumber,
            data.timeToCompleteInSec, data.shuffleQuestionsEnabled, data.questionsResponsesHistoryEnabled,
            data.questionsFeedbackEnabled];
        const response: any = await this.dbClient.callDbCmd(updateQuizQuery, updateQuizValues);
        return response.rows[0] as IQuiz;
    }

    async deleteMany(data: IClientRequestData) :Promise<IQuiz[]>{
        const deleteQuizQuery: string = queries.getDeleteQuizzesQuery();
        const deleteQuizValues: any = [data.ids];
        const response: any = await this.dbClient.callDbCmd(deleteQuizQuery, deleteQuizValues);
        return response.rows as IQuiz[];
    }

    async insertUserQuiz(id: string, userId: string) : Promise<IUserQuiz>{
        const sqlCommands = [];

        const insertUserQuizQuery = queries.getInsertUserQuizQuery();
        const insertUserQuizCommand = new DdCommand(insertUserQuizQuery, [userId, id]);

        const selectQuizFullDataQuery = queries.getSelectQuizFullData();
        const selectQuizFullDataCommand = new DdCommand(selectQuizFullDataQuery, [[id]]);

        sqlCommands.push(insertUserQuizCommand, selectQuizFullDataCommand);

        const response: any = await this.dbClient.callDbTransactionCmd(sqlCommands);
        const userQuiz: IUserQuiz = {...response[0].rows[0], quiz: response[1].rows[0]}
        return userQuiz
    }

    async updateUserQuiz(id: string, trialId: string, questionsAnswers: IUserQuizQuestionAnswer[]): Promise<IUserQuiz>{
        const sqlCommands = [];

        const insertUserQuizQuestionsAnswers = queries.getInsertUserQuizQuestionsAnswersQuery()
        const insertUserQuizQuestionsAnswersCommandsBucket: DdCommand[] = [];
        questionsAnswers.forEach(({questionId, answerId})=>{
            insertUserQuizQuestionsAnswersCommandsBucket.push(new DdCommand(insertUserQuizQuestionsAnswers, [trialId, questionId, answerId]));
        })

        const updateUserQuizQuery = queries.getUpdateUserQuizQuery();
        const updateUserQuizCommand = new DdCommand(updateUserQuizQuery, [trialId, true]);

        const selectQuizFullDataQuery = queries.getSelectQuizFullData();
        const selectQuizFullDataCommand = new DdCommand(selectQuizFullDataQuery, [[id]]);

        sqlCommands.push(...insertUserQuizQuestionsAnswersCommandsBucket, updateUserQuizCommand, selectQuizFullDataCommand);
        const postAnswerQuestionsIndex = insertUserQuizQuestionsAnswersCommandsBucket.length;
        const response: any = await this.dbClient.callDbTransactionCmd(sqlCommands);
        const userQuiz: IUserQuiz = {...response[postAnswerQuestionsIndex].rows[0], quiz: response[postAnswerQuestionsIndex + 1].rows[0]}
        return userQuiz
    }
}
