"use strict";
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
const config_1 = require("./config");
const DownloadManager_1 = require("./download/DownloadManager");
const FileService_1 = require("./download/FileService");
const logger_1 = require("./logger");
const AuthClient_1 = require("./pixiv/AuthClient");
const PixivClient_1 = require("./pixiv/PixivClient");
const Scheduler_1 = require("./scheduler/Scheduler");
const Database_1 = require("./storage/Database");
const terminal_login_1 = require("./terminal-login");
const login_helper_1 = require("./utils/login-helper");
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
/**
 * Parse command line arguments
 */
function parseArgs(args) {
    const result = {
        options: {},
        positional: [],
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('-')) {
                result.options[key] = nextArg;
                i++;
            }
            else {
                result.options[key] = true;
            }
        }
        else if (arg.startsWith('-')) {
            const key = arg.slice(1);
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('-')) {
                result.options[key] = nextArg;
                i++;
            }
            else {
                result.options[key] = true;
            }
        }
        else if (!result.command) {
            result.command = arg;
        }
        else {
            result.positional.push(arg);
        }
    }
    return result;
}
/**
 * Output login result
 */
function outputLoginResult(loginInfo, json = false) {
    if (json) {
        console.log(JSON.stringify(loginInfo.response || loginInfo, null, 2));
    }
    else {
        console.log('[+]: Success!');
        console.log(`access_token: ${loginInfo.access_token}`);
        console.log(`refresh_token: ${loginInfo.refresh_token}`);
        console.log(`expires_in: ${loginInfo.expires_in}`);
        if (loginInfo.user) {
            console.log(`user: ${loginInfo.user.name} (${loginInfo.user.account})`);
        }
    }
}
/**
 * Show help message
 */
function showHelp() {
    console.log(`
Usage: pixivflow [command] [options]

Commands:
  login, l                    Login interactively (using Python gppt)
  login-interactive, li       Login interactively (explicit)
  login-headless, lh          Login in headless mode (requires -u and -p)
  refresh, r <token>          Refresh access token using refresh token
  download                    Run download job once
  random, rd                  Login (if needed) and download a random image
  scheduler                   Start scheduler (default if enabled in config)
  help, -h, --help            Show this help message

Options:
  -u, --username <id>         Pixiv ID (email, username, or account name)
  -p, --password <password>   Your Pixiv password
  -j, --json                  Output response as JSON
  --once                      Run download job once and exit
  --config <path>             Path to config file (default: config/standalone.config.json)

Examples:
  pixivflow login                    # Interactive login (prompts for username/password in terminal)
  pixivflow login -u user@example.com -p password  # Login with credentials (no browser window)
  pixivflow lh -u user@example.com -p password  # Headless login (no browser window)
  pixivflow refresh <refresh_token>  # Refresh token
  pixivflow download                 # Run download once
  pixivflow random                   # Login (if needed) and download a random image
  pixivflow scheduler                # Start scheduler

Note: Login requires Python 3.9+ and gppt package (pip install gppt or pip3 install gppt)
`);
}
/**
 * Prompt for password with hidden input
 * Uses raw mode to hide password characters
 */
function promptPassword(prompt) {
    return new Promise((resolve) => {
        process.stdout.write(prompt);
        let password = '';
        let wasRawMode = false;
        // Save current stdin settings
        if (process.stdin.isTTY) {
            wasRawMode = process.stdin.isRaw || false;
            process.stdin.setRawMode(true);
        }
        process.stdin.resume();
        // Don't set encoding in raw mode - handle buffers directly
        // When encoding is not set, stdin emits Buffer objects
        const onData = (data) => {
            // Convert buffer to string for processing
            const input = data.toString('utf8');
            // Process each character
            for (let i = 0; i < input.length; i++) {
                const char = input[i];
                const code = char.charCodeAt(0);
                // Enter key (13 = \r, 10 = \n)
                if (code === 13 || code === 10) {
                    process.stdin.removeListener('data', onData);
                    process.stdin.pause();
                    if (process.stdin.isTTY) {
                        process.stdin.setRawMode(wasRawMode);
                    }
                    process.stdout.write('\n');
                    resolve(password);
                    return;
                }
                // Backspace (127) or Delete (8)
                if (code === 127 || code === 8) {
                    if (password.length > 0) {
                        password = password.slice(0, -1);
                        process.stdout.write('\b \b'); // Move cursor back, overwrite with space, move back again
                    }
                    continue;
                }
                // Ctrl+C (3)
                if (code === 3) {
                    process.stdin.removeListener('data', onData);
                    process.stdin.pause();
                    if (process.stdin.isTTY) {
                        process.stdin.setRawMode(wasRawMode);
                    }
                    process.stdout.write('\n');
                    process.exit(130); // Exit with SIGINT code
                    return;
                }
                // Ctrl+D (4) - EOF
                if (code === 4) {
                    process.stdin.removeListener('data', onData);
                    process.stdin.pause();
                    if (process.stdin.isTTY) {
                        process.stdin.setRawMode(wasRawMode);
                    }
                    process.stdout.write('\n');
                    resolve(password);
                    return;
                }
                // Ignore other control characters (0-31 except those handled above)
                if (code < 32) {
                    continue;
                }
                // Add character to password (but don't display it)
                password += char;
                process.stdout.write('*'); // Show asterisk instead of actual character
            }
        };
        process.stdin.on('data', onData);
    });
}
/**
 * Prompt user for credentials in terminal
 */
