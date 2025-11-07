"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const DownloadManager_1 = require("./download/DownloadManager");
const FileService_1 = require("./download/FileService");
const logger_1 = require("./logger");
const AuthClient_1 = require("./pixiv/AuthClient");
const PixivClient_1 = require("./pixiv/PixivClient");
const Database_1 = require("./storage/Database");
// 热门标签列表，用于随机选择
const POPULAR_TAGS = [
    '風景', 'イラスト', 'オリジナル', '女の子', '男の子',
    '猫', '犬', '空', '海', '桜', '花', '星空', '夕日',
    'illustration', 'art', 'anime', 'manga', 'cute',
    'beautiful', 'nature', 'sky', 'sunset', 'flower'
];
async function randomDownload() {
    try {
        const config = (0, config_1.loadConfig)();
        // 随机选择一个标签
        const randomTag = POPULAR_TAGS[Math.floor(Math.random() * POPULAR_TAGS.length)];
        logger_1.logger.info(`随机选择标签: ${randomTag}`);
        // 创建临时配置，只下载1张图
        const tempConfig = {
            ...config,
            targets: [
                {
                    type: 'illustration',
                    tag: randomTag,
                    limit: 1,
                    searchTarget: 'partial_match_for_tags',
                },
            ],
        };
        const database = new Database_1.Database(config.storage.databasePath);
        database.migrate();
        const auth = new AuthClient_1.PixivAuth(config.pixiv, config.network, database);
        const pixivClient = new PixivClient_1.PixivClient(auth, config);
        const fileService = new FileService_1.FileService(config.storage);
        const downloadManager = new DownloadManager_1.DownloadManager(tempConfig, pixivClient, database, fileService);
        await downloadManager.initialise();
        logger_1.logger.info('开始随机下载...');
        await downloadManager.runAllTargets();
        logger_1.logger.info('随机下载完成！');
        database.close();
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('随机下载失败', {
            error: error instanceof Error ? error.stack ?? error.message : String(error),
        });
        process.exit(1);
    }
}
randomDownload();
//# sourceMappingURL=random-download.js.map