import logger from "../utils/Logger";
import {RedisAdapter} from "../studentcher-shared-utils/storage/RedisAdapter";

export default new RedisAdapter({
        host: process.env.REDIS_ADDRESS,
        port: parseInt(process.env.REDIS_PORT)},
    logger);
