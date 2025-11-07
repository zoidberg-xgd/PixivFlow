"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDir = ensureDir;
const node_fs_1 = require("node:fs");
async function ensureDir(path) {
    await node_fs_1.promises.mkdir(path, { recursive: true });
}
//# sourceMappingURL=fs.js.map