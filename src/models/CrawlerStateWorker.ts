import {Logger} from "../studentcher-shared-utils/helpers/Logger";
import {CrawlerStateWorker} from "../studentcher-shared-utils/models/CrawlerStateWorker";
import redisClient from "../storage/redisClient";
import crawlerService from "../services/CrawlersService";

export default new CrawlerStateWorker({
    logger: new Logger("CrawlerStateWorker"),
    redisClient,
    crawlerService
});

