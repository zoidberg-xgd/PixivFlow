"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixivAuth = void 0;
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:timers/promises");
const logger_1 = require("../logger");
const TOKEN_CACHE_KEY = 'pixiv_access_token';
class PixivAuth {
    credentials;
    network;
    database;
    constructor(credentials, network, database) {
        this.credentials = credentials;
        this.network = network;
        this.database = database;
    }
    async getAccessToken() {
        const cached = this.database.getToken(TOKEN_CACHE_KEY);
        if (cached && cached.accessToken && cached.expiresAt > Date.now() + 60_000) {
            return cached.accessToken;
        }
        const refreshed = await this.refreshAccessToken();
        return refreshed.accessToken;
    }
    async refreshAccessToken() {
        const url = 'https://oauth.secure.pixiv.net/auth/token';
        let lastError;
        for (let attempt = 0; attempt < this.network.retries; attempt++) {
            try {
                const body = new URLSearchParams({
                    client_id: this.credentials.clientId,
                    client_secret: this.credentials.clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: this.credentials.refreshToken,
                    include_policy: 'true',
                });
                const clientTime = new Date().toISOString();
                const headers = {
                    'User-Agent': this.credentials.userAgent,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Client-Time': clientTime,
                    'X-Client-Hash': this.generateClientHash(clientTime),
                };
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), this.network.timeoutMs);
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        body,
                        headers,
                        signal: controller.signal,
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
                    }
                    const data = (await response.json());
                    const expiresAt = Date.now() + data.expires_in * 1000;
                    const stored = {
                        accessToken: data.access_token,
                        expiresAt,
                        refreshToken: data.refresh_token,
                        tokenType: data.token_type,
                    };
                    this.database.setToken(TOKEN_CACHE_KEY, stored);
                    if (data.refresh_token && data.refresh_token !== this.credentials.refreshToken) {
                        logger_1.logger.info('Received updated refresh token, storing in database');
                        this.database.setToken('pixiv_refresh_token', {
                            accessToken: '',
                            expiresAt,
                            refreshToken: data.refresh_token,
                            tokenType: data.token_type,
                        });
                    }
                    logger_1.logger.info('Refreshed Pixiv access token');
                    return stored;
                }
                finally {
                    clearTimeout(timeout);
                }
            }
            catch (error) {
                lastError = error;
                logger_1.logger.warn('Refresh token attempt failed', { attempt: attempt + 1, error: `${error}` });
                await (0, promises_1.setTimeout)(Math.min(1000 * (attempt + 1), 5000));
            }
        }
        throw new Error(`Unable to refresh Pixiv token after ${this.network.retries} attempts: ${lastError}`);
    }
    generateClientHash(time) {
        const salt = '28c1fdd170a5204386cb1313c7077b32';
        return (0, node_crypto_1.createHash)('md5').update(time + salt).digest('hex');
    }
}
exports.PixivAuth = PixivAuth;
//# sourceMappingURL=AuthClient.js.map