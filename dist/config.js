"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidationError = void 0;
exports.getConfigPath = getConfigPath;
exports.loadConfig = loadConfig;
exports.generateDefaultConfig = generateDefaultConfig;
exports.validateConfigFile = validateConfigFile;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = require("./logger");
/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
    logLevel: 'info',
    network: {
        timeoutMs: 30000,
        retries: 3,
        retryDelay: 1000,
    },
    storage: {
        databasePath: './data/pixiv-downloader.db',
        downloadDirectory: './downloads',
    },
    scheduler: {
        enabled: false,
        cron: '0 3 * * *',
        timezone: 'Asia/Shanghai',
    },
    download: {
        concurrency: 3,
        maxRetries: 3,
        retryDelay: 2000,
        timeout: 60000,
    },
    initialDelay: 0,
};
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
 * Apply default values to configuration
 */
function applyDefaults(config) {
    const merged = {
        ...config,
        logLevel: config.logLevel ?? DEFAULT_CONFIG.logLevel,
        network: {
            ...DEFAULT_CONFIG.network,
            ...config.network,
            proxy: config.network?.proxy,
        },
        storage: {
            ...DEFAULT_CONFIG.storage,
            ...config.storage,
        },
        scheduler: {
            ...DEFAULT_CONFIG.scheduler,
            ...config.scheduler,
        },
        download: {
            ...DEFAULT_CONFIG.download,
            ...config.download,
        },
        initialDelay: config.initialDelay ?? DEFAULT_CONFIG.initialDelay,
        pixiv: config.pixiv,
        targets: config.targets,
    };
    // Resolve storage paths - storage is guaranteed to exist after merge
    const storage = merged.storage;
    const downloadDir = (0, node_path_1.resolve)(storage.downloadDirectory);
    if (!storage.illustrationDirectory) {
        storage.illustrationDirectory = (0, node_path_1.resolve)(downloadDir, 'illustrations');
    }
    else if (!(0, node_path_1.isAbsolute)(storage.illustrationDirectory)) {
        storage.illustrationDirectory = (0, node_path_1.resolve)(downloadDir, storage.illustrationDirectory);
    }
    else {
        storage.illustrationDirectory = (0, node_path_1.resolve)(storage.illustrationDirectory);
    }
    if (!storage.novelDirectory) {
        storage.novelDirectory = (0, node_path_1.resolve)(downloadDir, 'novels');
    }
    else if (!(0, node_path_1.isAbsolute)(storage.novelDirectory)) {
        storage.novelDirectory = (0, node_path_1.resolve)(downloadDir, storage.novelDirectory);
    }
    else {
        storage.novelDirectory = (0, node_path_1.resolve)(storage.novelDirectory);
    }
    // Resolve database path
    storage.databasePath = (0, node_path_1.resolve)(storage.databasePath);
    return merged;
}
/**
 * Process placeholders in config (e.g., "YESTERDAY" -> actual yesterday date)
 */
function processConfigPlaceholders(config) {
    const processed = JSON.parse(JSON.stringify(config));
    // Replace "YESTERDAY" placeholder in rankingDate
    for (const target of processed.targets) {
        if (target.rankingDate === 'YESTERDAY') {
            const yesterday = getYesterdayDate();
            target.rankingDate = yesterday;
            logger_1.logger.debug(`Replaced rankingDate placeholder with: ${yesterday}`);
        }
    }
    return processed;
}
/**
 * Get the resolved configuration file path
 */
function getConfigPath(configPath) {
    return (0, node_path_1.resolve)(configPath ?? process.env.PIXIV_DOWNLOADER_CONFIG ?? 'config/standalone.config.json');
}
/**
 * Load configuration from file with environment variable support
 */
