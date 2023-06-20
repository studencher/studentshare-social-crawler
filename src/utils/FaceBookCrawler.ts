import puppeteer, {ElementHandle, KeyInput, Page} from "puppeteer";
import {Logger} from "../studentcher-shared-utils/helpers/Logger";
import {faceBookPassword, faceBookUserName} from "../secrets";
import openAIClient, {OpenAIClient} from "./OpenAIClient";
import {RedisAdapter} from "../studentcher-shared-utils/storage/RedisAdapter";
import {Constants} from "../studentcher-shared-utils/helpers/Constants";
import redisClient from "../storage/redisClient";

export class FaceBookCrawler {
    private static readonly enterKeyBoardKey : KeyInput = 'Enter';
    private static escapeKeyBoardKey : KeyInput = 'Escape';
    private static readonly secondInMS = 1000;
    private static readonly randomSmallMin = 0;
    private static readonly randomSmallMax = 1;
    private static readonly randomMediumMin = 2;
    private static readonly randomMediumMax = 4;
    private static readonly randomHighMin = 10;
    private static readonly randomHighMax = 20;
    private static readonly randomVeryHighMin = 50;
    private static readonly randomVeryHighMax = 100;

    private openAiClient: OpenAIClient = openAIClient;
    private logger: Logger;
    private redisClient: RedisAdapter;
    private userName: string;
    private password: string;
    private postsCollectionName: string;
    private comment: string | undefined ;
    private keyWords: string[];
    private page: Page;
    private urls: string[];

    constructor({ logger, redisClient, userName, password, privatePostsCollectionName, keyWords, comment = null, urls = [] }:
                    { logger: Logger, redisClient: RedisAdapter,
                        userName: string, password: string,
                        privatePostsCollectionName: string, keyWords: string[], comment?: string | undefined, urls?: string[] }) {
        this.logger = logger;
        this.redisClient = redisClient;
        this.userName = userName;
        this.password = password;
        this.postsCollectionName = privatePostsCollectionName;
        this.keyWords = keyWords;
        this.comment = comment;
        this.urls = urls;
    }

    private getFaceBookGroupsFeedUrl() {
        return "https://www.facebook.com/groups/feed/";
    }

    private getFaceBookFriendsFeedUrl() {
        return "https://www.facebook.com/?filter=friends&sk=h_chr";
    }

    private getFriendsTabExpression() {
        return "//div[@data-pagelet='ProfileTabs']//div[@role='tablist']//a[@role='tab']//span[contains(text(), 'חברים')]";
    }

    private getUserSideBarNavigationLinks() {
        return "(//div[@role='navigation'])[position() = 3]//a[@role='link'][1]";
    }

    private getFaceBookLoginUrl() {
        return "https://www.facebook.com/login/";
    }

    private getLoginButtonExpression() {
        return "//button[@id='loginbutton']";
    }

    private getPasswordInputExpression() {
        return "//input[@id='pass']";
    }

    private getUserNameInputExpression() {
        return "//input[@id='email']";
    }

    private getSavePostSpanExpression() {
        return "//span[contains(text(), 'שמור את הפוסט')]";
    }

    private getPrivatePostsCollectionSpanExpression() {
        return `//span[contains(text(), '${this.postsCollectionName}')]`;
    }

    private getEndOfSaveDivExpression() {
        return "//div[@aria-label='סיום']";
    }

    private getMoreActionsButtonExpression(index : number) {
        return `${this.getFeedContainerPrefix(index)}//div[@aria-label='פעולות לפוסט זה']`;
    }

    private getFeedContainerPrefix(index: number) {
        return `(//div[@role='feed'] | //div[@data-pagelet='ProfileTimeline'])//div[${index}]`;
    }

    private getPostContentDivExpression(index: number) {
        return `${this.getFeedContainerPrefix(index)}//div[@data-ad-preview='message']`;
    }

    private getFundedDisclaimerSpanExpression(index: number) {
        return `${this.getFeedContainerPrefix(index)}//span[contains(text(), 'ממומן')]`;
    }

