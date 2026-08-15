import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/main.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  outExtensions: () => ({ js: '.js' }),
  external: ['electron'],
  clean: true,
})
