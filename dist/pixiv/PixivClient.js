"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PixivClient = void 0;
const promises_1 = require("node:timers/promises");
const logger_1 = require("../logger");
class PixivClient {
    auth;
    config;
    baseUrl = 'https://app-api.pixiv.net/';
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
    }
    async searchIllustrations(target) {
        const results = [];
        let nextUrl = this.createRequestUrl('v1/search/illust', {
            word: target.tag,
            search_target: target.searchTarget ?? 'partial_match_for_tags',
            sort: 'date_desc',
            filter: 'for_ios',
            include_translated_tag_results: 'true',
        });
        while (nextUrl && (!target.limit || results.length < target.limit)) {
            const requestUrl = nextUrl;
            const response = await this.request(requestUrl, { method: 'GET' });
            for (const illust of response.illusts) {
                results.push(illust);
                if (target.limit && results.length >= target.limit) {
                    break;
                }
            }
            nextUrl = response.next_url;
        }
        return results;
    }
    async searchNovels(target) {
        const results = [];
        let nextUrl = this.createRequestUrl('v1/search/novel', {
            word: target.tag,
            search_target: target.searchTarget ?? 'partial_match_for_tags',
            sort: 'date_desc',
        });
        while (nextUrl && (!target.limit || results.length < target.limit)) {
            const requestUrl = nextUrl;
            const response = await this.request(requestUrl, { method: 'GET' });
            for (const novel of response.novels) {
                results.push(novel);
                if (target.limit && results.length >= target.limit) {
                    break;
                }
            }
            nextUrl = response.next_url;
        }
        return results;
    }
    /**
     * Get ranking illustrations
     * @param mode Ranking mode (day, week, month, etc.)
     * @param date Date in YYYY-MM-DD format (optional, defaults to today)
     * @param limit Maximum number of results
     */
    async getRankingIllustrations(mode = 'day', date, limit) {
        const results = [];
        const params = {
            mode,
            filter: 'for_ios',
        };
        if (date) {
            params.date = date;
        }
        let nextUrl = this.createRequestUrl('v1/illust/ranking', params);
        while (nextUrl && (!limit || results.length < limit)) {
            const requestUrl = nextUrl;
            const response = await this.request(requestUrl, { method: 'GET' });
            for (const illust of response.illusts) {
                results.push(illust);
                if (limit && results.length >= limit) {
                    break;
                }
            }
            nextUrl = response.next_url;
        }
        return results;
    }
    /**
     * Get ranking novels
     * @param mode Ranking mode (day, week, month, etc.)
     * @param date Date in YYYY-MM-DD format (optional, defaults to today)
     * @param limit Maximum number of results
     */
    async getRankingNovels(mode = 'day', date, limit) {
        const results = [];
        const params = {
            mode,
        };
        if (date) {
            params.date = date;
        }
        let nextUrl = this.createRequestUrl('v1/novel/ranking', params);
        while (nextUrl && (!limit || results.length < limit)) {
            const requestUrl = nextUrl;
            const response = await this.request(requestUrl, { method: 'GET' });
            for (const novel of response.novels) {
                results.push(novel);
                if (limit && results.length >= limit) {
                    break;
                }
            }
            nextUrl = response.next_url;
        }
        return results;
    }
    /**
     * Get illustration detail with tags for filtering
     */
    async getIllustDetailWithTags(illustId) {
        const url = this.createRequestUrl('v1/illust/detail', { illust_id: String(illustId) });
        const response = await this.request(url, { method: 'GET' });
        const tags = response.illust.tags || [];
        const { tags: _, ...illust } = response.illust;
        return { illust, tags };
    }
    /**
     * Get novel detail with tags for filtering
     */
    async getNovelDetailWithTags(novelId) {
        const url = this.createRequestUrl('v1/novel/detail', { novel_id: String(novelId) });
        const response = await this.request(url, { method: 'GET' });
        const tags = response.novel.tags || [];
        const { tags: _, ...novel } = response.novel;
        return { novel, tags };
    }
    async getIllustDetail(illustId) {
        const url = this.createRequestUrl('v1/illust/detail', { illust_id: String(illustId) });
        const response = await this.request(url, { method: 'GET' });
        return response.illust;
    }
    async getNovelText(novelId) {
        const url = this.createRequestUrl('v2/novel/text', { novel_id: String(novelId) });
        const response = await this.request(url, { method: 'GET' });
        return response.novel_text;
    }
    async downloadImage(originalUrl) {
        const headers = {
            Referer: 'https://app-api.pixiv.net/',
            'User-Agent': this.config.pixiv.userAgent,
        };
        return this.fetchBinary(originalUrl, headers);
    }
    async fetchBinary(url, headers) {
        let lastError;
        const network = this.config.network;
        for (let attempt = 0; attempt < (network.retries ?? 3); attempt++) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), network.timeoutMs ?? 30000);
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers,
                        signal: controller.signal,
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to fetch binary: ${response.status}`);
                    }
                    const buffer = await response.arrayBuffer();
                    return buffer;
                }
                finally {
                    clearTimeout(timeout);
                }
            }
            catch (error) {
                lastError = error;
                logger_1.logger.warn('Binary fetch failed', { url, attempt: attempt + 1, error: `${error}` });
                await (0, promises_1.setTimeout)(Math.min(1000 * (attempt + 1), 5000));
            }
        }
        throw new Error(`Unable to download resource ${url}: ${lastError}`);
    }
    createRequestUrl(path, params) {
        const url = new URL(path, this.baseUrl);
        Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
        return url.toString();
    }
    async request(url, init) {
        let lastError;
        const network = this.config.network;
        for (let attempt = 0; attempt < (network.retries ?? 3); attempt++) {
            try {
                const token = await this.auth.getAccessToken();
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), network.timeoutMs ?? 30000);
                try {
                    const headers = {
                        Authorization: `Bearer ${token}`,
                        'User-Agent': this.config.pixiv.userAgent,
                        'App-OS': 'ios',
                        'App-OS-Version': '14.6',
                        'App-Version': '7.13.3',
                        Referer: 'https://app-api.pixiv.net/',
                    };
                    const response = await fetch(url, {
                        ...init,
                        headers: {
                            ...headers,
                            ...(init.headers ?? {}),
                        },
                        signal: controller.signal,
                    });
                    if (response.status === 401) {
                        // Token expired, refresh and retry
                        logger_1.logger.warn('Received 401 from Pixiv API, refreshing token');
                        await this.auth.getAccessToken();
                        continue;
                    }
                    if (!response.ok) {
                        throw new Error(`Pixiv API error: ${response.status} ${response.statusText}`);
                    }
                    return (await response.json());
                }
                finally {
                    clearTimeout(timeout);
                }
            }
            catch (error) {
                lastError = error;
                logger_1.logger.warn('Pixiv API request failed', {
                    url,
                    attempt: attempt + 1,
                    error: `${error}`,
                });
                await (0, promises_1.setTimeout)(Math.min(1000 * (attempt + 1), 5000));
            }
        }
        throw new Error(`Pixiv API request to ${url} failed: ${lastError}`);
    }
}
exports.PixivClient = PixivClient;
//# sourceMappingURL=PixivClient.js.map