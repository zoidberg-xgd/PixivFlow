import { setTimeout as delay } from 'node:timers/promises';
import { ProxyAgent } from 'undici';

import { StandaloneConfig, TargetConfig } from '../config';
import { logger } from '../logger';
import { PixivAuth } from './AuthClient';

export interface PixivUser {
  id: string;
  name: string;
}

export interface PixivIllust {
  id: number;
  title: string;
  page_count: number;
  user: PixivUser;
  image_urls: {
    square_medium: string;
    medium: string;
    large: string;
  };
  meta_single_page?: {
    original_image_url?: string;
  };
  meta_pages?: Array<{
    image_urls: {
      square_medium: string;
      medium: string;
      large: string;
      original?: string;
    };
    meta_single_page?: {
      original_image_url?: string;
    };
  }>;
  create_date: string;
}

export type PixivIllustPage = NonNullable<PixivIllust['meta_pages']>[number];

export interface PixivNovel {
  id: number;
  title: string;
  user: PixivUser;
  create_date: string;
}

export interface PixivNovelTextResponse {
  novel_text: string;
}

export class PixivClient {
  private readonly baseUrl = 'https://app-api.pixiv.net/';
  private readonly proxyAgent?: ProxyAgent;

  constructor(private readonly auth: PixivAuth, private readonly config: StandaloneConfig) {
    // Setup proxy agent if configured
    const proxy = this.config.network?.proxy;
    if (proxy?.enabled && proxy.host && proxy.port) {
      const protocol = proxy.protocol || 'http';
      const auth = proxy.username && proxy.password 
        ? `${proxy.username}:${proxy.password}@` 
        : '';
      const proxyUrl = `${protocol}://${auth}${proxy.host}:${proxy.port}`;
      
      // undici ProxyAgent supports http, https, socks4, and socks5
      this.proxyAgent = new ProxyAgent(proxyUrl);
      
      logger.info('Proxy enabled', { 
        protocol, 
        host: proxy.host, 
        port: proxy.port 
      });
    }
  }

