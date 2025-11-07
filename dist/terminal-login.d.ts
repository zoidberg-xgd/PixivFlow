/**
 * Terminal Login Module for PixivFlow
 *
 * This module provides terminal-based authentication for Pixiv using Python gppt.
 * It supports both interactive and headless login modes.
 */
/**
 * Profile image URLs interface
 */
interface ProfileImageURLs {
    px_16x16: string;
    px_50x50: string;
    px_170x170: string;
}
/**
 * User information interface
 */
interface UserInfo {
    profile_image_urls: ProfileImageURLs;
    id: string;
    name: string;
    account: string;
    mail_address: string;
    is_premium: boolean;
    x_restrict: number;
    is_mail_authorized: boolean;
    require_policy_agreement: boolean;
}
/**
 * OAuth API response interface
 */
interface OAuthResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    refresh_token: string;
    user: UserInfo;
}
/**
 * Login information interface
 */
export interface LoginInfo extends OAuthResponse {
    response?: OAuthResponse;
}
/**
 * Custom error for Pixiv login failures
 */
export declare class PixivLoginFailedError extends Error {
    constructor(message?: string);
}
/**
 * Main class for terminal-based Pixiv authentication
 * Uses Python gppt for login
 */
export declare class TerminalLogin {
    private headless;
    private username?;
    private password?;
    constructor(options?: {
        headless?: boolean;
        username?: string;
        password?: string;
    });
    /**
     * Login to Pixiv and obtain OAuth token using Python gppt
     */
    login(options?: {
        headless?: boolean;
        username?: string;
        password?: string;
    }): Promise<LoginInfo>;
    /**
     * Refresh OAuth token using refresh token
     * Based on GetPixivToken.refresh() static method
     */
    static refresh(refreshToken: string): Promise<LoginInfo>;
}
/**
 * Authentication class with retry logic
 * Based on gppt/auth.py PixivAuth class
 */
export declare class PixivTerminalAuth {
    private authJsonPath;
    constructor(authJsonPath?: string);
    /**
     * Authenticate user with retry logic (up to 3 attempts)
     * Based on PixivAuth.auth() method
     */
    auth(): Promise<LoginInfo>;
    /**
     * Attempt authentication
     * Based on PixivAuth.__auth() method
     */
    private attemptAuth;
    /**
     * Get refresh token using credentials
     * Based on PixivAuth.get_refresh_token() static method
     */
    private getRefreshToken;
    /**
     * Read saved credentials from JSON file
     * Based on PixivAuth.read_client_cred() method
     */
    private readClientCred;
    /**
     * Prompt user for credentials interactively
     * Based on the interactive prompt in PixivAuth.__auth()
     */
    private promptForCredentials;
    /**
     * Prompt for password with hidden input
     * Uses raw mode to hide password characters
     */
    private promptPassword;
}
/**
 * Print authentication token response
 * Based on __print_auth_token_response() function in gppt/main.py
 */
export declare function printAuthTokenResponse(loginInfo: LoginInfo, outputJson?: boolean): void;
export {};
//# sourceMappingURL=terminal-login.d.ts.map