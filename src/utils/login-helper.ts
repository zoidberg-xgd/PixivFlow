/**
 * Login helper utility
 * Provides functions to login and update config file
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { TerminalLogin, LoginInfo } from '../terminal-login';
import { loadConfig, StandaloneConfig } from '../config';
import { logger } from '../logger';

/**
 * Update config file with new refresh token
 */
export async function updateConfigWithToken(
  configPath: string,
  refreshToken: string
): Promise<void> {
  try {
    const configData = JSON.parse(await fs.readFile(configPath, 'utf-8')) as StandaloneConfig;
    configData.pixiv.refreshToken = refreshToken;
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    logger.info('Configuration updated with new refresh token');
  } catch (error) {
    throw new Error(`Failed to update config file: ${error}`);
  }
}

/**
 * Perform login and update config file
 * @param options Login options
 * @returns LoginInfo with tokens
 */
export async function loginAndUpdateConfig(options: {
  configPath?: string;
  headless?: boolean;
  username?: string;
  password?: string;
} = {}): Promise<LoginInfo> {
  const configPath = options.configPath || 
    process.env.PIXIV_DOWNLOADER_CONFIG || 
    path.resolve('config/standalone.config.json');

  logger.info('Starting Pixiv login...');
  
  const login = new TerminalLogin({
    headless: options.headless ?? false,
    username: options.username,
    password: options.password,
  });

  const loginInfo = await login.login({
    headless: options.headless,
    username: options.username,
    password: options.password,
  });

  // Update config file with refresh token
  await updateConfigWithToken(configPath, loginInfo.refresh_token);
  
  logger.info('Login successful and config updated!');
  return loginInfo;
}

/**
 * Check if refresh token is valid by attempting to refresh
 */
export async function isTokenValid(refreshToken: string): Promise<boolean> {
  try {
    await TerminalLogin.refresh(refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure valid token exists in config, login if needed
 */
export async function ensureValidToken(options: {
  configPath?: string;
  headless?: boolean;
  username?: string;
  password?: string;
  autoLogin?: boolean;
} = {}): Promise<string> {
  const configPath = options.configPath || 
    process.env.PIXIV_DOWNLOADER_CONFIG || 
    path.resolve('config/standalone.config.json');

  try {
    const config = loadConfig(configPath);
    const refreshToken = config.pixiv.refreshToken;

    // Check if token is valid
    if (refreshToken && await isTokenValid(refreshToken)) {
      logger.info('Valid refresh token found in config');
      return refreshToken;
    }

    // Token invalid or missing, need to login
    if (options.autoLogin !== false) {
      logger.warn('Invalid or missing refresh token, performing login...');
      const loginInfo = await loginAndUpdateConfig({
        configPath,
        headless: options.headless,
        username: options.username,
        password: options.password,
      });
      return loginInfo.refresh_token;
    } else {
      throw new Error('No valid refresh token found and auto-login is disabled');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Configuration file not found')) {
      // Config file doesn't exist, need to login
      if (options.autoLogin !== false) {
        logger.warn('Config file not found, performing login...');
        const loginInfo = await loginAndUpdateConfig({
          configPath,
          headless: options.headless,
          username: options.username,
          password: options.password,
        });
        return loginInfo.refresh_token;
      } else {
        throw new Error('Config file not found and auto-login is disabled');
      }
    }
    throw error;
  }
}

