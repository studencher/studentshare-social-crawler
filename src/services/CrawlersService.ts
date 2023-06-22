import {CrawlersService} from "../studentcher-shared-utils/services/CrawlersService";
import crawlersRepository from "../repositories/CrawlersRepository";

export default new CrawlersService(crawlersRepository);
