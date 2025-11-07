import { StandaloneConfig, TargetConfig } from '../config';
import { logger } from '../logger';
import { PixivClient, PixivIllust, PixivIllustPage, PixivNovel } from '../pixiv/PixivClient';
import { Database } from '../storage/Database';
import { FileService } from './FileService';

export class DownloadManager {
  constructor(
    private readonly config: StandaloneConfig,
    private readonly client: PixivClient,
    private readonly database: Database,
    private readonly fileService: FileService
  ) {}

  public async initialise() {
    await this.fileService.initialise();
  }

  public async runAllTargets() {
    for (const target of this.config.targets) {
      switch (target.type) {
        case 'illustration':
          await this.handleIllustrationTarget(target);
          break;
        case 'novel':
          await this.handleNovelTarget(target);
          break;
        default:
          logger.warn(`Unsupported target type ${target.type}`);
      }
    }
  }

  private async handleIllustrationTarget(target: TargetConfig) {
    const mode = target.mode || 'search';
    const displayTag = target.filterTag || target.tag;
    logger.info(`Processing illustration ${mode === 'ranking' ? 'ranking' : 'tag'} ${displayTag}`);
    
    try {
      let illusts: PixivIllust[] = [];
      
      if (mode === 'ranking') {
        // Get ranking illustrations
        const rankingMode = target.rankingMode || 'day';
        let rankingDate = target.rankingDate || this.getTodayDate();
        // Process YESTERDAY placeholder
        if (rankingDate === 'YESTERDAY') {
          rankingDate = this.getYesterdayDate();
        }
        const fetchLimit = target.filterTag ? (target.limit || 10) * 3 : target.limit; // Fetch more if filtering
        
        logger.info(`Fetching ranking illustrations (mode: ${rankingMode}, date: ${rankingDate})`);
        illusts = await this.client.getRankingIllustrations(rankingMode, rankingDate, fetchLimit);
        
        // Filter by tag if specified
        if (target.filterTag) {
          logger.info(`Filtering ranking results by tag: ${target.filterTag}`);
          const filtered: PixivIllust[] = [];
          
          for (const illust of illusts) {
            if (filtered.length >= (target.limit || 10)) {
              break;
            }
            
            // Get detail with tags
            try {
              const { illust: detail, tags } = await this.client.getIllustDetailWithTags(illust.id);
              const tagNames = tags.map(t => t.name.toLowerCase());
              const translatedNames = tags.map(t => t.translated_name?.toLowerCase()).filter(Boolean) as string[];
              const filterTagLower = target.filterTag.toLowerCase();
              
              if (tagNames.includes(filterTagLower) || translatedNames.includes(filterTagLower)) {
                filtered.push(detail);
              }
            } catch (error) {
              logger.warn(`Failed to get tags for illust ${illust.id}`, { error });
            }
          }
          
          illusts = filtered;
        }
      } else {
        // Search by tag (default mode)
        illusts = await this.client.searchIllustrations(target);
      }
      
      // Random selection mode
      if (target.random && illusts.length > 0) {
        // Filter out already downloaded items
        const available = illusts.filter(illust => 
          !this.database.hasDownloaded(String(illust.id), 'illustration')
        );
        
        if (available.length > 0) {
          const randomIndex = Math.floor(Math.random() * available.length);
          const randomIllust = available[randomIndex];
          logger.info(`Randomly selected illustration ${randomIllust.id} from ${available.length} available results`);
          illusts = [randomIllust];
        } else {
          logger.info('All search results have already been downloaded');
          illusts = [];
        }
      }
      
      let downloaded = 0;
      const tagForLog = target.filterTag || target.tag;

      for (const illust of illusts) {
        if (this.database.hasDownloaded(String(illust.id), 'illustration')) {
          logger.debug(`Illustration ${illust.id} already downloaded, skipping`);
          continue;
        }

        await this.downloadIllustration(illust, tagForLog);
        downloaded++;
      }

      this.database.logExecution(tagForLog, 'illustration', 'success', `${downloaded} items downloaded`);
      logger.info(`Illustration ${mode === 'ranking' ? 'ranking' : 'tag'} ${tagForLog} completed`, { downloaded });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.database.logExecution(displayTag, 'illustration', 'failed', message);
      logger.error(`Illustration ${mode === 'ranking' ? 'ranking' : 'tag'} ${displayTag} failed`, { error: message });
    }
  }

