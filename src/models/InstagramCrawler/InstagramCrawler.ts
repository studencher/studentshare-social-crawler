import {Logger} from "../../studentcher-shared-utils/helpers/Logger";
import {ICrawlerStateWorker} from "../../studentcher-shared-utils/models/CrawlerStateWorker";
import {CrawlJob, ICrawlJob} from "../../studentcher-shared-utils/entities/CrawlJob";
import browserSimulator, {IBrowserSimulator} from "../BrowserSimulator";
import * as htmlExpressions from "./htmlExpressions";
import {FaceBookCrawler} from "../FaceBookCrawler/FaceBookCrawler";
import crawlerStateWorker from "../CrawlerStateWorker";
import {getProfileNavSpanExpression} from "./htmlExpressions";

export class InstagramCrawler {
    private static readonly randomMediumMax = 4;
    private static readonly randomMediumMin = 2;
    private logger: Logger;
    private crawlerStateWorker: ICrawlerStateWorker;
    private crawlJob?: ICrawlJob
    private browserSimulator: IBrowserSimulator;
    private faceBookCrawler: FaceBookCrawler;

    constructor({ logger, crawlerStateWorker, crawlJob, browserSimulator }: { logger: Logger, crawlerStateWorker: ICrawlerStateWorker, crawlJob?: ICrawlJob, browserSimulator: IBrowserSimulator }) {
        this.logger = logger;
        this.crawlerStateWorker = crawlerStateWorker;
        this.crawlJob = crawlJob;
        this.browserSimulator = browserSimulator;
        this.faceBookCrawler = new FaceBookCrawler({
            browserSimulator,
            logger,
            crawlerStateWorker,
            crawlJob
        });
    }

    private setCrawlJob(crawlJob: ICrawlJob) {
        this.crawlJob = crawlJob;
    }

    private async loadCrawlerJob() {
        const newCrawlJob = await this.crawlerStateWorker.blockPopCrawlJob();
        this.logger.info(`New crawl job: ${newCrawlJob.toString()}`);
        this.setCrawlJob(newCrawlJob);
    }
    private async authenticate() {
        await this.browserSimulator.navigateToUrl(htmlExpressions.getInstagramUrl());
        await this.browserSimulator.typeInput(htmlExpressions.getUserNameInputExpression(), this.crawlJob.getUserName());
        await this.browserSimulator.typeInput(htmlExpressions.getPasswordInputExpression(), this.crawlJob.getPassword());
        await this.browserSimulator.clickElement(htmlExpressions.getLoginButtonExpression());
        await this.browserSimulator.clickElement(htmlExpressions.getNotNowButtonExpression());
        await this.browserSimulator.stimulateWaiting(InstagramCrawler.randomMediumMin, InstagramCrawler.randomMediumMax);
    }
    postErrorSleep() {
        return new Promise(resolve => setTimeout(resolve, InstagramCrawler.randomMediumMax));
    }
    private async handleCrawlerJob() {
        await this.browserSimulator.clickElement(htmlExpressions.getProfileNavSpanExpression());
    }

    async run() {
        this.logger.info(`Starting`);
        await this.browserSimulator.startSession();
        // while(true){
            try{
                if(this.crawlJob == null) {
                    await this.loadCrawlerJob();
                }
                // await this.faceBookCrawler.authenticate();
                await this.authenticate();
                await this.handleCrawlerJob();
            }catch (err){
                this.logger.error(`Error: ${err.message}`);
                // await this.handleCrawlerJobError();
                await this.postErrorSleep();
            }finally {
                // this.clearCrawlerJob();
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        // }
    }
}

export default new InstagramCrawler({
    logger: new Logger("InstagramCrawler"),
    crawlerStateWorker,
    browserSimulator,
    crawlJob: new CrawlJob({
        crawler: {
            id: "1",
            description: "Test Crawl",
            createdAt: new Date(),
            updatedAt: new Date(),
            account: {
                id: "1",
                username: "elhararor207@gmail.com",
                password: "Kingvegita207",
                description: "Test Crawl",
                postsCollection: "Interesting-posts"
            },
            search: {
                id: "1",
                description: "Test Search",
                keywords: ["Software", "Developer", "Programmer", "Engineer"],
            },
            comment: {
                id: "1",
                description: "Test Comment",
                text: "DM :)",
            }
        }
    })
});
