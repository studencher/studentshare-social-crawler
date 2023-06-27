import puppeteer, {ElementHandle, KeyInput, Page} from "puppeteer";

import {Logger} from "../studentcher-shared-utils/helpers/Logger";

export interface IBrowserSimulator {
    getElementsByExpression(expression: string): Promise<ElementHandle<Node>[]>;
    stimulateWaiting(min: number, max: number): Promise<void>;
    scrollWindowDown(): Promise<void>;
    extractFirstParentLinkUrl(mageElement: ElementHandle<Node>): Promise<string>;
    clickElement(elementExpression: string): Promise<void>;
    typeInput(expression: string, textToType: string): Promise<void>;
    pressEnter(): Promise<void>;
    pressEscape(): Promise<void>;
    startSession(): Promise<void>;
    navigateToUrl(url: string): Promise<void>;
}

export class BrowserSimulator{
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
    private static readonly fakeUserAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36`
    // private static readonly fakeUserAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36`

    private logger: Logger;
    private page: Page;

    constructor({logger}: { logger: Logger}){
        this.logger = logger;
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
        await new Promise((resolve) => setTimeout(resolve, sleepTime * BrowserSimulator.secondInMS));
    }

    private async generatePage() {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.setViewport({width: 1280, height: 800, deviceScaleFactor: 1});
        await page.evaluateOnNewDocument((fakeUserAgent)=>{
            const open = window.open;
            window.open = (...args)=>{
                const newPage = open(...args);
                Object.defineProperty(newPage.navigator, 'userAgent', {get: ()=> fakeUserAgent});
                return newPage;
            }
        }, BrowserSimulator.fakeUserAgent);
        await page.setUserAgent(BrowserSimulator.fakeUserAgent);
        await page.goto("https://i-know-you-faked-user-agent.glitch.me/new-window", {waitUntil: "domcontentloaded"});
        // await browser.close();
        return page;
    }

    private verifyElementFounded(button: ElementHandle<Element>, elementExpression: string) {
        this.logger.info(`Element - ${elementExpression} ${button == null ? "NOT" : ""} FOUND`);
        if (button == null) {
            throw new Error(`Could not find element ${elementExpression}`);
        }
    }
    public async clickElement(elementExpression: string) {
        this.logger.info(`Searching for element ${elementExpression}`);
        const element = (await this.page.$x(elementExpression))[0] as ElementHandle<Element> ;
        this.verifyElementFounded(element, elementExpression);
        this.logger.info(`Hovering element`);
        await element.hover();
        await this.randomSleep(BrowserSimulator.randomSmallMin, BrowserSimulator.randomSmallMax);
        this.logger.info(`Clicking element`);
        await element.click();
        await this.randomSleep(BrowserSimulator.randomMediumMax, BrowserSimulator.randomMediumMax);
    }

    public async typeInput(expression: string, textToType: string) {
        const input = await this.page.$x(expression);
        this.verifyInputFounded(input);
        await input[0].focus();
        this.logger.info(`Typing ${textToType}`);
        const delay = this.getRandomTime(BrowserSimulator.randomVeryHighMin, BrowserSimulator.randomVeryHighMax);
        await this.page.keyboard.type(textToType, {delay});
    }


    public async navigateToUrl(url: string) {
        this.logger.info(`BrowserViewer is navigating to ${url}`);
        await this.page.goto(url, {waitUntil: "networkidle2"});
        await this.randomSleep(BrowserSimulator.randomHighMin, BrowserSimulator.randomHighMax);
        await this.pressKeyBoard(BrowserSimulator.escapeKeyBoardKey);

        await this.randomSleep(BrowserSimulator.randomMediumMin, BrowserSimulator.randomMediumMax);
    }

    async pressKeyBoard(key: KeyInput) {
        this.logger.info(`Pressing KEY - ${key}`);
        await this.page.keyboard.press(key);
    }

    public async pressEnter() {
        await this.pressKeyBoard(BrowserSimulator.enterKeyBoardKey);
    }

    public async pressEscape() {
        await this.pressKeyBoard(BrowserSimulator.escapeKeyBoardKey);
    }

    private verifyInputFounded(userInput: any[]) {
        this.logger.info(`Found ${userInput.length} userNameInput`);
        if(userInput.length === 0) {
            throw new Error("Could not find userNameInput");
        }
    }


    public async getElementsByExpression(expression: string) : Promise<ElementHandle<Node>[]> {
        return await this.page.$x(expression);
    }

    public async stimulateWaiting(min: number, max: number) {
        await this.randomSleep(min, max);
    }

    public async scrollWindowDown() {
        this.logger.info(`Scrolling window down...`);
        await this.page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
        await this.randomSleep(BrowserSimulator.randomMediumMin, BrowserSimulator.randomMediumMax);
    }

    public async extractFirstParentLinkUrl(imageElement: ElementHandle<Node>): Promise<string> {
        const linkHref = await this.page.evaluate((element) => {
            if (!(element instanceof HTMLElement))
                return null;
            const firstParentLink = element.closest('a');
            return firstParentLink ? firstParentLink.href : null;
        }, imageElement);
        return linkHref;
    }

    public async startSession() {
        this.logger.info(`Starting session`);
        const page = await this.generatePage();
        this.setPage(page);
    }
}

export default new BrowserSimulator({logger: new Logger("BrowserSimulator")})
