/**
 * Token Maintenance Service
 *
 * This service provides automatic refresh token maintenance to ensure tokens never expire.
 * It periodically refreshes the refresh token to keep it valid indefinitely.
 *
 * Key features:
 * - Automatic refresh token renewal before expiration
 * - Configurable refresh interval
 * - Background maintenance without user intervention
 * - One-time setup, forever working
 */
import { PixivAuth } from '../pixiv/AuthClient';
import { PixivCredentialConfig, NetworkConfig, StandaloneConfig } from '../config';
export interface TokenMaintenanceConfig {
    /**
     * Enable automatic token maintenance
     * Default: true
     */
    enabled?: boolean;
    /**
     * Interval between refresh token checks (in milliseconds)
     * Default: 7 days (7 * 24 * 60 * 60 * 1000)
     *
     * Note: Pixiv refresh tokens typically last 30+ days, but we refresh
     * them every 7 days to ensure they never expire.
     */
    refreshInterval?: number;
    /**
     * Minimum time before expiration to trigger refresh (in milliseconds)
     * Default: 7 days (7 * 24 * 60 * 60 * 1000)
     *
     * If refresh token will expire within this time, refresh it immediately.
     */
    minTimeBeforeExpiration?: number;
}
export declare class TokenMaintenanceService {
    private intervalId?;
    private isRunning;
    private config;
    private auth;
    private credentials;
    private network;
    constructor(auth: PixivAuth, credentials: PixivCredentialConfig, network: NetworkConfig, config?: TokenMaintenanceConfig);
    /**
     * Start the token maintenance service
     */
    start(): void;
    /**
     * Stop the token maintenance service
     */
    stop(): void;
    /**
     * Perform token maintenance
     * This method refreshes the refresh token to ensure it never expires
     */
    private maintainToken;
    /**
     * Check if the current refresh token is valid
     */
    private checkRefreshTokenValidity;
    /**
     * Manually trigger token maintenance
     * Useful for testing or immediate refresh
     */
    refreshNow(): Promise<void>;
}
/**
 * Create and configure token maintenance service from config
 */
export declare function createTokenMaintenanceService(auth: PixivAuth, credentials: PixivCredentialConfig, network: NetworkConfig, config?: StandaloneConfig): TokenMaintenanceService | null;
//# sourceMappingURL=token-maintenance.d.ts.map