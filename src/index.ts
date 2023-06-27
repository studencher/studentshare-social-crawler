// import faceBookCrawler from "./models/FaceBookCrawler/FaceBookCrawler";
// import tikTokCrawler from "./models/ToTokCrawler/TikTokCrawler";
import instagramCrawler from "./models/InstagramCrawler/InstagramCrawler";

const main = async () => {
    // await faceBookCrawler.run();
    // await tikTokCrawler.run();
    await instagramCrawler.run();
}

main();
