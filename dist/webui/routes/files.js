"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("../../config");
const logger_1 = require("../../logger");
const router = (0, express_1.Router)();
/**
 * GET /api/files/list
 * List files in download directory
 */
router.get('/list', async (req, res) => {
    try {
        const { path: dirPath = '', type = 'illustration' } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        const baseDir = type === 'novel'
            ? config.storage.novelDirectory
            : config.storage.illustrationDirectory;
        const fullPath = dirPath ? (0, path_1.join)(baseDir, String(dirPath)) : baseDir;
        // Security: Ensure path is within base directory
        if (!fullPath.startsWith(baseDir)) {
            return res.status(400).json({ error: 'Invalid path' });
        }
        if (!(0, fs_1.existsSync)(fullPath)) {
            return res.json({ files: [], directories: [] });
        }
        const items = (0, fs_1.readdirSync)(fullPath);
        const files = [];
        const directories = [];
        for (const item of items) {
            const itemPath = (0, path_1.join)(fullPath, item);
            const stats = (0, fs_1.statSync)(itemPath);
            if (stats.isDirectory()) {
                directories.push({
                    name: item,
                    path: dirPath ? `${dirPath}/${item}` : item,
                    type: 'directory',
                });
            }
            else {
                files.push({
                    name: item,
                    path: dirPath ? `${dirPath}/${item}` : item,
                    type: 'file',
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    extension: (0, path_1.extname)(item),
                });
            }
        }
        res.json({
            files,
            directories,
            currentPath: dirPath || '/',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to list files', { error });
        res.status(500).json({ error: 'Failed to list files' });
    }
});
/**
 * GET /api/files/preview
 * Get file preview (for images and files)
 * Query params: path (file path), type (illustration|novel)
 */
router.get('/preview', async (req, res) => {
    try {
        const { path: filePath, type = 'illustration' } = req.query;
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        const baseDir = type === 'novel'
            ? config.storage.novelDirectory
            : config.storage.illustrationDirectory;
        const fullPath = (0, path_1.join)(baseDir, String(filePath));
        // Security: Ensure path is within base directory
        const resolvedBaseDir = (0, path_1.resolve)(baseDir);
        const resolvedFullPath = (0, path_1.resolve)(fullPath);
        logger_1.logger.info('Preview request', {
            filePath: String(filePath),
            baseDir,
            resolvedBaseDir,
            fullPath,
            resolvedFullPath
        });
        if (!resolvedFullPath.startsWith(resolvedBaseDir)) {
            logger_1.logger.error('Invalid path - security check failed', {
                baseDir: resolvedBaseDir,
                fullPath: resolvedFullPath
            });
            return res.status(400).json({ error: 'Invalid path' });
        }
        if (!(0, fs_1.existsSync)(resolvedFullPath)) {
            logger_1.logger.error('File not found', { path: resolvedFullPath, baseDir: resolvedBaseDir });
            return res.status(404).json({ error: 'File not found' });
        }
        const stats = (0, fs_1.statSync)(resolvedFullPath);
        if (stats.isDirectory()) {
            return res.status(400).json({ error: 'Path is a directory, not a file' });
        }
        // Set appropriate headers
        const ext = (0, path_1.extname)(resolvedFullPath).toLowerCase();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        const textExtensions = ['.txt', '.md', '.text'];
        const isImage = imageExtensions.includes(ext);
        const isText = textExtensions.includes(ext);
        if (isImage) {
            // Map extensions to correct MIME types
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp',
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
        }
        else if (isText) {
            const fileName = (0, path_1.basename)(resolvedFullPath);
            // Encode filename for Content-Disposition header to avoid invalid characters
            const encodedFileName = encodeURIComponent(fileName);
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedFileName}`);
        }
        else {
            const fileName = (0, path_1.basename)(resolvedFullPath);
            const encodedFileName = encodeURIComponent(fileName);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodedFileName}`);
        }
        // Send file content
        try {
            if (isText) {
                // For text files, read and send directly
                const fileContent = (0, fs_1.readFileSync)(resolvedFullPath, 'utf-8');
                res.send(fileContent);
            }
            else if (isImage) {
                // For images, use sendFile
                res.sendFile(resolvedFullPath, (err) => {
                    if (err) {
                        logger_1.logger.error('Failed to send image file', { error: err, path: resolvedFullPath });
                        if (!res.headersSent) {
                            res.status(500).json({ error: 'Failed to read file' });
                        }
                    }
                });
            }
            else {
                // For other files, try to read as text first, fallback to sendFile
                try {
                    const fileContent = (0, fs_1.readFileSync)(resolvedFullPath, 'utf-8');
                    res.send(fileContent);
                }
                catch (readError) {
                    res.sendFile(resolvedFullPath, (err) => {
                        if (err) {
                            logger_1.logger.error('Failed to send file', { error: err, path: resolvedFullPath });
                            if (!res.headersSent) {
                                res.status(500).json({ error: 'Failed to read file' });
                            }
                        }
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send file content', {
                error,
                path: resolvedFullPath,
                isText,
                isImage
            });
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to get file preview' });
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to get file preview', { error });
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to get file preview' });
        }
    }
});
/**
 * DELETE /api/files/:id
 * Delete a file
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { path: filePath, type = 'illustration' } = req.query;
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        const baseDir = type === 'novel'
            ? config.storage.novelDirectory
            : config.storage.illustrationDirectory;
        const fullPath = filePath ? (0, path_1.join)(baseDir, String(filePath)) : (0, path_1.join)(baseDir, id);
        // Security: Ensure path is within base directory
        if (!fullPath.startsWith(baseDir)) {
            return res.status(400).json({ error: 'Invalid path' });
        }
        if (!(0, fs_1.existsSync)(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        (0, fs_1.unlinkSync)(fullPath);
        res.json({
            success: true,
            message: 'File deleted successfully',
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to delete file', { error });
        res.status(500).json({ error: 'Failed to delete file' });
    }
});
exports.default = router;
//# sourceMappingURL=files.js.map