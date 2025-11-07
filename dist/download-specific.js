"use strict";
/**
 * 特定下载脚本（已废弃）
 *
 * ⚠️ 注意：此脚本已不再需要！
 *
 * 现在可以通过配置文件 + 通用 download 命令来实现相同功能：
 *
 * 1. 使用示例配置文件：
 *    cp config/specific-download.example.json config/standalone.config.json
 *
 * 2. 运行通用下载命令：
 *    pixivflow download
 *    或
 *    npm run download
 *
 * 这样做的好处：
 * - 不需要单独的脚本
 * - 配置更灵活，可以随时修改
 * - 代码更简洁，维护成本更低
 *
 * 如果你仍然想使用此脚本（向后兼容），它会调用通用的 download 命令。
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                                                                ║');
console.log('║        ⚠️  此脚本已废弃，建议使用配置文件方式                  ║');
console.log('║                                                                ║');
console.log('║        使用方法：                                                ║');
console.log('║        1. cp config/specific-download.example.json              ║');
console.log('║           config/standalone.config.json                         ║');
console.log('║        2. pixivflow download                                     ║');
console.log('║                                                                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');
// 为了向后兼容，调用通用的 download 命令
const scriptPath = path.join(__dirname, 'index.js');
const child = (0, child_process_1.spawn)('node', [scriptPath, 'download'], {
    stdio: 'inherit',
    cwd: process.cwd()
});
child.on('close', (code) => {
    process.exit(code || 0);
});
child.on('error', (error) => {
    console.error('❌ 执行失败:', error);
    process.exit(1);
});
//# sourceMappingURL=download-specific.js.map