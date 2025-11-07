"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const node_fs_1 = require("node:fs");
const node_fs_2 = require("node:fs");
const node_path_1 = require("node:path");
const logger_1 = require("./logger");
function loadConfig(configPath) {
    const resolvedPath = (0, node_path_1.resolve)(configPath ?? process.env.PIXIV_DOWNLOADER_CONFIG ?? 'config/standalone.config.json');
    if (!(0, node_fs_2.existsSync)(resolvedPath)) {
        throw new Error(`Configuration file not found at ${resolvedPath}`);
    }
    const raw = (0, node_fs_1.readFileSync)(resolvedPath, 'utf-8');
    const parsed = JSON.parse(raw);
    validateConfig(parsed, resolvedPath);
    if (parsed.logLevel) {
        logger_1.logger.setLevel(parsed.logLevel);
    }
    // Fill directories with defaults if needed
    if (!parsed.storage.illustrationDirectory) {
        parsed.storage.illustrationDirectory = (0, node_path_1.resolve)(parsed.storage.downloadDirectory, 'illustrations');
    }
    if (!parsed.storage.novelDirectory) {
        parsed.storage.novelDirectory = (0, node_path_1.resolve)(parsed.storage.downloadDirectory, 'novels');
    }
    return parsed;
}
function validateConfig(config, location) {
    const missing = [];
    if (!config.pixiv?.clientId)
        missing.push('pixiv.clientId');
    if (!config.pixiv?.clientSecret)
        missing.push('pixiv.clientSecret');
    if (!config.pixiv?.deviceToken)
        missing.push('pixiv.deviceToken');
    if (!config.pixiv?.refreshToken)
        missing.push('pixiv.refreshToken');
    if (!config.pixiv?.userAgent)
        missing.push('pixiv.userAgent');
    if (!config.storage?.databasePath)
        missing.push('storage.databasePath');
    if (!config.storage?.downloadDirectory)
        missing.push('storage.downloadDirectory');
    if (!config.network?.timeoutMs)
        missing.push('network.timeoutMs');
    if (config.network?.retries === undefined)
        missing.push('network.retries');
    if (!config.scheduler?.cron)
        missing.push('scheduler.cron');
    if (config.scheduler?.enabled === undefined)
        missing.push('scheduler.enabled');
    if (!Array.isArray(config.targets) || config.targets.length === 0) {
        missing.push('targets');
    }
    if (missing.length > 0) {
        throw new Error(`Configuration error in ${location}. Missing fields: ${missing.join(', ')}`);
    }
}
//# sourceMappingURL=config.js.map