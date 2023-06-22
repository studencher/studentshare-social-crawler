export function getFaceBookGroupsFeedUrl() {
    return "https://www.facebook.com/groups/feed/";
}

export function getFaceBookFriendsFeedUrl() {
    return "https://www.facebook.com/?filter=friends&sk=h_chr";
}

export function getFriendsTabExpression() {
    return "//div[@data-pagelet='ProfileTabs']//div[@role='tablist']//a[@role='tab']//span[contains(text(), 'חברים')]";
}

export function getUserSideBarNavigationLinks() {
    return "(//div[@role='navigation'])[position() = 3]//a[@role='link'][1]";
}

export function getFaceBookLoginUrl() {
    return "https://www.facebook.com/login/";
}

export function getLoginButtonExpression() {
    return "//button[@id='loginbutton']";
}

export function getPasswordInputExpression() {
    return "//input[@id='pass']";
}

export function getUserNameInputExpression() {
    return "//input[@id='email']";
}

export function getSavePostSpanExpression() {
    return "//span[contains(text(), 'שמור את הפוסט')]";
}

export function getPrivatePostsCollectionSpanExpression(postsCollection: string) {
    return `//span[contains(text(), '${postsCollection}')]`;
}

export function getEndOfSaveDivExpression() {
    return "//div[@aria-label='סיום']";
}

export function getMoreActionsButtonExpression(index: number) {
    return `${this.getFeedContainerPrefix(index)}//div[@aria-label='פעולות לפוסט זה']`;
}

export function getFeedContainerPrefix(index: number) {
    return `(//div[@role='feed'] | //div[@data-pagelet='ProfileTimeline'])//div[${index}]`;
}

export function getPostContentDivExpression(index: number) {
    return `${this.getFeedContainerPrefix(index)}//div[@data-ad-preview='message']`;
}

export function getFundedDisclaimerSpanExpression(index: number) {
    return `${this.getFeedContainerPrefix(index)}//span[contains(text(), 'ממומן')]`;
}

export function getOpenCommentsModalDivExpression(index: number) {
    return `${this.getFeedContainerPrefix(index)}//span[contains(text(), 'תגובות')]`;
}

export function getCloseCommentsModalDivExpression() {
    return "//div[@aria-label='סגירה']";
}

export function getCommentsDivsExpression() {
    return `//div[@role='dialog']//div//div//div//div//ul//div[@style='text-align: start;']`;
}

export function getPostCommentContainerExpression(index: number) {
    return `${this.getFeedContainerPrefix(index)}//div[contains(text(), 'כתיבת תגובה ציבורית...')]`;
}

export function getFriendImageExpression(){
    return `"//div[@data-pagelet='ProfileAppSection_0']//img";`
}
