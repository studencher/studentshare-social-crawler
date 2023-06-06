import * as queries from "../helpers/postgresQueriesHelper/quizQuestionTypesManagement";
import {EntityRepository} from "./EntityRepository";
import {PostgresAdapter} from "../storage/PostgresAdapter";
import {IQuizQuestionType} from "../entities/quiz";
import {DdCommand} from "../storage/DdCommand";

export class QuizQuestionTypesRepository extends EntityRepository{
    private dbClient : PostgresAdapter;
    constructor(pgClient) {
        super();
        this.dbClient = pgClient;
    }
    async findMany() : Promise<IQuizQuestionType[]>{
        const selectQuizQuestionsTypesQuery = queries.getSelectQuizQuestionTypes();
        const selectQuizQuestionsTypesCommand = new DdCommand(selectQuizQuestionsTypesQuery, []);
        const response: any = await this.dbClient.callDb(selectQuizQuestionsTypesCommand);
        return response.rows as IQuizQuestionType[];

    }
}
