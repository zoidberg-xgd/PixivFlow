import { StandaloneConfig } from '../../config';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate configuration
 */
export function validateConfig(config: StandaloneConfig): ValidationResult {
  const errors: string[] = [];

  // Validate pixiv config
  if (!config.pixiv) {
    errors.push('Pixiv configuration is required');
  } else {
    if (!config.pixiv.clientId) {
      errors.push('Pixiv client ID is required');
    }
    if (!config.pixiv.refreshToken) {
      errors.push('Pixiv refresh token is required');
    }
  }

  // Validate targets
  if (!config.targets || config.targets.length === 0) {
    errors.push('At least one download target is required');
  } else {
    config.targets.forEach((target, index) => {
      if (!target.type) {
        errors.push(`Target ${index + 1}: type is required`);
      }
      if (target.type !== 'illustration' && target.type !== 'novel') {
        errors.push(`Target ${index + 1}: type must be 'illustration' or 'novel'`);
      }
      if (target.limit !== undefined && target.limit < 1) {
        errors.push(`Target ${index + 1}: limit must be greater than 0`);
      }
    });
  }

  // Validate storage config
  if (!config.storage) {
    errors.push('Storage configuration is required');
  } else {
    if (!config.storage.downloadDirectory) {
      errors.push('Download directory is required');
    }
  }

  // Validate scheduler config (if enabled)
  if (config.scheduler?.enabled) {
    if (!config.scheduler.cron) {
      errors.push('Cron expression is required when scheduler is enabled');
    } else {
      // Basic cron validation
      const cronParts = config.scheduler.cron.split(' ');
      if (cronParts.length !== 5) {
        errors.push('Invalid cron expression format');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

