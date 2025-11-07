"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const DownloadManager_1 = require("./download/DownloadManager");
const FileService_1 = require("./download/FileService");
const logger_1 = require("./logger");
const AuthClient_1 = require("./pixiv/AuthClient");
const PixivClient_1 = require("./pixiv/PixivClient");
const Database_1 = require("./storage/Database");
const login_helper_1 = require("./utils/login-helper");
/**
 * Get yesterday's date in YYYY-MM-DD format
 */
function getYesterdayDate() {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * Download yesterday's most popular Arknights novel after a delay
 */
async function downloadArknightsNovel(delaySeconds = 10) {
    try {
        logger_1.logger.info(`将在 ${delaySeconds} 秒后开始下载昨天最火的明日方舟小说...`);
        // Wait for the specified delay
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        logger_1.logger.info('开始执行下载任务...');
        // Ensure valid token exists (login if needed)
        logger_1.logger.info('检查认证状态...');
        await (0, login_helper_1.ensureValidToken)({
            configPath: undefined,
            headless: false,
            username: undefined,
            password: undefined,
            autoLogin: true,
        });
        // Load config
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        // Get yesterday's date
        const yesterdayDate = getYesterdayDate();
        logger_1.logger.info(`目标日期: ${yesterdayDate} (昨天)`);
        // Create temporary config to download yesterday's top Arknights novel
        const tempConfig = {
            ...config,
            targets: [
                {
                    type: 'novel',
                    tag: '明日方舟',
                    limit: 1, // Only download the top one
                    mode: 'ranking',
                    rankingMode: 'day',
                    rankingDate: yesterdayDate,
                    filterTag: '明日方舟', // Filter by Arknights tag
                },
            ],
        };
        const database = new Database_1.Database(config.storage.databasePath);
        database.migrate();
        const auth = new AuthClient_1.PixivAuth(config.pixiv, config.network, database, configPath);
        const pixivClient = new PixivClient_1.PixivClient(auth, config);
        const fileService = new FileService_1.FileService(config.storage);
        const downloadManager = new DownloadManager_1.DownloadManager(tempConfig, pixivClient, database, fileService);
        await downloadManager.initialise();
        logger_1.logger.info('开始下载昨天最火的明日方舟小说...');
        await downloadManager.runAllTargets();
        logger_1.logger.info('下载完成！');
        database.close();
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('下载失败', {
            error: error instanceof Error ? error.stack ?? error.message : String(error),
        });
        process.exit(1);
    }
}
// Run the script
const delaySeconds = 10;
downloadArknightsNovel(delaySeconds);
//# sourceMappingURL=download-arknights-novel.js.map