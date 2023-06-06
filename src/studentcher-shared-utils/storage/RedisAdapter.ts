import Redis from 'ioredis';
import {Logger} from "../helpers/Logger";

export class RedisAdapter{
    public client: Redis;
    private TOPICS_SUBSCRIBERS: Record<string, boolean>;
    private logger: Logger;

    constructor({host = "", port}, logger) {
        const redisPort = isNaN(port) || port == null ? 6379 : port
        this.client = new Redis({port: redisPort, host})
        this.TOPICS_SUBSCRIBERS = {};
        this.logger = logger;
        this.client.on("connect", function() {
            logger.info(`Redis client connected`);
        });

        this.client.on("error", function(err: any) {
            logger.error(err.message);
        });
    }

    async subscribe(topic: string): Promise<void>{
        this.logger.debug(`RedisAdapter subscribe to topic: ${topic}`);
        if(topic == null)
            throw new Error("topic must be provided.");
        if(this.TOPICS_SUBSCRIBERS[topic] != null)
            return;
        this.TOPICS_SUBSCRIBERS[topic] = true;
        await this.client.subscribe(topic);
    }

    async unsubscribe(topic) : Promise<void>{
        this.logger.debug(`RedisAdapter unsubscribe from topic: ${topic}`);
        if(topic == null)
            throw new Error("topic must be provided.");
        const isSubscribed = this.TOPICS_SUBSCRIBERS[topic]
        if(!isSubscribed)
            return;
        await this.client.unsubscribe(topic);
        delete this.TOPICS_SUBSCRIBERS[topic];
    }

    async publish(topic, message): Promise<void>{
        this.logger.debug(`Publishing message using RedisAdapter: ${topic}, ${message}`);
        await this.client.publish(topic, message);
    }
}