  public async searchIllustrations(target: TargetConfig): Promise<PixivIllust[]> {
    const results: PixivIllust[] = [];
    let nextUrl: string | null = this.createRequestUrl('v1/search/illust', {
      word: target.tag,
      search_target: target.searchTarget ?? 'partial_match_for_tags',
      sort: 'date_desc',
      filter: 'for_ios',
      include_translated_tag_results: 'true',
    });

    while (nextUrl && (!target.limit || results.length < target.limit)) {
      const requestUrl = nextUrl;
      const response: { illusts: PixivIllust[]; next_url: string | null } =
        await this.request<{ illusts: PixivIllust[]; next_url: string | null }>(
          requestUrl,
        { method: 'GET' }
      );

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

  public async searchNovels(target: TargetConfig): Promise<PixivNovel[]> {
    const results: PixivNovel[] = [];
    let nextUrl: string | null = this.createRequestUrl('v1/search/novel', {
      word: target.tag,
      search_target: target.searchTarget ?? 'partial_match_for_tags',
      sort: target.sort ?? 'date_desc',
    });

    while (nextUrl && (!target.limit || results.length < target.limit)) {
      const requestUrl = nextUrl;
      const response: { novels: PixivNovel[]; next_url: string | null } =
        await this.request<{ novels: PixivNovel[]; next_url: string | null }>(
          requestUrl,
        { method: 'GET' }
      );

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
  public async getRankingIllustrations(
    mode: string = 'day',
    date?: string,
    limit?: number
  ): Promise<PixivIllust[]> {
    const results: PixivIllust[] = [];
    const params: Record<string, string> = {
      mode,
      filter: 'for_ios',
    };

    if (date) {
      params.date = date;
    }

    let nextUrl: string | null = this.createRequestUrl('v1/illust/ranking', params);

    while (nextUrl && (!limit || results.length < limit)) {
      const requestUrl = nextUrl;
      const response: { illusts: PixivIllust[]; next_url: string | null } =
        await this.request<{ illusts: PixivIllust[]; next_url: string | null }>(
          requestUrl,
        { method: 'GET' }
      );

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
  public async getRankingNovels(
    mode: string = 'day',
    date?: string,
    limit?: number
  ): Promise<PixivNovel[]> {
    const results: PixivNovel[] = [];
    const params: Record<string, string> = {
      mode,
    };

    if (date) {
      params.date = date;
    }

    let nextUrl: string | null = this.createRequestUrl('v1/novel/ranking', params);

    while (nextUrl && (!limit || results.length < limit)) {
      const requestUrl = nextUrl;
      const response: { novels: PixivNovel[]; next_url: string | null } =
        await this.request<{ novels: PixivNovel[]; next_url: string | null }>(
          requestUrl,
        { method: 'GET' }
      );

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
  public async getIllustDetailWithTags(illustId: number): Promise<{
    illust: PixivIllust;
    tags: Array<{ name: string; translated_name?: string }>;
  }> {
    const url = this.createRequestUrl('v1/illust/detail', { illust_id: String(illustId) });
    const response = await this.request<{
      illust: PixivIllust & { tags: Array<{ name: string; translated_name?: string }> };
    }>(url, { method: 'GET' });
    
    const tags = response.illust.tags || [];
    const { tags: _, ...illust } = response.illust;
    
    return { illust, tags };
  }

  /**
   * Get novel detail with tags for filtering
   */
  public async getNovelDetailWithTags(novelId: number): Promise<{
    novel: PixivNovel;
    tags: Array<{ name: string; translated_name?: string }>;
  }> {
    const url = this.createRequestUrl('v1/novel/detail', { novel_id: String(novelId) });
    const response = await this.request<{
      novel: PixivNovel & { tags: Array<{ name: string; translated_name?: string }> };
    }>(url, { method: 'GET' });
    
    const tags = response.novel.tags || [];
    const { tags: _, ...novel } = response.novel;
    
    return { novel, tags };
  }

  public async getIllustDetail(illustId: number): Promise<PixivIllust> {
    const url = this.createRequestUrl('v1/illust/detail', { illust_id: String(illustId) });
    const response = await this.request<{ illust: PixivIllust }>(url, { method: 'GET' });
    return response.illust;
  }

  public async getNovelText(novelId: number): Promise<string> {
    const url = this.createRequestUrl('v2/novel/text', { novel_id: String(novelId) });
    const response = await this.request<PixivNovelTextResponse>(url, { method: 'GET' });
    return response.novel_text;
  }

  public async downloadImage(originalUrl: string): Promise<ArrayBuffer> {
    const headers = {
      Referer: 'https://app-api.pixiv.net/',
      'User-Agent': this.config.pixiv.userAgent,
    };

    return this.fetchBinary(originalUrl, headers);
  }

  private async fetchBinary(url: string, headers: Record<string, string>): Promise<ArrayBuffer> {
    let lastError: unknown;
    const network = this.config.network!;
    for (let attempt = 0; attempt < (network.retries ?? 3); attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), network.timeoutMs ?? 30000);
        try {
          const fetchOptions: RequestInit = {
            method: 'GET',
            headers,
            signal: controller.signal,
          };
          
          // Add proxy agent if configured
          if (this.proxyAgent) {
            (fetchOptions as any).dispatcher = this.proxyAgent;
          }
          
          const response = await fetch(url, fetchOptions);

          if (!response.ok) {
            throw new Error(`Failed to fetch binary: ${response.status}`);
          }

          const buffer = await response.arrayBuffer();
          return buffer;
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        lastError = error;
        logger.warn('Binary fetch failed', { url, attempt: attempt + 1, error: `${error}` });
        await delay(Math.min(1000 * (attempt + 1), 5000));
      }
    }

    throw new Error(`Unable to download resource ${url}: ${lastError}`);
  }

  private createRequestUrl(path: string, params: Record<string, string>): string {
    const url = new URL(path, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    return url.toString();
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    let lastError: unknown;
    const network = this.config.network!;

    for (let attempt = 0; attempt < (network.retries ?? 3); attempt++) {
      try {
        const token = await this.auth.getAccessToken();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), network.timeoutMs ?? 30000);
        try {
          const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            'User-Agent': this.config.pixiv.userAgent,
            'App-OS': 'ios',
            'App-OS-Version': '14.6',
            'App-Version': '7.13.3',
            Referer: 'https://app-api.pixiv.net/',
          };

          const fetchOptions: RequestInit = {
            ...init,
            headers: {
              ...headers,
              ...(init.headers ?? {}),
            },
            signal: controller.signal,
          };
          
          // Add proxy agent if configured
          if (this.proxyAgent) {
            (fetchOptions as any).dispatcher = this.proxyAgent;
          }

          const response = await fetch(url, fetchOptions);

          if (response.status === 401) {
            // Token expired, refresh and retry
            logger.warn('Received 401 from Pixiv API, refreshing token');
            await this.auth.getAccessToken();
            continue;
          }

          if (response.status === 404) {
            // 404 means resource not found, don't retry
            throw new Error(`Pixiv API error: ${response.status} ${response.statusText}`);
          }

          if (!response.ok) {
            throw new Error(`Pixiv API error: ${response.status} ${response.statusText}`);
          }

          return (await response.json()) as T;
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Don't retry on 404 errors - resource doesn't exist
        if (errorMessage.includes('404')) {
          throw error;
        }
        
        logger.warn('Pixiv API request failed', {
          url,
          attempt: attempt + 1,
          error: `${error}`,
        });
        await delay(Math.min(1000 * (attempt + 1), 5000));
      }
    }

    throw new Error(`Pixiv API request to ${url} failed: ${lastError}`);
  }
}

