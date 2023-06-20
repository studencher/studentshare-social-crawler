import {Logger} from "../studentcher-shared-utils/helpers/Logger";
import {CrawlerStateWorker} from "../studentcher-shared-utils/models/CrawlerStateWorker";
import redisClient from "../storage/redisClient";

export default new CrawlerStateWorker({logger: new Logger("CrawlerStateWorker"), redisClient});
