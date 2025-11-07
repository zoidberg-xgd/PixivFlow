"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const fs_1 = require("../utils/fs");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
class FileService {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    async initialise() {
        await (0, fs_1.ensureDir)(this.storage.downloadDirectory);
        if (this.storage.illustrationDirectory) {
            await (0, fs_1.ensureDir)(this.storage.illustrationDirectory);
        }
        if (this.storage.novelDirectory) {
            await (0, fs_1.ensureDir)(this.storage.novelDirectory);
        }
    }
    async saveImage(buffer, fileName, metadata) {
        const baseDirectory = this.storage.illustrationDirectory ?? this.storage.downloadDirectory;
        const organizationMode = this.storage.illustrationOrganization ?? 'flat';
        const targetDirectory = this.getOrganizedDirectory(baseDirectory, organizationMode, metadata);
        const uniquePath = await this.findUniquePath(targetDirectory, fileName);
        await node_fs_1.promises.writeFile(uniquePath, Buffer.from(buffer));
        return uniquePath;
    }
    async saveText(content, fileName, metadata) {
        const baseDirectory = this.storage.novelDirectory ?? this.storage.downloadDirectory;
        const organizationMode = this.storage.novelOrganization ?? 'flat';
        const targetDirectory = this.getOrganizedDirectory(baseDirectory, organizationMode, metadata);
        const uniquePath = await this.findUniquePath(targetDirectory, fileName);
        await node_fs_1.promises.writeFile(uniquePath, content, 'utf-8');
        return uniquePath;
    }
    sanitizeFileName(name) {
        return name
            .replace(/[\/:*?"<>|]/g, '_')
            .replace(/\s+/g, ' ')
            .trim();
    }
    sanitizeDirectoryName(name) {
        // Sanitize directory name, more restrictive than file names
        return name
            .replace(/[\/:*?"<>|\\]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/\./g, '_')
            .replace(/^_+|_+$/g, '')
            .trim() || 'unknown';
    }
    getOrganizedDirectory(baseDirectory, mode, metadata) {
        if (mode === 'flat') {
            return baseDirectory;
        }
        const parts = [];
        if (mode === 'byDate' || mode === 'byDateAndAuthor') {
            const date = metadata?.date
                ? typeof metadata.date === 'string'
                    ? new Date(metadata.date)
                    : metadata.date
                : new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            parts.push(`${year}-${month}`);
        }
        if (mode === 'byAuthor' || mode === 'byAuthorAndTag' || mode === 'byDateAndAuthor') {
            const author = metadata?.author ? this.sanitizeDirectoryName(metadata.author) : 'unknown';
            parts.push(author);
        }
        if (mode === 'byTag' || mode === 'byAuthorAndTag') {
            const tag = metadata?.tag ? this.sanitizeDirectoryName(metadata.tag) : 'untagged';
            parts.push(tag);
        }
        return parts.length > 0 ? (0, node_path_1.join)(baseDirectory, ...parts) : baseDirectory;
    }
    async findUniquePath(directory, fileName) {
        await (0, fs_1.ensureDir)(directory);
        const { ext, baseName } = this.splitExtension(fileName);
        let attempt = 0;
        while (attempt < 1000) {
            const suffix = attempt === 0 ? '' : `_${attempt}`;
            const candidateName = `${baseName}${suffix}${ext}`;
            const filePath = (0, node_path_1.join)(directory, candidateName);
            try {
                await node_fs_1.promises.access(filePath);
                attempt++;
            }
            catch {
                return filePath;
            }
        }
        throw new Error(`Unable to find unique file name for ${fileName} in ${directory}`);
    }
    splitExtension(fileName) {
        const index = fileName.lastIndexOf('.');
        if (index === -1) {
            return { baseName: fileName, ext: '' };
        }
        return {
            baseName: fileName.slice(0, index),
            ext: fileName.slice(index),
        };
    }
}
exports.FileService = FileService;
//# sourceMappingURL=FileService.js.map