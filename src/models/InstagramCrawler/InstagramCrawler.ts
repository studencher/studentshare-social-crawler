import {Logger} from "../../studentcher-shared-utils/helpers/Logger";
import {ICrawlerStateWorker} from "../../studentcher-shared-utils/models/CrawlerStateWorker";
import {CrawlJob, ICrawlJob} from "../../studentcher-shared-utils/entities/CrawlJob";
import browserSimulator, {IBrowserSimulator} from "../BrowserSimulator";
import * as htmlExpressions from "./htmlExpressions";
import {FaceBookCrawler} from "../FaceBookCrawler/FaceBookCrawler";
import crawlerStateWorker from "../CrawlerStateWorker";
import {Constants} from "../../studentcher-shared-utils/helpers/Constants";

export class InstagramCrawler {
    private static readonly randomSmallMin = 2;
    private static readonly randomSmallMax = 4;
    private static readonly randomMediumMax = 10;
    private static readonly randomMediumMin = 5;
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
        const newCrawlJob = await this.crawlerStateWorker.blockPopCrawlJob(Constants.INSTAGRAM_CRAWL_JOB_QUEUE);
        this.logger.info(`New crawl job: ${newCrawlJob.toString()}`);
        this.setCrawlJob(newCrawlJob);
    }
    private async authenticate() {
        await this.browserSimulator.navigateToUrl(htmlExpressions.getInstagramUrl());
        await this.browserSimulator.typeInput(htmlExpressions.getUserNameInputExpression(), this.crawlJob.getUserName());
        await this.browserSimulator.typeInput(htmlExpressions.getPasswordInputExpression(), this.crawlJob.getPassword());
        await this.browserSimulator.clickElement(htmlExpressions.getLoginButtonExpression());
        await this.browserSimulator.stimulateWaiting(InstagramCrawler.randomMediumMin, InstagramCrawler.randomMediumMax);
        await this.browserSimulator.clickElement(htmlExpressions.getNotNowButtonExpression());
    }

    postErrorSleep() {
        return new Promise(resolve => setTimeout(resolve, InstagramCrawler.randomMediumMax));
    }

    private async openFollowersModal() {
        await this.browserSimulator.clickElement(htmlExpressions.getProfileFollowersLinkExpression());
    }

    private async clickFirstResult() {
        await this.browserSimulator.clickElement(htmlExpressions.getFirstLinkFoundedExpression());
    }

    private async searchKeyword(keyword: string) {
        await this.browserSimulator.clickElement(htmlExpressions.getSearchLinkExpression());
        await this.browserSimulator.typeInput(htmlExpressions.getSearchInputExpression(), keyword);
        await this.browserSimulator.stimulateWaiting(InstagramCrawler.randomSmallMin, InstagramCrawler.randomSmallMax);
    }

    private async handleCrawlerJob() {
        const keywords = this.crawlJob.getKeywords();
        if(keywords.length === 0) {
            this.logger.info(`No keywords to search`);
            return;
        }
        for(const keyword of keywords) {
            await this.searchKeyword(keyword);
            await this.clickFirstResult();
            await this.openFollowersModal();
            const followersLinks: string[] = await this.getFollowersLinks();
            this.saveFollowersLinks(followersLinks);
        }
    }

    private saveFollowersLinks(followersLinks: string[]) {
        this.logger.info(`Stimulate saving of #${followersLinks.length} followers, data: ${JSON.stringify(followersLinks)}`);
    }

    private async getFollowersLinks(): Promise<string[]> {
        const followersLinks = [];
        let hasMoreFollowers = true;
        let errorCount = 0;
        while (hasMoreFollowers) {
            const currentFollowersLinks = await this.browserSimulator.getElementsByExpression(htmlExpressions.getFollowersLinksExpression());
            const lastFollowerIndex = followersLinks.length - 1;
            const newFollowersLinks = followersLinks.length > 0 ? currentFollowersLinks.slice(lastFollowerIndex + errorCount) : currentFollowersLinks;
            const addedFollowersSnapshot = Array.from(newFollowersLinks);
            for (let i = 0; i < addedFollowersSnapshot.length; i++) {
                const imageElement = addedFollowersSnapshot[i];
                const friendUrl = await this.browserSimulator.extractClosestAncestorLinkUrl(imageElement);
                // this.logger.debug(`Found friend url: ${friendUrl}`);
                if (friendUrl != null)
                    followersLinks.push(friendUrl);
                else {
                    this.logger.warn(`Could not extract friend url - !`);
                    errorCount++;
                }
            }
            hasMoreFollowers = newFollowersLinks.length > 0;
            this.logger.info(`Found #${newFollowersLinks.length} new followers. overall #${followersLinks.length}`);
            if (!hasMoreFollowers)
                continue;
            await this.browserSimulator.scrollContainerDown(htmlExpressions.getFollowersLinksContainerExpression());
            await this.browserSimulator.stimulateWaiting(InstagramCrawler.randomSmallMin, InstagramCrawler.randomSmallMax);
        }

        return followersLinks;
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
                keywords: ["intraposition_uwb_tech"],
            },
            comment: {
                id: "1",
                description: "Test Comment",
                text: "DM :)",
            }
        }
    })
});
