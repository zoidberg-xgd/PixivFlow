"use strict";
/**
 * Login helper utility
 * Provides functions to login and update config file
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
exports.updateConfigWithToken = updateConfigWithToken;
exports.loginAndUpdateConfig = loginAndUpdateConfig;
exports.isTokenValid = isTokenValid;
exports.ensureValidToken = ensureValidToken;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const terminal_login_1 = require("../terminal-login");
const config_1 = require("../config");
const logger_1 = require("../logger");
/**
 * Update config file with new refresh token
 */
async function updateConfigWithToken(configPath, refreshToken) {
    try {
        const configData = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        configData.pixiv.refreshToken = refreshToken;
        await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
        logger_1.logger.info('Configuration updated with new refresh token');
    }
    catch (error) {
        throw new Error(`Failed to update config file: ${error}`);
    }
}
/**
 * Perform login and update config file
 * @param options Login options
 * @returns LoginInfo with tokens
 */
async function loginAndUpdateConfig(options = {}) {
    const configPath = options.configPath ||
        process.env.PIXIV_DOWNLOADER_CONFIG ||
        path.resolve('config/standalone.config.json');
    logger_1.logger.info('Starting Pixiv login...');
    const login = new terminal_login_1.TerminalLogin({
        headless: options.headless ?? false,
        username: options.username,
        password: options.password,
    });
    const loginInfo = await login.login({
        headless: options.headless,
        username: options.username,
        password: options.password,
    });
    // Update config file with refresh token
    await updateConfigWithToken(configPath, loginInfo.refresh_token);
    logger_1.logger.info('Login successful and config updated!');
    return loginInfo;
}
/**
 * Check if refresh token is valid by attempting to refresh
 */
async function isTokenValid(refreshToken) {
    try {
        await terminal_login_1.TerminalLogin.refresh(refreshToken);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Ensure valid token exists in config, login if needed
 */
async function ensureValidToken(options = {}) {
    const configPath = options.configPath ||
        process.env.PIXIV_DOWNLOADER_CONFIG ||
        path.resolve('config/standalone.config.json');
    try {
        const config = (0, config_1.loadConfig)(configPath);
        const refreshToken = config.pixiv.refreshToken;
        // In Docker/non-interactive environments, skip token validation
        // and trust the token in config file (should be validated on host)
        logger_1.logger.info(`ensureValidToken: autoLogin=${options.autoLogin}, refreshToken=${refreshToken ? 'exists' : 'missing'}`);
        if (options.autoLogin === false) {
            if (refreshToken) {
                logger_1.logger.info('Using refresh token from config (skip validation in Docker environment)');
                return refreshToken;
            }
            else {
                throw new Error('No refresh token found in config and auto-login is disabled. Please login on host first.');
            }
        }
        // Check if token is valid
        if (refreshToken && await isTokenValid(refreshToken)) {
            logger_1.logger.info('Valid refresh token found in config');
            return refreshToken;
        }
        // Token invalid or missing, need to login
        logger_1.logger.warn('Invalid or missing refresh token, performing login...');
        const loginInfo = await loginAndUpdateConfig({
            configPath,
            headless: options.headless,
            username: options.username,
            password: options.password,
        });
        return loginInfo.refresh_token;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('Configuration file not found')) {
            // Config file doesn't exist, need to login
            if (options.autoLogin !== false) {
                logger_1.logger.warn('Config file not found, performing login...');
                const loginInfo = await loginAndUpdateConfig({
                    configPath,
                    headless: options.headless,
                    username: options.username,
                    password: options.password,
                });
                return loginInfo.refresh_token;
            }
            else {
                throw new Error('Config file not found and auto-login is disabled');
            }
        }
        throw error;
    }
}
//# sourceMappingURL=login-helper.js.map