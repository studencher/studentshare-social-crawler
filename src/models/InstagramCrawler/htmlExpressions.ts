export function getInstagramUrl() {
    return "https://www.instagram.com";
}

export function getPasswordInputExpression() {
    return "//input[@aria-label='Password']";
}

export function getUserNameInputExpression() {
    return "//input[@aria-label='Phone number, username or email address']";
}

export function getLoginButtonExpression() {
    return "//button[@type='submit']";
}

export function getNotNowButtonExpression() {
    return "//button[contains(text(), 'Not Now')]";
}


export function getProfileNavSpanExpression() {
    return "//a[@role='link']//span[contains(text(), 'Profile')]/../../../../..//img";
}

export function getSearchLinkExpression() {
    return "//a[@role='link']//span[contains(text(), 'Search')]/../../../../../../..//a";
}

export function getSearchInputExpression() {
    return "//input[@aria-label='Search input']";
}

export function getFirstLinkFoundedExpression() {
    return "(//input[@aria-label='Search input']/../../..//a[@role='link' and @tabindex='0'])[position() = 1]";
}

export function getProfileFollowersLinkExpression() {
    return "//a[contains(text(), 'followers')]";
}

export function getFollowersLinksExpression() {
    return "//div[@role='dialog']//a[not(descendant::img)]";
}

export function getFollowersLinksContainerExpression() {
    return `(${getFollowersLinksExpression()})[position() = 1]/../../../../../../../../../../../../../..`;
}