function loadConfig(configPath) {
    const resolvedPath = getConfigPath(configPath);
    if (!(0, node_fs_1.existsSync)(resolvedPath)) {
        throw new Error(`Configuration file not found at ${resolvedPath}\n` +
            `Please create a configuration file or set PIXIV_DOWNLOADER_CONFIG environment variable.\n` +
            `You can use the setup wizard: npm run setup`);
    }
    let raw;
    try {
        raw = (0, node_fs_1.readFileSync)(resolvedPath, 'utf-8');
    }
    catch (error) {
        throw new Error(`Failed to read configuration file: ${error instanceof Error ? error.message : String(error)}`);
    }
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (error) {
        throw new Error(`Invalid JSON in configuration file: ${error instanceof Error ? error.message : String(error)}\n` +
            `Please check the JSON syntax in ${resolvedPath}`);
    }
    // Apply environment variable overrides
    parsed = applyEnvironmentOverrides(parsed);
    // Validate configuration
    validateConfig(parsed, resolvedPath);
    // Apply defaults
    const config = applyDefaults(parsed);
    // Set log level
    if (config.logLevel) {
        logger_1.logger.setLevel(config.logLevel);
    }
    // Process placeholders (e.g., YESTERDAY)
    return processConfigPlaceholders(config);
}
/**
 * Apply environment variable overrides to configuration
 */
function applyEnvironmentOverrides(config) {
    const overridden = { ...config };
    // Override Pixiv credentials from environment
    if (process.env.PIXIV_REFRESH_TOKEN) {
        if (!overridden.pixiv) {
            overridden.pixiv = {
                clientId: '',
                clientSecret: '',
                deviceToken: '',
                refreshToken: process.env.PIXIV_REFRESH_TOKEN,
                userAgent: 'PixivAndroidApp/5.0.234 (Android 11; Pixel 6)',
            };
        }
        else {
            overridden.pixiv.refreshToken = process.env.PIXIV_REFRESH_TOKEN;
        }
    }
    if (process.env.PIXIV_CLIENT_ID) {
        if (!overridden.pixiv) {
            overridden.pixiv = {
                clientId: process.env.PIXIV_CLIENT_ID,
                clientSecret: '',
                deviceToken: '',
                refreshToken: '',
                userAgent: 'PixivAndroidApp/5.0.234 (Android 11; Pixel 6)',
            };
        }
        else {
            overridden.pixiv.clientId = process.env.PIXIV_CLIENT_ID;
        }
    }
    if (process.env.PIXIV_CLIENT_SECRET) {
        if (!overridden.pixiv) {
            overridden.pixiv = {
                clientId: '',
                clientSecret: process.env.PIXIV_CLIENT_SECRET,
                deviceToken: '',
                refreshToken: '',
                userAgent: 'PixivAndroidApp/5.0.234 (Android 11; Pixel 6)',
            };
        }
        else {
            overridden.pixiv.clientSecret = process.env.PIXIV_CLIENT_SECRET;
        }
    }
    // Override storage paths
    if (process.env.PIXIV_DOWNLOAD_DIR) {
        if (!overridden.storage) {
            overridden.storage = {};
        }
        overridden.storage.downloadDirectory = process.env.PIXIV_DOWNLOAD_DIR;
    }
    if (process.env.PIXIV_DATABASE_PATH) {
        if (!overridden.storage) {
            overridden.storage = {};
        }
        overridden.storage.databasePath = process.env.PIXIV_DATABASE_PATH;
    }
    // Override log level
    if (process.env.PIXIV_LOG_LEVEL) {
        const logLevel = process.env.PIXIV_LOG_LEVEL.toLowerCase();
        if (['debug', 'info', 'warn', 'error'].includes(logLevel)) {
            overridden.logLevel = logLevel;
        }
    }
    // Override scheduler enabled
    if (process.env.PIXIV_SCHEDULER_ENABLED !== undefined) {
        if (!overridden.scheduler) {
            overridden.scheduler = {
                enabled: process.env.PIXIV_SCHEDULER_ENABLED.toLowerCase() === 'true',
                cron: DEFAULT_CONFIG.scheduler.cron,
            };
        }
        else {
            overridden.scheduler.enabled = process.env.PIXIV_SCHEDULER_ENABLED.toLowerCase() === 'true';
        }
    }
    return overridden;
}
/**
 * Generate a default configuration template
 */
