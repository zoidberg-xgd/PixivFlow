import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { logger } from './logger';

export type TargetType = 'illustration' | 'novel';

export interface TargetConfig {
  type: TargetType;
  tag: string;
  /**
   * Maximum works to download per execution for this tag.
   */
  limit?: number;
  /**
   * Search target parameter for Pixiv API.
   */
  searchTarget?: 'partial_match_for_tags' | 'exact_match_for_tags' | 'title_and_caption';
  restrict?: 'public' | 'private';
}

export interface PixivCredentialConfig {
  clientId: string;
  clientSecret: string;
  deviceToken: string;
  refreshToken: string;
  userAgent: string;
}

export interface NetworkConfig {
  timeoutMs: number;
  retries: number;
}

export interface StorageConfig {
  databasePath: string;
  downloadDirectory: string;
  illustrationDirectory?: string;
  novelDirectory?: string;
}

export interface SchedulerConfig {
  enabled: boolean;
  cron: string;
  timezone?: string;
}

export interface StandaloneConfig {
  pixiv: PixivCredentialConfig;
  network: NetworkConfig;
  storage: StorageConfig;
  scheduler: SchedulerConfig;
  targets: TargetConfig[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export function loadConfig(configPath?: string): StandaloneConfig {
  const resolvedPath = resolve(
    configPath ?? process.env.PIXIV_DOWNLOADER_CONFIG ?? 'config/standalone.config.json'
  );

  if (!existsSync(resolvedPath)) {
    throw new Error(`Configuration file not found at ${resolvedPath}`);
  }

  const raw = readFileSync(resolvedPath, 'utf-8');
  const parsed = JSON.parse(raw) as StandaloneConfig;

  validateConfig(parsed, resolvedPath);

  if (parsed.logLevel) {
    logger.setLevel(parsed.logLevel);
  }

  // Fill directories with defaults if needed
  if (!parsed.storage.illustrationDirectory) {
    parsed.storage.illustrationDirectory = resolve(
      parsed.storage.downloadDirectory,
      'illustrations'
    );
  }
  if (!parsed.storage.novelDirectory) {
    parsed.storage.novelDirectory = resolve(parsed.storage.downloadDirectory, 'novels');
  }

  return parsed;
}

function validateConfig(config: StandaloneConfig, location: string) {
  const missing: string[] = [];

  if (!config.pixiv?.clientId) missing.push('pixiv.clientId');
  if (!config.pixiv?.clientSecret) missing.push('pixiv.clientSecret');
  if (!config.pixiv?.deviceToken) missing.push('pixiv.deviceToken');
  if (!config.pixiv?.refreshToken) missing.push('pixiv.refreshToken');
  if (!config.pixiv?.userAgent) missing.push('pixiv.userAgent');

  if (!config.storage?.databasePath) missing.push('storage.databasePath');
  if (!config.storage?.downloadDirectory) missing.push('storage.downloadDirectory');

  if (!config.network?.timeoutMs) missing.push('network.timeoutMs');
  if (config.network?.retries === undefined) missing.push('network.retries');

  if (!config.scheduler?.cron) missing.push('scheduler.cron');
  if (config.scheduler?.enabled === undefined) missing.push('scheduler.enabled');

  if (!Array.isArray(config.targets) || config.targets.length === 0) {
    missing.push('targets');
  }

  if (missing.length > 0) {
    throw new Error(
      `Configuration error in ${location}. Missing fields: ${missing.join(', ')}`
    );
  }
}