    private getOpenCommentsModalDivExpression(index: number) {
        return `${this.getFeedContainerPrefix(index)}//span[contains(text(), 'תגובות')]`;
    }

    private getCloseCommentsModalDivExpression() {
        return "//div[@aria-label='סגירה']";
    }

    private getCommentsDivsExpression() {
        return `//div[@role='dialog']//div//div//div//div//ul//div[@style='text-align: start;']`
    }

    private getPostCommentContainerExpression(index: number) {
        return `${this.getFeedContainerPrefix(index)}//div[contains(text(), 'כתיבת תגובה ציבורית...')]`;
    }

    private setPage(page: Page) {
        this.page = page;
    }

    private getRandomTime(min: number = 0, max: number = 10) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    private async randomSleep(min: number = 0, max: number = 10) {
        const sleepTime = this.getRandomTime(min, max);
        this.logger.info(`Sleeping for ${sleepTime} seconds`);
        await new Promise((resolve) => setTimeout(resolve, sleepTime * FaceBookCrawler.secondInMS));
    }

    private async generatePage() {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.setViewport({width: 1280, height: 800, deviceScaleFactor: 1});
        return page;
    }

    private async clickElement(elementExpression: string) {
        const element = (await this.page.$x(elementExpression))[0] as ElementHandle<Element> ;
        this.verifyElementFounded(element, elementExpression);
        this.logger.info(`Hovering element`);
        await element.hover();
        await this.randomSleep(FaceBookCrawler.randomSmallMin, FaceBookCrawler.randomSmallMax);
        this.logger.info(`Clicking element`);
        await element.click();
        await this.randomSleep(FaceBookCrawler.randomMediumMax, FaceBookCrawler.randomMediumMax);
    }

    private verifyElementFounded(button: ElementHandle<Element>, elementExpression: string) {
        this.logger.info(`Element - ${elementExpression} ${button == null ? "NOT" : ""} FOUND`);
        if (button == null) {
            throw new Error(`Could not find element ${elementExpression}`);
        }
    }

    private async typeInput(expression: string, textToType: string) {
        const input = await this.page.$x(expression);
        this.verifyInputFounded(input);
        await input[0].focus();
        this.logger.info(`Typing ${textToType}`);
        const delay = this.getRandomTime(FaceBookCrawler.randomVeryHighMin, FaceBookCrawler.randomVeryHighMax);
        await this.page.keyboard.type(textToType, {delay});
    }


    private async navigateToUrl(url: string) {
        this.logger.info(`BrowserViewer is navigating to ${url}`);
        await this.page.goto(url, {waitUntil: "networkidle2"});
        await this.randomSleep(FaceBookCrawler.randomHighMin, FaceBookCrawler.randomHighMax);
        await this.pressKeyBoard(FaceBookCrawler.escapeKeyBoardKey);

        await this.randomSleep(FaceBookCrawler.randomMediumMin, FaceBookCrawler.randomMediumMax);
    }

    private async pressKeyBoard(key: KeyInput) {
        this.logger.info(`Pressing KEY - ${key}`);
        await this.page.keyboard.press(key);
    }

    private verifyInputFounded(userInput: any[]) {
        this.logger.info(`Found ${userInput.length} userNameInput`);
        if(userInput.length === 0) {
            throw new Error("Could not find userNameInput");
        }
    }
    private async authenticatePage() {
        try{
            await this.typeInput(this.getUserNameInputExpression(), this.userName);
            await this.typeInput(this.getPasswordInputExpression(), this.password);
            await this.clickElement(this.getLoginButtonExpression());
            await this.randomSleep(FaceBookCrawler.randomMediumMin, FaceBookCrawler.randomMediumMax);
        }catch (err) {
            this.logger.error(err);
        }
    }

