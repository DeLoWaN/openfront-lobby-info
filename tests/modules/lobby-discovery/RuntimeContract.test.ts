import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Runtime contract', () => {
  it('does not bootstrap the legacy player-list sidebar or layout wrapper', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf-8');

    expect(source.includes('new PlayerListUI(')).toBe(false);
    expect(source.includes('injectLayoutWrapper(')).toBe(false);
  });
});
