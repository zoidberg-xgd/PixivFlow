"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadManager = void 0;
const logger_1 = require("../logger");
class DownloadManager {
    config;
    client;
    database;
    fileService;
    constructor(config, client, database, fileService) {
        this.config = config;
        this.client = client;
        this.database = database;
        this.fileService = fileService;
    }
    async initialise() {
        await this.fileService.initialise();
    }
    async runAllTargets() {
        for (const target of this.config.targets) {
            switch (target.type) {
                case 'illustration':
                    await this.handleIllustrationTarget(target);
                    break;
                case 'novel':
                    await this.handleNovelTarget(target);
                    break;
                default:
                    logger_1.logger.warn(`Unsupported target type ${target.type}`);
            }
        }
    }
    async handleIllustrationTarget(target) {
        logger_1.logger.info(`Processing illustration tag ${target.tag}`);
        try {
            const illusts = await this.client.searchIllustrations(target);
            let downloaded = 0;
            for (const illust of illusts) {
                if (this.database.hasDownloaded(String(illust.id), 'illustration')) {
                    logger_1.logger.debug(`Illustration ${illust.id} already downloaded, skipping`);
                    continue;
                }
                await this.downloadIllustration(illust, target.tag);
                downloaded++;
            }
            this.database.logExecution(target.tag, 'illustration', 'success', `${downloaded} items downloaded`);
            logger_1.logger.info(`Illustration tag ${target.tag} completed`, { downloaded });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.database.logExecution(target.tag, 'illustration', 'failed', message);
            logger_1.logger.error(`Illustration tag ${target.tag} failed`, { error: message });
        }
    }
    async handleNovelTarget(target) {
        logger_1.logger.info(`Processing novel tag ${target.tag}`);
        try {
            const novels = await this.client.searchNovels(target);
            let downloaded = 0;
            for (const novel of novels) {
                if (this.database.hasDownloaded(String(novel.id), 'novel')) {
                    logger_1.logger.debug(`Novel ${novel.id} already downloaded, skipping`);
                    continue;
                }
                await this.downloadNovel(novel, target.tag);
                downloaded++;
            }
            this.database.logExecution(target.tag, 'novel', 'success', `${downloaded} items downloaded`);
            logger_1.logger.info(`Novel tag ${target.tag} completed`, { downloaded });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.database.logExecution(target.tag, 'novel', 'failed', message);
            logger_1.logger.error(`Novel tag ${target.tag} failed`, { error: message });
        }
    }
    async downloadIllustration(illust, tag) {
        const detail = await this.client.getIllustDetail(illust.id);
        const pages = this.getIllustrationPages(detail);
        for (let index = 0; index < pages.length; index++) {
            const page = pages[index];
            const originalUrl = this.resolveImageUrl(page, detail);
            if (!originalUrl) {
                logger_1.logger.warn('Original image url missing', { illustId: detail.id, index });
                continue;
            }
            const extension = this.extractExtension(originalUrl) ?? '.jpg';
            const fileName = this.fileService.sanitizeFileName(`${detail.id}_${detail.title}_${index + 1}${extension}`);
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
            logger_1.logger.info(`Saved illustration ${detail.id} page ${index + 1}`, { filePath });
        }
    }
    async downloadNovel(novel, tag) {
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
        logger_1.logger.info(`Saved novel ${novel.id}`, { filePath });
    }
    getIllustrationPages(detail) {
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
    resolveImageUrl(page, detail) {
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
    extractExtension(url) {
        const path = new URL(url).pathname;
        const index = path.lastIndexOf('.');
        if (index === -1) {
            return null;
        }
        return path.slice(index);
    }
}
exports.DownloadManager = DownloadManager;
//# sourceMappingURL=DownloadManager.js.map