"use strict";
/**
 * Language detection utilities for novel content
 * Uses franc-min library for fast and accurate language detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLanguage = detectLanguage;
exports.isChineseText = isChineseText;
const franc_min_1 = require("franc-min");
const logger_1 = require("../logger");
/**
 * Language code to name mapping
 */
const LANGUAGE_NAMES = {
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
    'cmn', // Mandarin Chinese
    'yue', // Cantonese
    'wuu', // Wu Chinese
    'hak', // Hakka Chinese
    'nan', // Min Nan Chinese
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
function detectLanguage(text, minLength = 50) {
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
        logger_1.logger.debug(`Text too short for language detection (${cleanedText.length} chars, minimum: ${minLength})`);
        return null;
    }
    try {
        // Use franc-min to detect language
        // franc-min returns ISO 639-3 language codes
        const detectedCode = (0, franc_min_1.franc)(cleanedText);
        if (!detectedCode || detectedCode === 'und') {
            logger_1.logger.debug('Language detection returned undetermined');
            return {
                code: 'und',
                name: LANGUAGE_NAMES['und'] || 'Undetermined',
                isChinese: false,
            };
        }
        const isChinese = CHINESE_LANGUAGE_CODES.has(detectedCode);
        const name = LANGUAGE_NAMES[detectedCode] || detectedCode;
        logger_1.logger.debug(`Detected language: ${name} (${detectedCode}), isChinese: ${isChinese}`, {
            textLength: cleanedText.length,
            detectedCode,
        });
        return {
            code: detectedCode,
            name,
            isChinese,
        };
    }
    catch (error) {
        logger_1.logger.warn('Language detection failed', {
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
function isChineseText(text, minLength = 50) {
    const detected = detectLanguage(text, minLength);
    return detected ? detected.isChinese : null;
}
//# sourceMappingURL=language-detection.js.map