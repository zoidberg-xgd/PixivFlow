import { StorageConfig } from '../config';
export declare class FileService {
    private readonly storage;
    constructor(storage: StorageConfig);
    initialise(): Promise<void>;
    saveImage(buffer: ArrayBuffer, fileName: string): Promise<string>;
    saveText(content: string, fileName: string): Promise<string>;
    sanitizeFileName(name: string): string;
    private findUniquePath;
    private splitExtension;
}
//# sourceMappingURL=FileService.d.ts.map