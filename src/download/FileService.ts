import { ensureDir } from '../utils/fs';
import { StorageConfig } from '../config';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

export class FileService {
  constructor(private readonly storage: StorageConfig) {}

  public async initialise() {
    await ensureDir(this.storage.downloadDirectory);
    if (this.storage.illustrationDirectory) {
      await ensureDir(this.storage.illustrationDirectory);
    }
    if (this.storage.novelDirectory) {
      await ensureDir(this.storage.novelDirectory);
    }
  }

  public async saveImage(buffer: ArrayBuffer, fileName: string): Promise<string> {
    const targetDirectory = this.storage.illustrationDirectory ?? this.storage.downloadDirectory;
    const uniquePath = await this.findUniquePath(targetDirectory, fileName);
    await fs.writeFile(uniquePath, Buffer.from(buffer));
    return uniquePath;
  }

  public async saveText(content: string, fileName: string): Promise<string> {
    const targetDirectory = this.storage.novelDirectory ?? this.storage.downloadDirectory;
    const uniquePath = await this.findUniquePath(targetDirectory, fileName);
    await fs.writeFile(uniquePath, content, 'utf-8');
    return uniquePath;
  }

  public sanitizeFileName(name: string) {
    return name
      .replace(/[\/:*?"<>|]/g, '_')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async findUniquePath(directory: string, fileName: string): Promise<string> {
    await ensureDir(directory);
    const { ext, baseName } = this.splitExtension(fileName);
    let attempt = 0;
    while (attempt < 1000) {
      const suffix = attempt === 0 ? '' : `_${attempt}`;
      const candidateName = `${baseName}${suffix}${ext}`;
      const filePath = join(directory, candidateName);
      try {
        await fs.access(filePath);
        attempt++;
      } catch {
        return filePath;
      }
    }
    throw new Error(`Unable to find unique file name for ${fileName} in ${directory}`);
  }

  private splitExtension(fileName: string): { baseName: string; ext: string } {
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