function generateDefaultConfig() {
    return {
        logLevel: DEFAULT_CONFIG.logLevel,
        pixiv: {
            clientId: 'MOBrBDS8blbauoSck0ZfDbtuzpyT',
            clientSecret: 'lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj',
            deviceToken: 'pixiv',
            refreshToken: 'YOUR_REFRESH_TOKEN',
            userAgent: 'PixivAndroidApp/5.0.234 (Android 11; Pixel 6)',
        },
        network: DEFAULT_CONFIG.network,
        storage: DEFAULT_CONFIG.storage,
        scheduler: DEFAULT_CONFIG.scheduler,
        download: DEFAULT_CONFIG.download,
        targets: [
            {
                type: 'illustration',
                tag: 'イラスト',
                limit: 10,
                searchTarget: 'partial_match_for_tags',
            },
        ],
        initialDelay: DEFAULT_CONFIG.initialDelay,
    };
}
/**
 * Validate and format configuration file
 */
function validateConfigFile(configPath) {
    try {
        const config = loadConfig(configPath);
        return { valid: true, errors: [], warnings: [] };
    }
    catch (error) {
        if (error instanceof ConfigValidationError) {
            return {
                valid: false,
                errors: error.errors,
                warnings: error.warnings,
            };
        }
        return {
            valid: false,
            errors: [error instanceof Error ? error.message : String(error)],
            warnings: [],
        };
    }
}
/**
 * Validation error with detailed information
 */
class ConfigValidationError extends Error {
    errors;
    warnings;
    constructor(message, errors, warnings = []) {
        super(message);
        this.errors = errors;
        this.warnings = warnings;
        this.name = 'ConfigValidationError';
    }
}
exports.ConfigValidationError = ConfigValidationError;
/**
 * Validate configuration with detailed error messages
 */