    private verifyContentRelevant(postContent: string) {
        const shouldSavePost = this.keyWords.some(keyWord => postContent.includes(keyWord));
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
        const fundedDisclaimerSpans = await this.page.$x(this.getFundedDisclaimerSpanExpression(postFeedIndex));
        this.logger.debug(`Funded disclaimer spans: ${fundedDisclaimerSpans.length}`);
        if(fundedDisclaimerSpans.length > 0)
            throw new Error(`Post ${postFeedIndex} is funded, skipping...`);


    }

    private shouldAddComment() {
        this.logger.info(`Should add comment: ${this.comment != null}`);
        return this.comment != null;
    }

    private async testAIPrompt(postContent: string) {
        const prompt = `On a scale of 1 to 10, what is the sentiment of the following post? \n\n${postContent}\n\n`;
        const sentientValue = await this.openAiClient.getResponse({prompt});
        this.logger.info(`Sentient value: ${sentientValue}`);
    }

    private async addComment(index: number) {
        await this.clickElement(this.getPostCommentContainerExpression(index));
        await this.typeInput(this.getPostCommentContainerExpression(index), this.comment);
        await this.pressKeyBoard(FaceBookCrawler.enterKeyBoardKey);
        await this.randomSleep(FaceBookCrawler.randomSmallMin, FaceBookCrawler.randomSmallMax);
        await this.clickElement(this.getCloseCommentsModalDivExpression());
    }

    private async savePost(index: number) {
        await this.clickElement(this.getMoreActionsButtonExpression(index));
        await this.clickElement(this.getSavePostSpanExpression());
        await this.clickElement(this.getPrivatePostsCollectionSpanExpression());
        await this.clickElement(this.getEndOfSaveDivExpression());
    }

    private async getPostContentByIndex(i: number) {
        const postContent = await this.getPostContent(i);
        const commentsContent = await this.getCommentsContent(i);
        return commentsContent.concat(postContent).join(" ");
    }

    private async getPostContent(i: number) {
        const postElement = await this.page.$x(this.getPostContentDivExpression(i));
        this.logger.debug(`Post ${i} element: ${postElement}`);
        const postContent =  await (await postElement[0].getProperty('textContent')).jsonValue();
        this.logger.info(`Post ${i} content: ${postContent}`);
        return postContent;
    }



    private async getCommentsContent(i: number) {
        try {
            await this.clickElement(this.getOpenCommentsModalDivExpression(i));
            const commentsElements = await this.page.$x(this.getCommentsDivsExpression());
            const commentsContent = [];
            for (const commentElement of commentsElements) {
                const commentContent = await (await commentElement.getProperty('textContent')).jsonValue();
                commentsContent.push(commentContent);
            }
            this.logger.info(`Post ${i} comments content: ${commentsContent.join()}`);
            await this.clickElement(this.getCloseCommentsModalDivExpression());
            return commentsContent;
        }catch (err) {
            this.logger.error(`Could not get comments content, Error: ${err}`);
            return [];
        }

    }


    private async scrollWindowDown() {
        this.logger.info(`Scrolling window down...`);
        await this.page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
        await this.randomSleep(FaceBookCrawler.randomMediumMin, FaceBookCrawler.randomMediumMax);
    }

    async run() {
        this.logger.info(`FaceBookCrawler is starting`);
        const data = await this.redisClient.pop({queue: Constants.CRAWL_JOBS_QUEUE, options: {shouldBeBlocked: true}});
        this.logger.info(`Data: ${data}`);
        const page = await this.generatePage();
        this.setPage(page);
        await this.navigateToUrl(this.getFaceBookLoginUrl());
        await this.authenticatePage();
        await this.handleUrlsFeed();
    }

    private async handleUrlsFeed() {
        if(this.urls.length == 0){
            await this.addDefaultUrls();
        }
        for (let i = 0; i < this.urls.length; i++) {
            const url = this.urls[i];
            // if(i === 0)
            //     await this.enqueueFriendsUrls(url)
            await this.navigateToUrl(url);
            await this.handleFeed();
        }
    }


