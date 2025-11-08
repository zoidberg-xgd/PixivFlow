/**
 * Language detection utilities for novel content
 * Uses franc-min library for fast and accurate language detection
 */
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
export declare function detectLanguage(text: string, minLength?: number): DetectedLanguage | null;
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
export declare function isChineseText(text: string, minLength?: number): boolean | null;
//# sourceMappingURL=language-detection.d.ts.map