function validateConfig(config, location) {
    const errors = [];
    const warnings = [];
    // Validate Pixiv credentials
    if (!config.pixiv) {
        errors.push('pixiv: Required section is missing');
    }
    else {
        if (!config.pixiv.clientId || config.pixiv.clientId.trim() === '') {
            errors.push('pixiv.clientId: Required field is missing or empty');
        }
        if (!config.pixiv.clientSecret || config.pixiv.clientSecret.trim() === '') {
            errors.push('pixiv.clientSecret: Required field is missing or empty');
        }
        if (!config.pixiv.deviceToken || config.pixiv.deviceToken.trim() === '') {
            errors.push('pixiv.deviceToken: Required field is missing or empty');
        }
        if (!config.pixiv.refreshToken || config.pixiv.refreshToken.trim() === '') {
            errors.push('pixiv.refreshToken: Required field is missing or empty');
        }
        else if (config.pixiv.refreshToken === 'YOUR_REFRESH_TOKEN') {
            errors.push('pixiv.refreshToken: Please replace "YOUR_REFRESH_TOKEN" with your actual refresh token');
        }
        if (!config.pixiv.userAgent || config.pixiv.userAgent.trim() === '') {
            errors.push('pixiv.userAgent: Required field is missing or empty');
        }
    }
    // Validate targets
    if (!Array.isArray(config.targets)) {
        errors.push('targets: Must be an array');
    }
    else if (config.targets.length === 0) {
        errors.push('targets: At least one target must be configured');
    }
    else {
        config.targets.forEach((target, index) => {
            if (!target.tag || target.tag.trim() === '') {
                errors.push(`targets[${index}].tag: Required field is missing or empty`);
            }
            if (target.type && !['illustration', 'novel'].includes(target.type)) {
                errors.push(`targets[${index}].type: Must be "illustration" or "novel"`);
            }
            if (target.limit !== undefined && (target.limit < 1 || target.limit > 1000)) {
                warnings.push(`targets[${index}].limit: Should be between 1 and 1000 (got ${target.limit})`);
            }
            if (target.searchTarget && !['partial_match_for_tags', 'exact_match_for_tags', 'title_and_caption'].includes(target.searchTarget)) {
                errors.push(`targets[${index}].searchTarget: Invalid value, must be one of: partial_match_for_tags, exact_match_for_tags, title_and_caption`);
            }
            if (target.rankingDate && !/^\d{4}-\d{2}-\d{2}$/.test(target.rankingDate) && target.rankingDate !== 'YESTERDAY') {
                errors.push(`targets[${index}].rankingDate: Invalid format, must be YYYY-MM-DD or "YESTERDAY"`);
            }
        });
    }
    // Validate network config
    if (config.network) {
        if (config.network.timeoutMs !== undefined && (config.network.timeoutMs < 1000 || config.network.timeoutMs > 300000)) {
            warnings.push('network.timeoutMs: Should be between 1000 and 300000 ms (1 second to 5 minutes)');
        }
        if (config.network.retries !== undefined && (config.network.retries < 0 || config.network.retries > 10)) {
            warnings.push('network.retries: Should be between 0 and 10');
        }
        if (config.network.proxy?.enabled) {
            if (!config.network.proxy.host || config.network.proxy.host.trim() === '') {
                errors.push('network.proxy.host: Required when proxy is enabled');
            }
            if (!config.network.proxy.port || config.network.proxy.port < 1 || config.network.proxy.port > 65535) {
                errors.push('network.proxy.port: Must be a valid port number (1-65535)');
            }
            if (config.network.proxy.protocol && !['http', 'https', 'socks4', 'socks5'].includes(config.network.proxy.protocol)) {
                errors.push('network.proxy.protocol: Must be one of: http, https, socks4, socks5');
            }
        }
    }
    // Validate scheduler config
    if (config.scheduler) {
        if (config.scheduler.enabled && !config.scheduler.cron) {
            errors.push('scheduler.cron: Required when scheduler is enabled');
        }
        if (config.scheduler.cron && !node_cron_1.default.validate(config.scheduler.cron)) {
            errors.push(`scheduler.cron: Invalid cron expression: ${config.scheduler.cron}`);
        }
        if (config.scheduler.maxExecutions !== undefined && config.scheduler.maxExecutions < 1) {
            errors.push('scheduler.maxExecutions: Must be greater than 0');
        }
        if (config.scheduler.minInterval !== undefined && config.scheduler.minInterval < 0) {
            errors.push('scheduler.minInterval: Must be greater than or equal to 0');
        }
        if (config.scheduler.timeout !== undefined && config.scheduler.timeout < 1000) {
            warnings.push('scheduler.timeout: Should be at least 1000 ms (1 second)');
        }
        if (config.scheduler.maxConsecutiveFailures !== undefined && config.scheduler.maxConsecutiveFailures < 1) {
            errors.push('scheduler.maxConsecutiveFailures: Must be greater than 0');
        }
    }
    // Validate download config
    if (config.download) {
        if (config.download.concurrency !== undefined && (config.download.concurrency < 1 || config.download.concurrency > 10)) {
            warnings.push('download.concurrency: Should be between 1 and 10');
        }
        if (config.download.maxRetries !== undefined && (config.download.maxRetries < 0 || config.download.maxRetries > 10)) {
            warnings.push('download.maxRetries: Should be between 0 and 10');
        }
    }
    // Validate log level
    if (config.logLevel && !['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
        errors.push(`logLevel: Must be one of: debug, info, warn, error (got "${config.logLevel}")`);
    }
    // Report warnings
    if (warnings.length > 0) {
        logger_1.logger.warn('Configuration warnings:', { warnings, location });
    }
    // Throw error if there are critical issues
    if (errors.length > 0) {
        const errorMessage = `Configuration validation failed in ${location}:\n${errors.map(e => `  - ${e}`).join('\n')}`;
        throw new ConfigValidationError(errorMessage, errors, warnings);
    }
}
//# sourceMappingURL=config.js.map