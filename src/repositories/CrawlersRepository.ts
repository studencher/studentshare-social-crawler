import pgClient from "../storage/postgresAdapter";
import {CrawlersRepository} from "../studentcher-shared-utils/repositories/CrawlersRepository/CrawlersRepository";


export default new CrawlersRepository(pgClient);

