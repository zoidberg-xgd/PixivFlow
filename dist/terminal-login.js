"use strict";
/**
 * Terminal Login Module for PixivFlow
 *
 * This module provides terminal-based authentication for Pixiv using Python gppt.
 * It supports both interactive and headless login modes.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixivTerminalAuth = exports.TerminalLogin = exports.PixivLoginFailedError = void 0;
exports.printAuthTokenResponse = printAuthTokenResponse;
const readline = __importStar(require("readline"));
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const python_login_adapter_1 = require("./python-login-adapter");
// Constants from gppt/consts.py
const USER_AGENT = 'PixivIOSApp/7.13.3 (iOS 14.6; iPhone13,2)';
const AUTH_TOKEN_URL = 'https://oauth.secure.pixiv.net/auth/token';
const CLIENT_ID = 'MOBrBDS8blbauoSck0ZfDbtuzpyT';
const CLIENT_SECRET = 'lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj';
const TIMEOUT = 10000; // 10 seconds
/**
 * Custom error for Pixiv login failures
 */
class PixivLoginFailedError extends Error {
    constructor(message = 'Pixiv login failed') {
        super(message);
        this.name = 'PixivLoginFailedError';
    }
}
exports.PixivLoginFailedError = PixivLoginFailedError;
/**
 * Main class for terminal-based Pixiv authentication
 * Uses Python gppt for login
 */
class TerminalLogin {
    headless;
    username;
    password;
    constructor(options = {}) {
        this.headless = options.headless ?? false;
        this.username = options.username;
        this.password = options.password;
    }
    /**
     * Login to Pixiv and obtain OAuth token using Python gppt
     */
    async login(options = {}) {
        // Override instance options with method parameters
        if (options.headless !== undefined) {
            this.headless = options.headless;
        }
        if (options.username !== undefined) {
            this.username = options.username;
        }
        if (options.password !== undefined) {
            this.password = options.password;
        }
        // Check if Python gppt is available
        const isAvailable = await (0, python_login_adapter_1.checkPythonGpptAvailable)();
        if (!isAvailable) {
            console.error('[!]: Python gppt is not installed. Attempting to install...');
            const installed = await (0, python_login_adapter_1.installGppt)();
            if (!installed) {
                throw new Error('Failed to install Python gppt. Please install manually: pip3 install gppt');
            }
        }
        // Use gppt for login
        let pythonResult = null;
        if (this.headless && this.username && this.password) {
            try {
                pythonResult = await (0, python_login_adapter_1.loginWithGpptHeadless)(this.username, this.password);
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.error('[!]: Headless login failed:', errorMsg);
                console.log('\n[i]: 提示：无头模式登录失败。可能的解决方案：');
                console.log('[i]: 1. 检查网络连接和代理设置');
                console.log('[i]: 2. 尝试使用交互模式（不使用 --headless 参数）');
                console.log('[i]: 3. 确认登录凭据是否正确');
                console.log('[i]: 4. 等待一段时间后重试（可能被 Pixiv 限制）');
                throw error;
            }
        }
        else {
            pythonResult = await (0, python_login_adapter_1.loginWithGpptInteractive)();
        }
        if (pythonResult) {
            console.log('[+]: Login successful!');
            return pythonResult;
        }
        else {
            const errorMsg = this.headless && this.username && this.password
                ? 'Headless login failed. Try interactive mode (remove --headless flag) or check your credentials/proxy settings.'
                : 'Interactive login failed. Please check your network connection and try again.';
            throw new Error(errorMsg);
        }
    }
    /**
     * Refresh OAuth token using refresh token
     * Based on GetPixivToken.refresh() static method
     */
    static async refresh(refreshToken) {
        try {
            const response = await axios_1.default.post(AUTH_TOKEN_URL, new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'refresh_token',
                include_policy: 'true',
                refresh_token: refreshToken,
            }).toString(), {
                headers: {
                    'user-agent': USER_AGENT,
                    'app-os-version': '14.6',
                    'app-os': 'ios',
                    'content-type': 'application/x-www-form-urlencoded',
                },
                timeout: TIMEOUT,
            });
            return response.data;
        }
        catch (error) {
            throw new PixivLoginFailedError(`Failed to refresh token: ${error}`);
        }
    }
}
exports.TerminalLogin = TerminalLogin;
/**
 * Authentication class with retry logic
 * Based on gppt/auth.py PixivAuth class
 */
