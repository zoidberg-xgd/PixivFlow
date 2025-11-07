import { NetworkConfig, PixivCredentialConfig } from '../config';
import { Database } from '../storage/Database';
export declare class PixivAuth {
    private readonly credentials;
    private readonly network;
    private readonly database;
    private configPath?;
    constructor(credentials: PixivCredentialConfig, network: NetworkConfig, database: Database, configPath?: string);
    getAccessToken(): Promise<string>;
    private refreshAccessToken;
    private generateClientHash;
}
//# sourceMappingURL=AuthClient.d.ts.map