async function promptForCredentials() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        console.log('[+]: ID can be email address, username, or account name.');
        rl.question('[?]: Pixiv ID: ', async (pixivId) => {
            rl.close();
            // Use secure password input
            const password = await promptPassword('[?]: Password: ');
            resolve({ username: pixivId.trim(), password: password.trim() });
        });
    });
}
/**
 * Handle login command
 */
async function handleLogin(args) {
    const json = !!(args.options.json || args.options.j);
    let username = (args.options.username || args.options.u);
    let password = (args.options.password || args.options.p);
    const configPath = args.options.config || undefined;
    try {
        // If username and password are not provided, prompt in terminal
        if (!username || !password) {
            console.log('[i]: Interactive login - please enter your credentials');
            const credentials = await promptForCredentials();
            username = credentials.username;
            password = credentials.password;
        }
        // Always use headless mode when credentials are provided (no browser window)
        const login = new terminal_login_1.TerminalLogin({
            headless: true,
            username,
            password,
        });
        const loginInfo = await login.login({
            headless: true,
            username,
            password,
        });
        // Try to update config file with refresh token
        const finalConfigPath = configPath ||
            process.env.PIXIV_DOWNLOADER_CONFIG ||
            path.resolve('config/standalone.config.json');
        try {
            await (0, login_helper_1.updateConfigWithToken)(finalConfigPath, loginInfo.refresh_token);
            if (!json) {
                console.log(`[+]: Config updated at ${finalConfigPath}`);
            }
        }
        catch (error) {
            // Config update failed, but login succeeded
            if (!json) {
                logger_1.logger.warn('Login successful but config update failed', { error });
            }
        }
        outputLoginResult(loginInfo, json);
    }
    catch (error) {
        console.error('[!]: Login failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
/**
 * Handle headless login command
 */
async function handleLoginHeadless(args) {
    const json = !!(args.options.json || args.options.j);
    const username = (args.options.username || args.options.u);
    const password = (args.options.password || args.options.p);
    const configPath = args.options.config || undefined;
    if (!username || !password) {
        console.error('[!]: Headless login requires username (-u) and password (-p)');
        console.error('Usage: pixivflow login-headless -u <username> -p <password>');
        process.exit(1);
    }
    try {
        const login = new terminal_login_1.TerminalLogin({
            headless: true,
            username,
            password,
        });
        const loginInfo = await login.login({
            headless: true,
            username,
            password,
        });
        // Try to update config file with refresh token
        const finalConfigPath = configPath ||
            process.env.PIXIV_DOWNLOADER_CONFIG ||
            path.resolve('config/standalone.config.json');
        try {
            await (0, login_helper_1.updateConfigWithToken)(finalConfigPath, loginInfo.refresh_token);
            if (!json) {
                console.log(`[+]: Config updated at ${finalConfigPath}`);
            }
        }
        catch (error) {
            // Config update failed, but login succeeded
            if (!json) {
                logger_1.logger.warn('Login successful but config update failed', { error });
            }
        }
        outputLoginResult(loginInfo, json);
    }
    catch (error) {
        console.error('[!]: Login failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
/**
 * Handle refresh command
 */
async function handleRefresh(args) {
    const json = !!(args.options.json || args.options.j);
    const refreshToken = args.positional[0] || args.options.token;
    if (!refreshToken) {
        console.error('[!]: Refresh token is required');
        console.error('Usage: pixivflow refresh <refresh_token>');
        process.exit(1);
    }
    try {
        const loginInfo = await terminal_login_1.TerminalLogin.refresh(refreshToken);
        outputLoginResult(loginInfo, json);
    }
    catch (error) {
        console.error('[!]: Token refresh failed:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
/**
 * Handle download command
 */
async function handleDownload() {
    try {
        const config = (0, config_1.loadConfig)();
        const database = new Database_1.Database(config.storage.databasePath);
        database.migrate();
        const auth = new AuthClient_1.PixivAuth(config.pixiv, config.network, database);
        const pixivClient = new PixivClient_1.PixivClient(auth, config);
        const fileService = new FileService_1.FileService(config.storage);
        const downloadManager = new DownloadManager_1.DownloadManager(config, pixivClient, database, fileService);
        await downloadManager.initialise();
        logger_1.logger.info('Running Pixiv download job');
        await downloadManager.runAllTargets();
        logger_1.logger.info('Pixiv download job finished');
        database.close();
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Fatal error while running download', {
            error: error instanceof Error ? error.stack ?? error.message : String(error),
        });
        process.exit(1);
    }
}
// 热门标签列表，用于随机选择
const POPULAR_TAGS = [
    '風景', 'イラスト', 'オリジナル', '女の子', '男の子',
    '猫', '犬', '空', '海', '桜', '花', '星空', '夕日',
    'illustration', 'art', 'anime', 'manga', 'cute',
    'beautiful', 'nature', 'sky', 'sunset', 'flower'
];
/**
 * Handle random download command
 * This will ensure user is logged in, then download a random image
 */
async function handleRandomDownload(args) {
    try {
        const configPath = args.options.config || undefined;
        const username = (args.options.username || args.options.u);
        const password = (args.options.password || args.options.p);
        const headless = !!(args.options.headless || args.options.h);
        // Ensure valid token exists (login if needed)
        logger_1.logger.info('Checking authentication status...');
        await (0, login_helper_1.ensureValidToken)({
            configPath,
            headless,
            username,
            password,
            autoLogin: true,
        });
        // Load config after ensuring token
        const config = (0, config_1.loadConfig)(configPath);
        // Randomly select a tag
        const randomTag = POPULAR_TAGS[Math.floor(Math.random() * POPULAR_TAGS.length)];
        logger_1.logger.info(`Randomly selected tag: ${randomTag}`);
        // Create temporary config to download only 1 image
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
        logger_1.logger.info('Starting random download...');
        await downloadManager.runAllTargets();
        logger_1.logger.info('Random download completed!');
        database.close();
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Fatal error during random download', {
            error: error instanceof Error ? error.stack ?? error.message : String(error),
        });
        process.exit(1);
    }
}
/**
 * Handle scheduler command
 */
async function handleScheduler() {
    try {
        const config = (0, config_1.loadConfig)();
        const database = new Database_1.Database(config.storage.databasePath);
        database.migrate();
        const auth = new AuthClient_1.PixivAuth(config.pixiv, config.network, database);
        const pixivClient = new PixivClient_1.PixivClient(auth, config);
        const fileService = new FileService_1.FileService(config.storage);
        const downloadManager = new DownloadManager_1.DownloadManager(config, pixivClient, database, fileService);
        await downloadManager.initialise();
        const runJob = async () => {
            logger_1.logger.info('Running Pixiv download job');
            await downloadManager.runAllTargets();
            logger_1.logger.info('Pixiv download job finished');
        };
        const scheduler = new Scheduler_1.Scheduler(config.scheduler);
        scheduler.start(runJob);
        const cleanup = () => {
            logger_1.logger.info('Shutting down PixivFlow');
            scheduler.stop();
            database.close();
            process.exit(0);
        };
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
    }
    catch (error) {
        logger_1.logger.error('Fatal error while starting PixivFlow', {
            error: error instanceof Error ? error.stack ?? error.message : String(error),
        });
        process.exit(1);
    }
}
/**
 * Main bootstrap function
 */
async function bootstrap() {
    const args = parseArgs(process.argv.slice(2));
    const command = args.command;
    // Handle help
    if (!command ||
        command === 'help' ||
        command === '-h' ||
        command === '--help' ||
        args.options.help ||
        args.options.h) {
        showHelp();
        return;
    }
    // Handle login commands
    if (command === 'login' || command === 'l' || command === 'login-interactive' || command === 'li') {
        await handleLogin(args);
        return;
    }
    if (command === 'login-headless' || command === 'lh') {
        await handleLoginHeadless(args);
        return;
    }
    if (command === 'refresh' || command === 'r') {
        await handleRefresh(args);
        return;
    }
    // Handle download command
    if (command === 'download') {
        await handleDownload();
        return;
    }
    // Handle random download command
    if (command === 'random' || command === 'rd') {
        await handleRandomDownload(args);
        return;
    }
    // Handle scheduler command
    if (command === 'scheduler') {
        await handleScheduler();
        return;
    }
    // Default behavior: run downloader (backward compatibility)
    try {
        const configPath = args.options.config || undefined;
        const config = (0, config_1.loadConfig)(configPath);
        const database = new Database_1.Database(config.storage.databasePath);
        database.migrate();
        const auth = new AuthClient_1.PixivAuth(config.pixiv, config.network, database);
        const pixivClient = new PixivClient_1.PixivClient(auth, config);
        const fileService = new FileService_1.FileService(config.storage);
        const downloadManager = new DownloadManager_1.DownloadManager(config, pixivClient, database, fileService);
        await downloadManager.initialise();
        const runJob = async () => {
            logger_1.logger.info('Running Pixiv download job');
            await downloadManager.runAllTargets();
            logger_1.logger.info('Pixiv download job finished');
        };
        const runOnce = !!(args.options.once || process.argv.includes('--once'));
        if (runOnce || !config.scheduler.enabled) {
            if (!config.scheduler.enabled && !runOnce) {
                logger_1.logger.info('Scheduler disabled, running once and exiting');
            }
            await runJob();
            database.close();
            process.exit(0);
        }
        const scheduler = new Scheduler_1.Scheduler(config.scheduler);
        scheduler.start(runJob);
        const cleanup = () => {
            logger_1.logger.info('Shutting down PixivFlow');
            scheduler.stop();
            database.close();
            process.exit(0);
        };
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
    }
    catch (error) {
        logger_1.logger.error('Fatal error while starting PixivFlow', {
            error: error instanceof Error ? error.stack ?? error.message : String(error),
        });
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map