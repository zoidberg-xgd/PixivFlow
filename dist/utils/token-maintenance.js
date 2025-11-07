"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenMaintenanceService = void 0;
exports.createTokenMaintenanceService = createTokenMaintenanceService;
const logger_1 = require("../logger");
const terminal_login_1 = require("../terminal-login");
const DEFAULT_CONFIG = {
    enabled: true,
    refreshInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
    minTimeBeforeExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
};
class TokenMaintenanceService {
    intervalId;
    isRunning = false;
    config;
    auth;
    credentials;
    network;
    constructor(auth, credentials, network, config) {
        this.auth = auth;
        this.credentials = credentials;
        this.network = network;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Start the token maintenance service
     */
    start() {
        if (!this.config.enabled) {
            logger_1.logger.info('Token maintenance service is disabled');
            return;
        }
        if (this.isRunning) {
            logger_1.logger.warn('Token maintenance service is already running');
            return;
        }
        this.isRunning = true;
        logger_1.logger.info('Starting token maintenance service', {
            refreshInterval: `${this.config.refreshInterval / (24 * 60 * 60 * 1000)} days`,
        });
        // Perform initial check
        this.maintainToken().catch((error) => {
            logger_1.logger.error('Initial token maintenance check failed', {
                error: error instanceof Error ? error.message : String(error),
            });
        });
        // Schedule periodic maintenance
        this.intervalId = setInterval(() => {
            this.maintainToken().catch((error) => {
                logger_1.logger.error('Periodic token maintenance failed', {
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        }, this.config.refreshInterval);
    }
    /**
     * Stop the token maintenance service
     */
    stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        logger_1.logger.info('Token maintenance service stopped');
    }
    /**
     * Perform token maintenance
     * This method refreshes the refresh token to ensure it never expires
     */
    async maintainToken() {
        try {
            logger_1.logger.debug('Performing token maintenance check...');
            // Check if refresh token is valid
            const isValid = await this.checkRefreshTokenValidity();
            if (!isValid) {
                logger_1.logger.warn('Refresh token is invalid, but cannot auto-renew without credentials');
                logger_1.logger.warn('Please run login command to get a new refresh token');
                return;
            }
            // Refresh the access token, which will also update the refresh token if needed
            // This is the key: by refreshing the access token, we get a new refresh token
            // which extends the validity period indefinitely
            try {
                await this.auth.getAccessToken();
                logger_1.logger.info('✓ Token maintenance completed successfully');
            }
            catch (error) {
                logger_1.logger.error('Failed to refresh access token during maintenance', {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Token maintenance failed', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    /**
     * Check if the current refresh token is valid
     */
    async checkRefreshTokenValidity() {
        try {
            if (!this.credentials.refreshToken) {
                return false;
            }
            // Try to refresh the token to verify it's valid
            await terminal_login_1.TerminalLogin.refresh(this.credentials.refreshToken);
            return true;
        }
        catch (error) {
            logger_1.logger.debug('Refresh token validation failed', {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    /**
     * Manually trigger token maintenance
     * Useful for testing or immediate refresh
     */
    async refreshNow() {
        logger_1.logger.info('Manually triggering token maintenance...');
        await this.maintainToken();
    }
}
exports.TokenMaintenanceService = TokenMaintenanceService;
/**
 * Create and configure token maintenance service from config
 */
function createTokenMaintenanceService(auth, credentials, network, config) {
    // Check if token maintenance is enabled in config
    const maintenanceConfig = config?.tokenMaintenance;
    if (maintenanceConfig?.enabled === false) {
        logger_1.logger.info('Token maintenance is disabled in configuration');
        return null;
    }
    const service = new TokenMaintenanceService(auth, credentials, network, maintenanceConfig);
    return service;
}
//# sourceMappingURL=token-maintenance.js.map