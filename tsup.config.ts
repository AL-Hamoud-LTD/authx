import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/ui/Authx.css'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'firebase'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
  },
})
