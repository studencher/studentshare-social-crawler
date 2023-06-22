import {Logger} from "../../studentcher-shared-utils/helpers/Logger";
import openAIClient, {OpenAIClient} from "../../utils/OpenAIClient";
import {ICrawlerStateWorker} from "../../studentcher-shared-utils/models/CrawlerStateWorker";
import {CrawlJob, ICrawlJob} from "../../studentcher-shared-utils/entities/CrawlJob";
import crawlerStateWorker from "../CrawlerStateWorker";
import browserSimulator, {IBrowserSimulator} from "../BrowserSimulator";
import * as htmlExpressions from "./htmlExpressions";
import {ICrawlerState} from "../../studentcher-shared-utils/entities/CrawlerState";

export class FaceBookCrawler {
    private static readonly randomSmallMin = 0;
    private static readonly randomSmallMax = 1;
    private static readonly randomMediumMin = 2;
    private static readonly randomMediumMax = 4;

    private openAiClient: OpenAIClient = openAIClient;
    private logger: Logger;
    private crawlerStateWorker: ICrawlerStateWorker;
    private crawlJob?: ICrawlJob
    private browserSimulator: IBrowserSimulator;

    constructor({ logger, crawlerStateWorker, crawlJob, browserSimulator }: { logger: Logger, crawlerStateWorker: ICrawlerStateWorker, crawlJob?: ICrawlJob, browserSimulator: IBrowserSimulator }) {
        this.logger = logger;
        this.crawlerStateWorker = crawlerStateWorker;
        this.crawlJob = crawlJob;
        this.browserSimulator = browserSimulator;
    }



    private setCrawlJob(crawlJob: ICrawlJob) {
        this.crawlJob = crawlJob;
    }

    private async authenticatePage() {
        try{
            await this.browserSimulator.typeInput(htmlExpressions.getUserNameInputExpression(), this.crawlJob.getUserName());
            await this.browserSimulator.typeInput(htmlExpressions.getPasswordInputExpression(), this.crawlJob.getPassword());
            await this.browserSimulator.clickElement(htmlExpressions.getLoginButtonExpression());
            await this.browserSimulator.stimulateWaiting(FaceBookCrawler.randomMediumMin, FaceBookCrawler.randomMediumMax);
        }catch (err) {
            this.logger.error(err);
        }
    }

    private verifyContentRelevant(postContent: string) {
        const shouldSavePost = this.crawlJob.getKeywords().some(keyWord => postContent.includes(keyWord));
        if(!shouldSavePost) {
            throw new Error(`Post does not contain any of the key words, skipping...`);
        }
    }

    private async handlePost(postFeedIndex: number) {
        try{
            await this.verifyPostNotFunded(postFeedIndex);
            const postContent = await this.getPostContentByIndex(postFeedIndex);
            this.verifyContentRelevant(postContent);
            await this.savePost(postFeedIndex);
            if(this.shouldAddComment())
                await this.addComment(postFeedIndex);
            // await this.testAIPrompt();
            this.logger.info(`Post ${postFeedIndex} saved`);
        }catch (err) {
            this.logger.error(`Could not save post ${postFeedIndex}, Error: ${err}`);
        }
    }

    private async verifyPostNotFunded(postFeedIndex: number) {
        const fundedDisclaimerExpression = htmlExpressions.getFundedDisclaimerSpanExpression(postFeedIndex)
        const fundedDisclaimerSpans = await this.browserSimulator.getElementsByExpression(fundedDisclaimerExpression);
        this.logger.debug(`Funded disclaimer spans: ${fundedDisclaimerSpans.length}`);
        if(fundedDisclaimerSpans.length > 0)
            throw new Error(`Post ${postFeedIndex} is funded, skipping...`);


    }

    private shouldAddComment() {
        this.logger.info(`Should add comment: ${this.crawlJob.getComment() != null}`);
        return this.crawlJob.getComment() != null;
    }

    private async testAIPrompt(postContent: string) {
        const prompt = `On a scale of 1 to 10, what is the sentiment of the following post? \n\n${postContent}\n\n`;
        const sentientValue = await this.openAiClient.getResponse({prompt});
        this.logger.info(`Sentient value: ${sentientValue}`);
    }

    private async addComment(index: number) {
        await this.browserSimulator.clickElement(htmlExpressions.getPostCommentContainerExpression(index));
        await this.browserSimulator.typeInput(htmlExpressions.getPostCommentContainerExpression(index), this.crawlJob.getComment());
        await this.browserSimulator.pressEnter();
        await this.browserSimulator.stimulateWaiting(FaceBookCrawler.randomSmallMin, FaceBookCrawler.randomSmallMax);
        await this.browserSimulator.clickElement(htmlExpressions.getCloseCommentsModalDivExpression());
    }

