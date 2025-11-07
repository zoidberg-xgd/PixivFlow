"use strict";
/**
 * 测试脚本：登录并下载一张图片
 * 使用方法：npm run test:download
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
async function testDownload() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║        PixivFlow - 测试脚本                       ║');
    console.log('║        Test Script: Login & Download                           ║');
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
    const configContent = fs.readFileSync(defaultConfigPath, 'utf-8');
    const config = JSON.parse(configContent);
    console.log(`✓ 下载目录: ${config.storage.illustrationDirectory}`);
    console.log(`✓ 数据库路径: ${config.storage.databasePath}`);
    console.log(`✓ 下载目标: ${config.targets.length} 个`);
    if (config.targets.length > 0) {
        const target = config.targets[0];
        console.log(`  - 类型: ${target.type}`);
        console.log(`  - 标签: ${target.tag}`);
        console.log(`  - 数量限制: ${target.limit}`);
    }
    // 运行下载
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('🚀 开始下载');
    console.log('════════════════════════════════════════════════════════════════\n');
    console.log('正在启动下载器...\n');
    // 动态导入并运行主程序
    const { loadConfig, getConfigPath } = await Promise.resolve().then(() => __importStar(require('./config')));
    const { DownloadManager } = await Promise.resolve().then(() => __importStar(require('./download/DownloadManager')));
    const { FileService } = await Promise.resolve().then(() => __importStar(require('./download/FileService')));
    const { logger } = await Promise.resolve().then(() => __importStar(require('./logger')));
    const { PixivAuth } = await Promise.resolve().then(() => __importStar(require('./pixiv/AuthClient')));
    const { PixivClient } = await Promise.resolve().then(() => __importStar(require('./pixiv/PixivClient')));
    const { Database } = await Promise.resolve().then(() => __importStar(require('./storage/Database')));
    const resolvedConfigPath = getConfigPath();
    const loadedConfig = loadConfig(resolvedConfigPath);
    const database = new Database(loadedConfig.storage.databasePath);
    database.migrate();
    const auth = new PixivAuth(loadedConfig.pixiv, loadedConfig.network, database, resolvedConfigPath);
    const pixivClient = new PixivClient(auth, loadedConfig);
    const fileService = new FileService(loadedConfig.storage);
    const downloadManager = new DownloadManager(loadedConfig, pixivClient, database, fileService);
    await downloadManager.initialise();
    logger.info('开始下载任务');
    await downloadManager.runAllTargets();
    logger.info('下载任务完成');
    database.close();
    // 检查下载结果
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('✅ 验证下载结果');
    console.log('════════════════════════════════════════════════════════════════\n');
    const downloadDir = loadedConfig.storage.illustrationDirectory || './downloads/illustrations';
    if (fs.existsSync(downloadDir)) {
        const files = fs.readdirSync(downloadDir);
        const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.gif'));
        if (imageFiles.length > 0) {
            console.log(`✓ 成功下载 ${imageFiles.length} 个文件：\n`);
            imageFiles.slice(0, 5).forEach(file => {
                const filePath = path.join(downloadDir, file);
                const stats = fs.statSync(filePath);
                const sizeKB = (stats.size / 1024).toFixed(2);
                console.log(`  - ${file} (${sizeKB} KB)`);
            });
            if (imageFiles.length > 5) {
                console.log(`  ... 以及其他 ${imageFiles.length - 5} 个文件`);
            }
        }
        else {
            console.log('⚠️  未找到下载的图片文件');
            console.log('   这可能是因为：');
            console.log('   1. 配置的标签没有找到匹配的作品');
            console.log('   2. 网络连接问题');
            console.log('   3. 认证信息无效或过期');
        }
    }
    else {
        console.log('⚠️  下载目录不存在');
    }
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('🎉 测试完成！');
    console.log('════════════════════════════════════════════════════════════════\n');
    process.exit(0);
}
// 运行测试
testDownload().catch((error) => {
    console.error('\n❌ 测试失败:', error);
    console.error('\n错误详情:');
    if (error instanceof Error) {
        console.error(error.stack);
    }
    process.exit(1);
});
//# sourceMappingURL=test-download.js.map