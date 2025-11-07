import { promises as fs } from 'node:fs';

export async function ensureDir(path: string) {
  await fs.mkdir(path, { recursive: true });
}

