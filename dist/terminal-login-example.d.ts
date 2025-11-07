/**
 * Terminal Login Usage Examples
 *
 * This file demonstrates how to use the terminal login module in your code.
 * Uses the gppt package (pip install gppt) for authentication.
 *
 * Reference: https://github.com/eggplants/get-pixivpy-token
 */
/**
 * Example 1: Basic login with gppt (interactive mode)
 * gppt will open a browser window for manual login
 */
declare function exampleBasicLogin(): Promise<void>;
/**
 * Example 2: Headless login with credentials
 * Automatic login using gppt in headless mode (no visible browser window)
 */
declare function exampleHeadlessLogin(): Promise<void>;
/**
 * Example 3: Token-based authentication with caching
 * Save and reuse refresh token (similar to README example)
 */
declare function exampleTokenCaching(): Promise<void>;
/**
 * Example 4: Interactive authentication with retry
 * Using PixivTerminalAuth for robust authentication
 */
declare function exampleInteractiveAuth(): Promise<void>;
/**
 * Example 5: Refresh existing token
 * Use this when you already have a refresh token
 */
declare function exampleRefreshToken(): Promise<void>;
/**
 * Example 6: Integration with PixivFlow
 * Complete workflow for the downloader
 */
declare function exampleDownloaderIntegration(): Promise<void>;
/**
 * Example 7: Save credentials for future use
 * Create client.json file with credentials
 */
declare function exampleSaveCredentials(): Promise<void>;
export { exampleBasicLogin, exampleHeadlessLogin, exampleTokenCaching, exampleInteractiveAuth, exampleRefreshToken, exampleDownloaderIntegration, exampleSaveCredentials, };
//# sourceMappingURL=terminal-login-example.d.ts.map