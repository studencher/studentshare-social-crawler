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

