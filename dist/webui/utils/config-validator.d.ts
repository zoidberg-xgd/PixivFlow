import { StandaloneConfig } from '../../config';
export interface ValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * Validate configuration
 */
export declare function validateConfig(config: StandaloneConfig): ValidationResult;
//# sourceMappingURL=config-validator.d.ts.map