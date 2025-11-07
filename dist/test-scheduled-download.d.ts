/**
 * Execute scheduled download tasks
 * This is a generic executor that can be used by schedulers or run manually
 *
 * @param configPath Optional path to config file (defaults to env var or standard path)
 * @param delayMs Optional delay before starting (overrides config.initialDelay if provided)
 */
declare function executeScheduledDownload(configPath?: string, delayMs?: number): Promise<void>;
export { executeScheduledDownload };
//# sourceMappingURL=test-scheduled-download.d.ts.map