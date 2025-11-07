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
    logger.info(`Processing illustration tag ${target.tag}`);
    try {
      const illusts = await this.client.searchIllustrations(target);
      let downloaded = 0;

      for (const illust of illusts) {
        if (this.database.hasDownloaded(String(illust.id), 'illustration')) {
          logger.debug(`Illustration ${illust.id} already downloaded, skipping`);
          continue;
        }

        await this.downloadIllustration(illust, target.tag);
        downloaded++;
      }

      this.database.logExecution(target.tag, 'illustration', 'success', `${downloaded} items downloaded`);
      logger.info(`Illustration tag ${target.tag} completed`, { downloaded });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.database.logExecution(target.tag, 'illustration', 'failed', message);
      logger.error(`Illustration tag ${target.tag} failed`, { error: message });
    }
  }

  private async handleNovelTarget(target: TargetConfig) {
    logger.info(`Processing novel tag ${target.tag}`);
    try {
      const novels = await this.client.searchNovels(target);
      let downloaded = 0;

      for (const novel of novels) {
        if (this.database.hasDownloaded(String(novel.id), 'novel')) {
          logger.debug(`Novel ${novel.id} already downloaded, skipping`);
          continue;
        }

        await this.downloadNovel(novel, target.tag);
        downloaded++;
      }

      this.database.logExecution(target.tag, 'novel', 'success', `${downloaded} items downloaded`);
      logger.info(`Novel tag ${target.tag} completed`, { downloaded });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.database.logExecution(target.tag, 'novel', 'failed', message);
      logger.error(`Novel tag ${target.tag} failed`, { error: message });
    }
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

