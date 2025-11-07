"use strict";
/**
 * 特定下载脚本：下载一张随机的原神图片和一张昨天排名最高的明日方舟小说
 * 使用方法：npm run download:specific
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
const DownloadManager_1 = require("./download/DownloadManager");
const FileService_1 = require("./download/FileService");
const logger_1 = require("./logger");
const AuthClient_1 = require("./pixiv/AuthClient");
const PixivClient_1 = require("./pixiv/PixivClient");
const Database_1 = require("./storage/Database");
async function downloadSpecific() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║        特定下载任务：原神图片 + 明日方舟小说                    ║');
    console.log('║        Specific Download: Genshin + Arknights                  ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    const defaultConfigPath = path.join(process.cwd(), 'config', 'standalone.config.json');
    // 检查是否已有配置文件
    if (!fs.existsSync(defaultConfigPath)) {
        console.log('❌ 未找到配置文件！');
        console.log('\n请先运行配置向导创建配置：');
        console.log('  npm run standalone:setup\n');
        console.log('或者参考示例配置创建：');
        console.log('  cp config/standalone.config.example.json config/standalone.config.json\n');
        process.exit(1);
    }
    // 读取配置
    console.log('════════════════════════════════════════════════════════════════');
    console.log('📋 加载配置');
    console.log('════════════════════════════════════════════════════════════════\n');
    const resolvedConfigPath = (0, config_1.getConfigPath)();
    const baseConfig = (0, config_1.loadConfig)(resolvedConfigPath);
    console.log(`✓ 下载目录: ${baseConfig.storage.illustrationDirectory}`);
    console.log(`✓ 数据库路径: ${baseConfig.storage.databasePath}`);
    // 创建临时配置，包含两个下载目标
    const tempConfig = {
        ...baseConfig,
        targets: [
            {
                type: 'illustration',
                tag: '原神',
                limit: 1,
                searchTarget: 'partial_match_for_tags',
                restrict: 'public',
                mode: 'search',
                random: true, // 随机选择一张
            },
            {
                type: 'novel',
                tag: 'アークナイツ',
                limit: 1,
                mode: 'ranking',
                rankingMode: 'day',
                rankingDate: 'YESTERDAY', // 昨天的排名
                filterTag: 'アークナイツ', // 筛选明日方舟标签
            },
        ],
    };
    console.log('\n📥 下载目标：');
    console.log('  1. 原神 - 随机图片 1 张');
    console.log('  2. 明日方舟 - 昨天排名最高的小说 1 本');
    // 运行下载
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('🚀 开始下载');
    console.log('════════════════════════════════════════════════════════════════\n');
    const database = new Database_1.Database(baseConfig.storage.databasePath);
    database.migrate();
    const auth = new AuthClient_1.PixivAuth(baseConfig.pixiv, baseConfig.network, database, resolvedConfigPath);
    const pixivClient = new PixivClient_1.PixivClient(auth, baseConfig);
    const fileService = new FileService_1.FileService(baseConfig.storage);
    const downloadManager = new DownloadManager_1.DownloadManager(tempConfig, pixivClient, database, fileService);
    await downloadManager.initialise();
    logger_1.logger.info('开始特定下载任务');
    await downloadManager.runAllTargets();
    logger_1.logger.info('特定下载任务完成');
    database.close();
    // 检查下载结果
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('✅ 验证下载结果');
    console.log('════════════════════════════════════════════════════════════════\n');
    // 检查图片
    const illustDir = baseConfig.storage.illustrationDirectory || './downloads/illustrations';
    if (fs.existsSync(illustDir)) {
        const files = fs.readdirSync(illustDir);
        const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.gif') || f.endsWith('.webp'));
        if (imageFiles.length > 0) {
            console.log(`✓ 图片文件 (${imageFiles.length} 个)：`);
            // 显示最近下载的文件（可能是原神图片）
            const recentFiles = imageFiles
                .map(f => ({
                name: f,
                path: path.join(illustDir, f),
                time: fs.statSync(path.join(illustDir, f)).mtime.getTime()
            }))
                .sort((a, b) => b.time - a.time)
                .slice(0, 3);
            recentFiles.forEach(file => {
                const stats = fs.statSync(file.path);
                const sizeKB = (stats.size / 1024).toFixed(2);
                const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                const size = parseFloat(sizeMB) >= 1 ? `${sizeMB} MB` : `${sizeKB} KB`;
                console.log(`  - ${file.name} (${size})`);
            });
        }
    }
    // 检查小说
    const novelDir = baseConfig.storage.novelDirectory || './downloads/novels';
    if (fs.existsSync(novelDir)) {
        const files = fs.readdirSync(novelDir);
        const novelFiles = files.filter(f => f.endsWith('.txt'));
        if (novelFiles.length > 0) {
            console.log(`\n✓ 小说文件 (${novelFiles.length} 个)：`);
            // 显示最近下载的文件（可能是明日方舟小说）
            const recentFiles = novelFiles
                .map(f => ({
                name: f,
                path: path.join(novelDir, f),
                time: fs.statSync(path.join(novelDir, f)).mtime.getTime()
            }))
                .sort((a, b) => b.time - a.time)
                .slice(0, 3);
            recentFiles.forEach(file => {
                const stats = fs.statSync(file.path);
                const sizeKB = (stats.size / 1024).toFixed(2);
                console.log(`  - ${file.name} (${sizeKB} KB)`);
            });
        }
    }
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('🎉 下载完成！');
    console.log('════════════════════════════════════════════════════════════════\n');
    process.exit(0);
}
// 运行下载
downloadSpecific().catch((error) => {
    console.error('\n❌ 下载失败:', error);
    console.error('\n错误详情:');
    if (error instanceof Error) {
        console.error(error.stack);
    }
    process.exit(1);
});
//# sourceMappingURL=download-specific.js.map