    private async savePost(index: number) {
        await this.browserSimulator.clickElement(htmlExpressions.getMoreActionsButtonExpression(index));
        await this.browserSimulator.clickElement(htmlExpressions.getSavePostSpanExpression());
        await this.browserSimulator.clickElement(htmlExpressions.getPrivatePostsCollectionSpanExpression(this.crawlJob.getPostsCollection()));
        await this.browserSimulator.clickElement(htmlExpressions.getEndOfSaveDivExpression());
    }

    private async getPostContentByIndex(i: number) {
        const postContent = await this.getPostContent(i);
        const commentsContent = await this.getCommentsContent(i);
        return commentsContent.concat(postContent).join(" ");
    }

    private async getPostContent(i: number) {
        const postElement = await this.browserSimulator.getElementsByExpression(htmlExpressions.getPostContentDivExpression(i));
        this.logger.debug(`Post ${i} element: ${postElement}`);
        const postContent =  await (await postElement[0].getProperty('textContent')).jsonValue();
        this.logger.info(`Post ${i} content: ${postContent}`);
        return postContent;
    }



    private async getCommentsContent(i: number) {
        try {
            await this.browserSimulator.clickElement(htmlExpressions.getOpenCommentsModalDivExpression(i));
            const commentsElements = await this.browserSimulator.getElementsByExpression(htmlExpressions.getCommentsDivsExpression());
            const commentsContent = [];
            for (const commentElement of commentsElements) {
                const commentContent = await (await commentElement.getProperty('textContent')).jsonValue();
                commentsContent.push(commentContent);
            }
            this.logger.info(`Post ${i} comments content: ${commentsContent.join()}`);
            await this.browserSimulator.clickElement(htmlExpressions.getCloseCommentsModalDivExpression());
            return commentsContent;
        }catch (err) {
            this.logger.error(`Could not get comments content, Error: ${err}`);
            return [];
        }   

    }

    private async loadCrawlerJob() {
        const newCrawlJob = await this.crawlerStateWorker.blockPopCrawlJob();
        this.logger.info(`New crawl job: ${newCrawlJob.toString()}`);
        this.setCrawlJob(newCrawlJob);
    }

    private clearCrawlerJob() {
        this.crawlJob = null;
    }

    private async endCrawlerJob() {
        await this.crawlerStateWorker.endCrawlerJob(this.crawlJob.getCrawlerId());
    }

    private async handleCrawlerJob() {
        if(this.crawlJob == null){
            this.logger.warn(`Crawl job is not define, skipping...`);
            return;
        }
        const urls = [];
        const crawlJobUrl = this.crawlJob.getUrl();
        if(crawlJobUrl == null){
            await this.defaultCrawlActions(urls);
        }
        else {
            urls.push(crawlJobUrl);
        }
        await this.handleUrlsFeeds(urls);
        const crawlerState = await this.crawlerStateWorker.getCrawlerState(this.crawlJob.getCrawlerId());
        const newProfilesSearchedOverAll = await this.crawlerStateWorker.getIncrementStateProperty({
            crawlerId: this.crawlJob.getCrawlerId(),
            property: "profilesSearchedOverAll"
        });
        const isCrawlJobDone = this.crawlerStateWorker.isCrawlerJobDone({
            crawlerState,
            newProfilesSearchedOverAll
        })
        if(isCrawlJobDone)
            await this.endCrawlerJob();
    }

