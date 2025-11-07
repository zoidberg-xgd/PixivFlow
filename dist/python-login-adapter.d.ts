/**
 * Python gppt Login Adapter
 *
 * This module provides login functionality using the pip-installed gppt package.
 * It uses the gppt package installed via `pip install gppt`.
 *
 * Requirements:
 * - Python 3.9+
 * - gppt package installed via pip: `pip install gppt`
 * - Chrome browser and ChromeDriver for Selenium
 *
 * Reference: https://github.com/eggplants/get-pixivpy-token
 */
import { LoginInfo } from './terminal-login';
/**
 * Check if Python and pip-installed gppt module are available
 */
export declare function checkPythonGpptAvailable(): Promise<boolean>;
/**
 * Install gppt using pip
 */
export declare function installGppt(): Promise<boolean>;
/**
 * Login using Python gppt (interactive terminal mode)
 *
 * Note: Even though this is called "terminal login", gppt uses Selenium to automate
 * a browser for the login process. This function will open a visible Chrome browser
 * window where you need to manually log in. If you want to avoid opening a browser
 * window, use loginWithGpptHeadless() with username and password instead.
 *
 * Uses gppt's login-interactive command
 */
export declare function loginWithGpptInteractive(): Promise<LoginInfo | null>;
/**
 * Login using Python gppt (headless mode)
 *
 * This mode runs the browser in the background (headless) without opening
 * a visible window. Requires username and password to be provided.
 *
 * Uses gppt's login-headless command with username and password
 */
export declare function loginWithGpptHeadless(username: string, password: string): Promise<LoginInfo | null>;
//# sourceMappingURL=python-login-adapter.d.ts.map