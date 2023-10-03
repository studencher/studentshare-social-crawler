// import faceBookCrawler from "./models/FaceBookCrawler/FaceBookCrawler";
// import tikTokCrawler from "./models/ToTokCrawler/TikTokCrawler";
import instagramCrawler from "./models/InstagramCrawler/InstagramCrawler";
import {runAutomation} from "./models/MobileSimulator";

const main = async () => {
    // await faceBookCrawler.run();
    // await tikTokCrawler.run();
    // await instagramCrawler.run();
    await runAutomation();
}

main();
