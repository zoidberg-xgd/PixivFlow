import { StandaloneConfig, TargetConfig } from '../config';
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
export declare class PixivClient {
    private readonly auth;
    private readonly config;
    private readonly baseUrl;
    constructor(auth: PixivAuth, config: StandaloneConfig);
    searchIllustrations(target: TargetConfig): Promise<PixivIllust[]>;
    searchNovels(target: TargetConfig): Promise<PixivNovel[]>;
    /**
     * Get ranking illustrations
     * @param mode Ranking mode (day, week, month, etc.)
     * @param date Date in YYYY-MM-DD format (optional, defaults to today)
     * @param limit Maximum number of results
     */
    getRankingIllustrations(mode?: string, date?: string, limit?: number): Promise<PixivIllust[]>;
    /**
     * Get ranking novels
     * @param mode Ranking mode (day, week, month, etc.)
     * @param date Date in YYYY-MM-DD format (optional, defaults to today)
     * @param limit Maximum number of results
     */
    getRankingNovels(mode?: string, date?: string, limit?: number): Promise<PixivNovel[]>;
    /**
     * Get illustration detail with tags for filtering
     */
    getIllustDetailWithTags(illustId: number): Promise<{
        illust: PixivIllust;
        tags: Array<{
            name: string;
            translated_name?: string;
        }>;
    }>;
    /**
     * Get novel detail with tags for filtering
     */
    getNovelDetailWithTags(novelId: number): Promise<{
        novel: PixivNovel;
        tags: Array<{
            name: string;
            translated_name?: string;
        }>;
    }>;
    getIllustDetail(illustId: number): Promise<PixivIllust>;
    getNovelText(novelId: number): Promise<string>;
    downloadImage(originalUrl: string): Promise<ArrayBuffer>;
    private fetchBinary;
    private createRequestUrl;
    private request;
}
//# sourceMappingURL=PixivClient.d.ts.map