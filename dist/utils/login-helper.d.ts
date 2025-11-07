/**
 * Login helper utility
 * Provides functions to login and update config file
 */
import { LoginInfo } from '../terminal-login';
/**
 * Update config file with new refresh token
 */
export declare function updateConfigWithToken(configPath: string, refreshToken: string): Promise<void>;
/**
 * Perform login and update config file
 * @param options Login options
 * @returns LoginInfo with tokens
 */
export declare function loginAndUpdateConfig(options?: {
    configPath?: string;
    headless?: boolean;
    username?: string;
    password?: string;
}): Promise<LoginInfo>;
/**
 * Check if refresh token is valid by attempting to refresh
 */
export declare function isTokenValid(refreshToken: string): Promise<boolean>;
/**
 * Ensure valid token exists in config, login if needed
 */
export declare function ensureValidToken(options?: {
    configPath?: string;
    headless?: boolean;
    username?: string;
    password?: string;
    autoLogin?: boolean;
}): Promise<string>;
//# sourceMappingURL=login-helper.d.ts.map