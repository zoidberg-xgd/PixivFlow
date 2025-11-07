import { StorageConfig } from '../config';
export interface FileMetadata {
    author?: string;
    tag?: string;
    date?: Date | string;
}
export declare class FileService {
    private readonly storage;
    constructor(storage: StorageConfig);
    initialise(): Promise<void>;
    saveImage(buffer: ArrayBuffer, fileName: string, metadata?: FileMetadata): Promise<string>;
    saveText(content: string, fileName: string, metadata?: FileMetadata): Promise<string>;
    sanitizeFileName(name: string): string;
    sanitizeDirectoryName(name: string): string;
    private getOrganizedDirectory;
    private findUniquePath;
    private splitExtension;
}
//# sourceMappingURL=FileService.d.ts.map