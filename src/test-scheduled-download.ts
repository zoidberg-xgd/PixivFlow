import { loadConfig, getConfigPath } from './config';
import { DownloadManager } from './download/DownloadManager';
import { FileService } from './download/FileService';
import { logger } from './logger';
import { PixivAuth } from './pixiv/AuthClient';
import { PixivClient } from './pixiv/PixivClient';
import { Database } from './storage/Database';
import { isTokenValid } from './utils/login-helper';

/**
 * Execute scheduled download tasks
 * This is a generic executor that can be used by schedulers or run manually
 * 
 * @param configPath Optional path to config file (defaults to env var or standard path)
 * @param delayMs Optional delay before starting (overrides config.initialDelay if provided)
 */
async function executeScheduledDownload(configPath?: string, delayMs?: number): Promise<void> {
  try {
    const resolvedConfigPath = getConfigPath(configPath);
    const config = loadConfig(resolvedConfigPath);
    
    // Check refresh token validity before proceeding
    const refreshToken = config.pixiv.refreshToken;
    if (!refreshToken || refreshToken === 'YOUR_REFRESH_TOKEN_HERE') {
      logger.error('❌ Refresh token is missing or not configured!');
      console.error('\n═══════════════════════════════════════════════════════════');
      console.error('  Refresh Token 未配置或无效');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('\n请执行以下步骤：');
      console.error('  1. 运行登录命令获取有效的 refresh token:');
      console.error('     npm run login');
      console.error('     或');
      console.error('     ./scripts/pixiv.sh setup');
      console.error('\n  2. 登录成功后，refresh token 会自动更新到配置文件中');
      console.error('\n  3. 然后重新运行此脚本');
      console.error('\n═══════════════════════════════════════════════════════════\n');
      throw new Error('Refresh token not configured');
    }

    // Validate token before starting
    logger.info('Validating refresh token...');
    const tokenValid = await isTokenValid(refreshToken);
    if (!tokenValid) {
      logger.error('❌ Refresh token is invalid or expired!');
      console.error('\n═══════════════════════════════════════════════════════════');
      console.error('  Refresh Token 无效或已过期');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('\n请执行以下步骤：');
      console.error('  1. 运行登录命令重新获取有效的 refresh token:');
      console.error('     npm run login');
      console.error('     或');
      console.error('     ./scripts/pixiv.sh setup');
      console.error('\n  2. 登录成功后，refresh token 会自动更新到配置文件中');
      console.error('\n  3. 然后重新运行此脚本');
      console.error('\n═══════════════════════════════════════════════════════════\n');
      throw new Error('Refresh token is invalid or expired');
    }
    logger.info('✓ Refresh token is valid');
    
    // Use command line delay if provided, otherwise use config delay, default to 0
    const finalDelay = delayMs !== undefined ? delayMs : (config.initialDelay ?? 0);
    
    if (finalDelay > 0) {
      logger.info(`Waiting ${finalDelay}ms before starting download...`);
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
    
    logger.info('Loaded configuration with the following targets:');
    config.targets.forEach((target, index) => {
      const typeLabel = target.type === 'illustration' ? 'illustration' : 'novel';
      const randomLabel = target.random ? ' (random selection)' : '';
      const dateLabel = target.rankingDate ? ` (date: ${target.rankingDate})` : '';
      logger.info(`  Target ${index + 1}: ${typeLabel} - ${target.tag}${randomLabel}${dateLabel}`);
    });
    
    const database = new Database(config.storage!.databasePath!);
    database.migrate();

    const auth = new PixivAuth(config.pixiv, config.network!, database, resolvedConfigPath);
    
    // Try to get access token early to catch any auth errors
    try {
      await auth.getAccessToken();
      logger.info('✓ Successfully authenticated with Pixiv');
    } catch (authError) {
      logger.error('❌ Authentication failed!');
      console.error('\n═══════════════════════════════════════════════════════════');
      console.error('  认证失败');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('\n可能的原因：');
      console.error('  • Refresh token 已过期或无效');
      console.error('  • 网络连接问题');
      console.error('  • Pixiv API 服务异常');
      console.error('\n请尝试：');
      console.error('  1. 重新登录获取新的 refresh token:');
      console.error('     npm run login');
      console.error('  2. 检查网络连接和代理设置');
      console.error('  3. 稍后重试');
      console.error('\n═══════════════════════════════════════════════════════════\n');
      throw authError;
    }
    
    const pixivClient = new PixivClient(auth, config);
    const fileService = new FileService(config.storage!);
    const downloadManager = new DownloadManager(config, pixivClient, database, fileService);

    await downloadManager.initialise();
    logger.info('Starting download execution...');
    
    await downloadManager.runAllTargets();
    
    logger.info('All download tasks completed');

    database.close();
  } catch (error) {
    // If it's already a formatted error, just rethrow
    if (error instanceof Error && (
      error.message.includes('Refresh token') || 
      error.message.includes('Authentication failed')
    )) {
      throw error;
    }
    
    logger.error('Fatal error during scheduled download execution', {
      error: error instanceof Error ? error.stack ?? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Usage: npm run test:scheduled [options]

Execute scheduled download tasks. This is a generic executor that can be used
by schedulers or run manually.

Options:
  -c, --config <path>    Path to config file (default: from env or standard path)
  -d, --delay <ms>       Delay before starting in milliseconds (overrides config.initialDelay)
  -h, --help             Show this help message

Examples:
  # Use default configuration
  npm run test:scheduled

  # Use test configuration file (原神随机图片 + 明日方舟昨日排名小说)
  npm run test:scheduled -- --config config/standalone.config.test.json

  # Add delay before starting (overrides config.initialDelay)
  npm run test:scheduled -- --delay 60000
  
  # Or set initialDelay in config file (no need for --delay parameter)

  # Combine options
  npm run test:scheduled -- --config config/standalone.config.test.json --delay 5000

Environment Variables:
  PIXIV_DOWNLOADER_CONFIG    Path to configuration file (overrides default)

Note:
  - Placeholders like "YESTERDAY" in rankingDate will be automatically replaced
  - The script will use the standard config path if no config is specified
  - This script can be imported and used by other modules (e.g., schedulers)
  - Before running, make sure you have a valid refresh token in the config file
  - If token is invalid, the script will show clear error messages with instructions
`);
}

/**
 * Main entry point for scheduled download script
 * Can be called directly or used by schedulers
 */
async function main() {
  try {
    // Support command line arguments for config path and delay
    const args = process.argv.slice(2);
    let configPath: string | undefined;
    let delayMs: number | undefined;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--help' || arg === '-h') {
        printUsage();
        process.exit(0);
      } else if (arg === '--config' || arg === '-c') {
        configPath = args[++i];
        if (!configPath) {
          console.error('Error: --config requires a path argument');
          printUsage();
          process.exit(1);
        }
      } else if (arg === '--delay' || arg === '-d') {
        const delayArg = args[++i];
        if (!delayArg) {
          console.error('Error: --delay requires a number argument');
          printUsage();
          process.exit(1);
        }
        delayMs = parseInt(delayArg, 10);
        if (isNaN(delayMs) || delayMs < 0) {
          console.error('Error: --delay must be a non-negative number');
          printUsage();
          process.exit(1);
        }
      } else {
        console.error(`Error: Unknown option: ${arg}`);
        printUsage();
        process.exit(1);
      }
    }
    
    await executeScheduledDownload(configPath, delayMs);
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (require.main === module) {
  main();
}

// Export for use by other modules (e.g., scheduler)
export { executeScheduledDownload };