    private async addDefaultUrls() {
        this.logger.info(`Adding default urls`);
        const linksElement = await this.page.$x(this.getUserSideBarNavigationLinks());
        const userProfileLinkElement = linksElement[0];
        const hrefProperty = await userProfileLinkElement.getProperty('href');
        const linkHref = await hrefProperty.jsonValue();
        this.logger.info(`User profile link: ${linkHref}`);
        if (typeof linkHref === "string")
            this.urls.push(linkHref);
        this.urls.push(this.getFaceBookFriendsFeedUrl());
    }

    private async   handleFeed() {
        for (let i = 2; i < 15; i++) {
            await this.handlePost(i);
            await this.scrollWindowDown();
        }
    }

    private async enqueueFriendsUrls(profileUrl: string) {
        this.logger.info(`Enqueuing friends urls`);
        await this.navigateToUserFriendsTab(profileUrl);
        const friendsUrl = await this.extractFriendsUrl();
        this.logger.info(`Found #${friendsUrl.length} Friends urls.`);
    }


    private async navigateToUserFriendsTab(profileUrl: string) {
        await this.navigateToUrl(profileUrl);
        await this.clickElement(this.getFriendsTabExpression());
    }

    private async extractFriendsUrl() : Promise<string[]> {
        const friendsUrls = [];
        let isSearchEnded = false;
        let nullCounter = 0;
        while (!isSearchEnded) {
            await this.scrollWindowDown();
            const scrolledFriendsUrls: string[] = await this.getScrolledFriendsUrls({friendsUrls, nullCounter});
            friendsUrls.push(...scrolledFriendsUrls);
            isSearchEnded = scrolledFriendsUrls.length === 0;
        }

        return friendsUrls;
    }

    private async getScrolledFriendsUrls({friendsUrls, nullCounter}: { friendsUrls: string[]; nullCounter: number }): Promise<string[]> {
        const addedFriendsUrls = [];
        try {
            const imgElements = await this.page.$x(this.getFriendImageExpression());
            const newImgElements = imgElements.slice(friendsUrls.length + nullCounter);
            const imgElementsSnapshot = Array.from(newImgElements);
            for (let i = 0; i < imgElementsSnapshot.length; i++) {
                const imageElement = imgElementsSnapshot[i];

                const friendUrl = await this.extractFirstParentLinkUrl(imageElement);
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

    private async extractFirstParentLinkUrl(imageElement: ElementHandle<Node>) {
        const linkHref = await this.page.evaluate((element) => {
            if (!(element instanceof HTMLElement))
                return null;
            const firstParentLink = element.closest('a');
            return firstParentLink ? firstParentLink.href : null;
        }, imageElement);
        return linkHref;
    }

    private getFriendImageExpression() {
        return "//div[@data-pagelet='ProfileAppSection_0']//img";
    }
}

export default new FaceBookCrawler({
    logger: new Logger("BrowserViewer"),
    redisClient,
    userName: "elhararor207@gmail.com",
    password: faceBookPassword,
    privatePostsCollectionName: "Interesting-Posts",
    keyWords: ["דרושים", "בלעדי","בלעדיות"],
    urls: []
})

// TODO -
//  1. ! verify the crawl is considering posts' comments as well - DONE
//  2. Try to search for old posts as well
//  4. Comment on a post - DONE, but seems like image upload is not optional !!!
//  5. UI:
//      5.1. Add facebook account to manage (add, edit, delete):
//          5.1.1. Description
//          5.1.2. Username
//          5.1.3. Password
//          5.1.4. Groups to crawl
//      5.2 Searches management:
//          5.2.1. Add search -
//              description, keywords, groups to search in (Programmatically adding)
//          5.2.2. Edit search
//          5.2.3. Delete search
//          5.2.4 Get search results and history
//      5.3. Comments management (add, edit, delete):
//          5.3.1. Add text and or image to searched post
//      5.4 run the crawler
//     choose search, choose groups to search in, choose account to use, choose comments to add