  private async handleNovelTarget(target: TargetConfig) {
    const mode = target.mode || 'search';
    const displayTag = target.filterTag || target.tag;
    logger.info(`Processing novel ${mode === 'ranking' ? 'ranking' : 'tag'} ${displayTag}`);
    
    try {
      let novels: PixivNovel[] = [];
      
      if (mode === 'ranking') {
        // Get ranking novels
        const rankingMode = target.rankingMode || 'day';
        let rankingDate = target.rankingDate || this.getTodayDate();
        // Process YESTERDAY placeholder
        if (rankingDate === 'YESTERDAY') {
          rankingDate = this.getYesterdayDate();
        }
        const fetchLimit = target.filterTag ? (target.limit || 10) * 3 : target.limit; // Fetch more if filtering
        
        logger.info(`Fetching ranking novels (mode: ${rankingMode}, date: ${rankingDate})`);
        novels = await this.client.getRankingNovels(rankingMode, rankingDate, fetchLimit);
        
        // Filter by tag if specified
        if (target.filterTag) {
          logger.info(`Filtering ranking results by tag: ${target.filterTag}`);
          const filtered: PixivNovel[] = [];
          
          for (const novel of novels) {
            if (filtered.length >= (target.limit || 10)) {
              break;
            }
            
            // Get detail with tags
            try {
              const { novel: detail, tags } = await this.client.getNovelDetailWithTags(novel.id);
              const tagNames = tags.map(t => t.name.toLowerCase());
              const translatedNames = tags.map(t => t.translated_name?.toLowerCase()).filter(Boolean) as string[];
              const filterTagLower = target.filterTag.toLowerCase();
              
              if (tagNames.includes(filterTagLower) || translatedNames.includes(filterTagLower)) {
                filtered.push(detail);
              }
            } catch (error) {
              logger.warn(`Failed to get tags for novel ${novel.id}`, { error });
            }
          }
          
          novels = filtered;
        }
      } else {
        // Search by tag (default mode)
        novels = await this.client.searchNovels(target);
      }
      
      // Random selection mode
      if (target.random && novels.length > 0) {
        // Filter out already downloaded items
        const available = novels.filter(novel => 
          !this.database.hasDownloaded(String(novel.id), 'novel')
        );
        
        if (available.length > 0) {
          const randomIndex = Math.floor(Math.random() * available.length);
          const randomNovel = available[randomIndex];
          logger.info(`Randomly selected novel ${randomNovel.id} from ${available.length} available results`);
          novels = [randomNovel];
        } else {
          logger.info('All search results have already been downloaded');
          novels = [];
        }
      }
      
      let downloaded = 0;
      const tagForLog = target.filterTag || target.tag;

      for (const novel of novels) {
        if (this.database.hasDownloaded(String(novel.id), 'novel')) {
          logger.debug(`Novel ${novel.id} already downloaded, skipping`);
          continue;
        }

        await this.downloadNovel(novel, tagForLog);
        downloaded++;
      }

      this.database.logExecution(tagForLog, 'novel', 'success', `${downloaded} items downloaded`);
      logger.info(`Novel ${mode === 'ranking' ? 'ranking' : 'tag'} ${tagForLog} completed`, { downloaded });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.database.logExecution(displayTag, 'novel', 'failed', message);
      logger.error(`Novel ${mode === 'ranking' ? 'ranking' : 'tag'} ${displayTag} failed`, { error: message });
    }
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  private getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get yesterday's date in YYYY-MM-DD format
   */
  private getYesterdayDate(): string {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async downloadIllustration(illust: PixivIllust, tag: string) {
    const detail = await this.client.getIllustDetail(illust.id);

    const pages = this.getIllustrationPages(detail);

    for (let index = 0; index < pages.length; index++) {
      const page = pages[index];
      const originalUrl = this.resolveImageUrl(page, detail);
      if (!originalUrl) {
        logger.warn('Original image url missing', { illustId: detail.id, index });
        continue;
      }

      const extension = this.extractExtension(originalUrl) ?? '.jpg';
      const fileName = this.fileService.sanitizeFileName(
        `${detail.id}_${detail.title}_${index + 1}${extension}`
      );

      const buffer = await this.client.downloadImage(originalUrl);
      const filePath = await this.fileService.saveImage(buffer, fileName);

      this.database.insertDownload({
        pixivId: String(detail.id),
        type: 'illustration',
        tag,
        title: detail.title,
        filePath,
        author: detail.user?.name,
        userId: detail.user?.id,
      });

      logger.info(`Saved illustration ${detail.id} page ${index + 1}`, { filePath });
    }
  }

  private async downloadNovel(novel: PixivNovel, tag: string) {
    const text = await this.client.getNovelText(novel.id);

    const header = [
      `Title: ${novel.title}`,
      `Author: ${novel.user?.name ?? 'Unknown'}`,
      `Author ID: ${novel.user?.id ?? 'Unknown'}`,
      `Tag: ${tag}`,
      `Created: ${new Date(novel.create_date).toISOString()}`,
      '',
      '---',
      '',
    ].join('\n');

    const content = `${header}\n${text}`;
    const fileName = this.fileService.sanitizeFileName(`${novel.id}_${novel.title}.txt`);
    const filePath = await this.fileService.saveText(content, fileName);

    this.database.insertDownload({
      pixivId: String(novel.id),
      type: 'novel',
      tag,
      title: novel.title,
      filePath,
      author: novel.user?.name,
      userId: novel.user?.id,
    });

    logger.info(`Saved novel ${novel.id}`, { filePath });
  }

  private getIllustrationPages(detail: PixivIllust): PixivIllustPage[] {
    if (detail.meta_pages && detail.meta_pages.length > 0) {
      return detail.meta_pages;
    }

    return [
      {
        image_urls: {
          square_medium: detail.image_urls.square_medium,
          medium: detail.image_urls.medium,
          large: detail.image_urls.large,
          original: detail.meta_single_page?.original_image_url,
        },
        meta_single_page: detail.meta_single_page,
      },
    ];
  }

  private resolveImageUrl(page: PixivIllustPage, detail: PixivIllust) {
    if (page.meta_single_page?.original_image_url) {
      return page.meta_single_page.original_image_url;
    }

    const imageUrls = page.image_urls;
    if (imageUrls.original) {
      return imageUrls.original;
    }

    if (detail.meta_single_page?.original_image_url) {
      return detail.meta_single_page.original_image_url;
    }

    return imageUrls.large ?? imageUrls.medium;
  }

  private extractExtension(url: string): string | null {
    const path = new URL(url).pathname;
    const index = path.lastIndexOf('.');
    if (index === -1) {
      return null;
    }
    return path.slice(index);
  }
}

