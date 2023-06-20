import {ICrawler} from "../studentcher-shared-utils/entities/crawler";

export interface ICrawlJob {
    crawler: ICrawler;
    url: string;
}
