import { remote, RemoteOptions } from 'webdriverio';

const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'EAZPWG85QKLVFU4D',
    'appium:appPackage': 'com.android.settings',
    'appium:appActivity': '.Settings',
};

const wdOpts: RemoteOptions = {
    hostname: process.env.APPIUM_HOST || 'localhost',
    port: parseInt(process.env.APPIUM_PORT, 10) || 4723,
    logLevel: 'info',
    capabilities,
};

export async function runAutomation() {
    const driver = await remote(wdOpts);
    try {
        const batteryItem = await driver.$('//*[@text="Battery"]');
        await batteryItem.click();
    } finally {
        await driver.pause(1000);
        await driver.deleteSession();
    }
}

runAutomation().catch(console.error);
