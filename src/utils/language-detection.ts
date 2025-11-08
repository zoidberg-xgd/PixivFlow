/**
 * Language detection utilities for novel content
 * Uses franc-min library for fast and accurate language detection
 */

import { franc } from 'franc-min';
import { logger } from '../logger';

/**
 * Detected language information
 */
export interface DetectedLanguage {
  /**
   * ISO 639-3 language code (e.g., 'cmn' for Chinese, 'jpn' for Japanese, 'eng' for English)
   */
  code: string;
  /**
   * Language name in English
   */
  name: string;
  /**
   * Whether the detected language is Chinese (Simplified or Traditional)
   */
  isChinese: boolean;
  /**
   * Confidence score (0-1, higher is more confident)
   */
  confidence?: number;
}

/**
 * Language code to name mapping
 */
const LANGUAGE_NAMES: Record<string, string> = {
  'cmn': 'Chinese (Mandarin)',
  'jpn': 'Japanese',
  'eng': 'English',
  'kor': 'Korean',
  'spa': 'Spanish',
  'fra': 'French',
  'deu': 'German',
  'rus': 'Russian',
  'por': 'Portuguese',
  'ita': 'Italian',
  'und': 'Undetermined',
};

/**
 * Chinese language codes (including variants)
 */
const CHINESE_LANGUAGE_CODES = new Set([
  'cmn',  // Mandarin Chinese
  'yue',  // Cantonese
  'wuu',  // Wu Chinese
  'hak',  // Hakka Chinese
  'nan',  // Min Nan Chinese
]);

/**
 * Detect the language of a text string
 * 
 * @param text The text to analyze
 * @param minLength Minimum text length required for reliable detection (default: 50)
 * @returns Detected language information, or null if text is too short
 * 
 * @example
 * ```typescript
 * const lang = detectLanguage("这是一段中文文本");
 * if (lang?.isChinese) {
 *   console.log("Detected Chinese text");
 * }
 * ```
 */
export function detectLanguage(text: string, minLength: number = 50): DetectedLanguage | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Remove common metadata headers that might interfere with detection
  // (e.g., "Title:", "Author:", "Tags:", etc.)
  const cleanedText = text
    .replace(/^(Title|Author|Author ID|Tags|Download Tag|Original URL|Created):\s*.*$/gmi, '')
    .replace(/^---\s*$/gm, '')
    .trim();

  // Check if text is long enough for reliable detection
  if (cleanedText.length < minLength) {
    logger.debug(`Text too short for language detection (${cleanedText.length} chars, minimum: ${minLength})`);
    return null;
  }

  try {
    // Use franc-min to detect language
    // franc-min returns ISO 639-3 language codes
    const detectedCode = franc(cleanedText);

    if (!detectedCode || detectedCode === 'und') {
      logger.debug('Language detection returned undetermined');
      return {
        code: 'und',
        name: LANGUAGE_NAMES['und'] || 'Undetermined',
        isChinese: false,
      };
    }

    const isChinese = CHINESE_LANGUAGE_CODES.has(detectedCode);
    const name = LANGUAGE_NAMES[detectedCode] || detectedCode;

    logger.debug(`Detected language: ${name} (${detectedCode}), isChinese: ${isChinese}`, {
      textLength: cleanedText.length,
      detectedCode,
    });

    return {
      code: detectedCode,
      name,
      isChinese,
    };
  } catch (error) {
    logger.warn('Language detection failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Check if a text is Chinese
 * 
 * @param text The text to check
 * @param minLength Minimum text length required for reliable detection (default: 50)
 * @returns true if the text is detected as Chinese, false otherwise, null if detection failed
 * 
 * @example
 * ```typescript
 * const isChinese = isChineseText("这是一段中文文本");
 * if (isChinese) {
 *   console.log("This is Chinese text");
 * }
 * ```
 */
export function isChineseText(text: string, minLength: number = 50): boolean | null {
  const detected = detectLanguage(text, minLength);
  return detected ? detected.isChinese : null;
}