    private async handleUrlsFeeds(urls: any[]) {
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            await this.browserSimulator.navigateToUrl(url);
            await this.handleFeed();
        }
    }

    private async defaultCrawlActions(urls: any[]) {
        const defaultUrls = await this.getDefaultUrls();
        if (defaultUrls.userProfileUrl != null) {
            urls.push(defaultUrls.userProfileUrl);
            await this.enqueueFriendsUrls(defaultUrls.userProfileUrl);
        }
        if (defaultUrls.friendsFeedUrl != null)
            urls.push(defaultUrls.friendsFeedUrl);
    }

    private async getDefaultUrls(): Promise<{userProfileUrl: string | null, friendsFeedUrl: string | null}> {
        this.logger.info(`Adding default urls`);
        const defaultUrls = {
            userProfileUrl: null,
            friendsFeedUrl: null
        };
        const linksElement = await this.browserSimulator.getElementsByExpression(htmlExpressions.getUserSideBarNavigationLinks());
        const userProfileLinkElement = linksElement[0];
        const hrefProperty = await userProfileLinkElement.getProperty('href');
        const linkHref = await hrefProperty.jsonValue();
        this.logger.info(`User profile link: ${linkHref}`);
        if (typeof linkHref === "string")
            defaultUrls.userProfileUrl = linkHref;
        defaultUrls.friendsFeedUrl = htmlExpressions.getFaceBookFriendsFeedUrl();
        return defaultUrls;
    }

    private async handleFeed() {
        for (let i = 2; i < 150; i++) {
            await this.handlePost(i);
            await this.browserSimulator.scrollWindowDown();
        }
    }

    private async distributeNewCrawlerJobs(friendsUrl: string[]) {
        const crawlerJobs = [];
        for (const friendUrl of friendsUrl) {
            const friendCrawlJob = new CrawlJob({
                crawler: this.crawlJob.getCrawlerCopy(),
                url: friendUrl
            });
            crawlerJobs.push(friendCrawlJob);
        }
        await this.crawlerStateWorker.pushManyCrawlJobs(crawlerJobs);
    }

    private async enqueueFriendsUrls(profileUrl: string) {
        this.logger.info(`Enqueuing friends urls`);
        await this.navigateToUserFriendsTab(profileUrl);
        const friendsUrl = await this.extractFriendsUrl();
        this.logger.info(`Found #${friendsUrl.length} Friends urls.`);
        await this.distributeNewCrawlerJobs(friendsUrl);
    }

    private async navigateToUserFriendsTab(profileUrl: string) {
        await this.browserSimulator.navigateToUrl(profileUrl);
        await this.browserSimulator.clickElement(htmlExpressions.getFriendsTabExpression());
    }

    private async extractFriendsUrl() : Promise<string[]> {
        const friendsUrls = [];
        let isSearchEnded = false;
        let nullCounter = 0;
        while (!isSearchEnded) {
            await this.browserSimulator.scrollWindowDown();
            const scrolledFriendsUrls: string[] = await this.getScrolledFriendsUrls({friendsUrls, nullCounter});
            friendsUrls.push(...scrolledFriendsUrls);
            isSearchEnded = scrolledFriendsUrls.length === 0;
        }

        return friendsUrls;
    }

    private async getScrolledFriendsUrls({friendsUrls, nullCounter}: { friendsUrls: string[]; nullCounter: number }): Promise<string[]> {
        const addedFriendsUrls = [];
        try {
            const imgElements = await this.browserSimulator.getElementsByExpression(htmlExpressions.getFriendImageExpression());
            const newImgElements = imgElements.slice(friendsUrls.length + nullCounter);
            const imgElementsSnapshot = Array.from(newImgElements);
            for (let i = 0; i < imgElementsSnapshot.length; i++) {
                const imageElement = imgElementsSnapshot[i];

                const friendUrl = await this.browserSimulator.extractFirstParentLinkUrl(imageElement);
                if (friendUrl != null)
                    addedFriendsUrls.push(friendUrl);
                else
                    nullCounter++;
            }
            this.logger.info(`Overall friend urls counter: ${friendsUrls.length}`);
        } catch (err) {
            this.logger.error(`Could not get friends urls, Error: ${err}`);
        }
        return addedFriendsUrls;
    }

    private async handleCrawlerJobError() {
        const crawlerState: ICrawlerState = await this.crawlerStateWorker.getCrawlerState(this.crawlJob.getCrawlerId());
        const newErrorCounts = await this.crawlerStateWorker.getIncrementStateProperty({
                crawlerId: this.crawlJob.getCrawlerId(),
                property: "errorsCount"
            }
        )
        const isCrawlerJobDone = this.crawlerStateWorker.isCrawlerJobDone({
            crawlerState,
            newErrorCounts
        })
        if(isCrawlerJobDone)
            await this.endCrawlerJob();
    }

    async run() {
        this.logger.info(`FaceBookCrawler is starting`);
        await this.browserSimulator.startSession();
        while(true){
            try{
                if(this.crawlJob == null) {
                    await this.loadCrawlerJob();
                }
                await this.browserSimulator.navigateToUrl(htmlExpressions.getFaceBookLoginUrl());
                await this.authenticatePage();
                await this.handleCrawlerJob();
            }catch (err){
                this.logger.error(`Error: ${err.message}`);
                await this.handleCrawlerJobError();
                await new Promise(resolve => setTimeout(resolve, FaceBookCrawler.randomMediumMax));
            }finally {
                this.clearCrawlerJob();
            }
        }
    }

}

export default new FaceBookCrawler({
    logger: new Logger("BrowserViewer"),
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
