import { setTimeout as delay } from 'node:timers/promises';

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

  constructor(private readonly auth: PixivAuth, private readonly config: StandaloneConfig) {}

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
      sort: 'date_desc',
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
    for (let attempt = 0; attempt < this.config.network.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.network.timeoutMs);
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

    for (let attempt = 0; attempt < this.config.network.retries; attempt++) {
      try {
        const token = await this.auth.getAccessToken();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.network.timeoutMs);
        try {
          const headers: Record<string, string> = {
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
            logger.warn('Received 401 from Pixiv API, refreshing token');
            await this.auth.getAccessToken();
            continue;
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