class PixivTerminalAuth {
    authJsonPath;
    constructor(authJsonPath = 'client.json') {
        this.authJsonPath = authJsonPath;
    }
    /**
     * Authenticate user with retry logic (up to 3 attempts)
     * Based on PixivAuth.auth() method
     */
    async auth() {
        let attempt = 0;
        const maxAttempts = 3;
        while (attempt < maxAttempts) {
            try {
                const loginInfo = await this.attemptAuth(attempt);
                return loginInfo;
            }
            catch (error) {
                console.error(`[!]: Login attempt ${attempt + 1} failed: ${error}`);
                attempt++;
            }
        }
        throw new PixivLoginFailedError(`Login failed after ${maxAttempts} attempts. Please check your credentials.`);
    }
    /**
     * Attempt authentication
     * Based on PixivAuth.__auth() method
     */
    async attemptAuth(attempt) {
        // Try to read saved credentials
        const savedCreds = await this.readClientCred();
        if (savedCreds && attempt === 0) {
            // Use saved credentials on first attempt
            console.log('[+]: Using saved credentials...');
            const refreshToken = await this.getRefreshToken(savedCreds.pixiv_id, savedCreds.password);
            const loginInfo = await TerminalLogin.refresh(refreshToken);
            return loginInfo;
        }
        else {
            // Prompt for credentials
            const credentials = await this.promptForCredentials();
            console.log('[+]: Logging in...');
            const refreshToken = await this.getRefreshToken(credentials.pixiv_id, credentials.password);
            const loginInfo = await TerminalLogin.refresh(refreshToken);
            console.log('[+]: Login successful!');
            return loginInfo;
        }
    }
    /**
     * Get refresh token using credentials
     * Based on PixivAuth.get_refresh_token() static method
     */
    async getRefreshToken(pixivId, password) {
        const login = new TerminalLogin({
            headless: true,
            username: pixivId,
            password: password,
        });
        const result = await login.login();
        return result.refresh_token;
    }
    /**
     * Read saved credentials from JSON file
     * Based on PixivAuth.read_client_cred() method
     */
    async readClientCred() {
        try {
            const filePath = path.resolve(this.authJsonPath);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const credentials = JSON.parse(fileContent);
            // Validate credentials structure
            if (credentials.pixiv_id && credentials.password) {
                return credentials;
            }
            return null;
        }
        catch (error) {
            // File doesn't exist or is invalid
            return null;
        }
    }
    /**
     * Prompt user for credentials interactively
     * Based on the interactive prompt in PixivAuth.__auth()
     */
    async promptForCredentials() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise((resolve) => {
            console.log('[+]: ID can be email address, username, or account name.');
            rl.question('[?]: Pixiv ID: ', async (pixivId) => {
                // Close readline first to release stdin
                rl.close();
                // Wait a bit to ensure readline is fully closed
                await new Promise(resolve => setTimeout(resolve, 50));
                // Now use secure password input
                const password = await this.promptPassword('[?]: Password: ');
                resolve({ pixiv_id: pixivId.trim(), password: password.trim() });
            });
        });
    }
    /**
     * Prompt for password with hidden input
     * Uses raw mode to hide password characters
     */
    async promptPassword(prompt) {
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
}
exports.PixivTerminalAuth = PixivTerminalAuth;
/**
 * Print authentication token response
 * Based on __print_auth_token_response() function in gppt/main.py
 */
function printAuthTokenResponse(loginInfo, outputJson = false) {
    try {
        const { access_token, refresh_token, expires_in } = loginInfo;
        if (outputJson) {
            console.log(JSON.stringify({
                access_token,
                refresh_token,
                expires_in,
            }, null, 2));
        }
        else {
            console.log('access_token:', access_token);
            console.log('refresh_token:', refresh_token);
            console.log('expires_in:', expires_in);
        }
    }
    catch (error) {
        console.error('Error printing auth response:', error);
        process.exit(1);
    }
}
//# sourceMappingURL=terminal-login.js.map